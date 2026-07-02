import {onSchedule} from "firebase-functions/v2/scheduler";
import {defineSecret} from "firebase-functions/params";
import * as admin from "firebase-admin";
import Anthropic from "@anthropic-ai/sdk";
import {type ClaudeResponse} from "../types";
import {todayKey} from "../shared/dateUtils";
import {fetchRecentThemes, fetchGenerationConfig} from "./questionService";
import {validate, enrich} from "./questionUtils";
import {buildPrompt} from "./promptBuilder";
import {enqueueNotification} from "../notifications/notificationService";

const anthropicKey = defineSecret("ANTHROPIC_API_KEY");
const notificationSecret = defineSecret("NOTIFICATION_TRIGGER_SECRET");

export const generateDailyQuestions = onSchedule(
    {
      schedule: "0 0 * * *",
      timeZone: "UTC",
      secrets: [anthropicKey, notificationSecret],
    },
    async () => {
      const db = admin.firestore();
      const today = todayKey();

      const existing = await db.collection("questions").doc(today).get();
      if (existing.exists) {
        console.log(`✓ Questions for ${today} already exist, skipping`);
        return;
      }

      try {
        const configSnap = await db
            .collection("questionConfig").doc("questionPrompt").get();
        const basePrompt = configSnap.data()?.prompt as string | undefined;

        if (!basePrompt) {
          throw new Error(
              "No prompt found at /questionConfig/questionPrompt"
          );
        }

        const [recentThemes, config] = await Promise.all([
          fetchRecentThemes(db, 7),
          fetchGenerationConfig(db),
        ]);

        const {briefs, examplesUsed, fullPrompt} = buildPrompt(
            basePrompt, config, recentThemes
        );

        await db.collection("questionConfig").doc("usedPrompts")
            .collection("prompts").doc(today).set({
              themesInjected: recentThemes,
              briefsUsed: briefs,
              examplesUsed,
              fullPrompt,
              generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

        const client = new Anthropic({apiKey: anthropicKey.value()});
        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          messages: [{role: "user", content: fullPrompt}],
        });

        const raw = response.content[0] as {type: string; text: string};
        const rawText = raw.text
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/, "")
            .trim();
        const parsed = JSON.parse(rawText) as ClaudeResponse;

        if (!validate(parsed.questions)) {
          const count = parsed.questions?.length ?? 0;
          throw new Error(
              `Validation failed: got ${count} questions` +
              " or rightAnswer mismatch"
          );
        }

        const themes = Array.isArray(parsed.themes) ? parsed.themes : [];

        await db.collection("questions").doc(today).set({
          questions: enrich(parsed.questions),
          themes,
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`✓ Generated 11 questions for ${today}`);
        await enqueueNotification(db, notificationSecret.value());
      } catch (error) {
        console.error(
            `✗ Generation failed for ${today}, falling back to default:`,
            error
        );

        const defaultSnap = await db
            .collection("questions").doc("default").get();
        if (defaultSnap.exists) {
          await db.collection("questions").doc(today).set({
            ...defaultSnap.data(),
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            fallback: true,
          });
          console.log(
              `✓ Copied questions/default as fallback for ${today}`
          );
        }
      }
    }
);
