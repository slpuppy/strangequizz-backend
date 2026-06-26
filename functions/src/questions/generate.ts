import {onSchedule} from "firebase-functions/v2/scheduler";
import {defineSecret} from "firebase-functions/params";
import * as admin from "firebase-admin";
import Anthropic from "@anthropic-ai/sdk";
import {RawQuestion} from "../types";
import {todayKey, fetchRecentQuestions, validate, enrich} from "./helpers";

const anthropicKey = defineSecret("ANTHROPIC_API_KEY");

export const generateDailyQuestions = onSchedule(
    {
      schedule: "0 0 * * *",
      timeZone: "UTC",
      secrets: [anthropicKey],
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
        const prompt = configSnap.data()?.prompt as string | undefined;

        if (!prompt) {
          throw new Error(
              "No prompt found at /questionConfig/questionPrompt"
          );
        }

        const recentQuestions = await fetchRecentQuestions(db, 2);
        const avoidBlock = recentQuestions.length > 0 ?
          "\n\nDo NOT reuse these recently shown questions or their themes:\n" +
          recentQuestions.map((q) => `- "${q}"`).join("\n") :
          "";
        const fullPrompt = prompt + avoidBlock;

        const client = new Anthropic({apiKey: anthropicKey.value()});
        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          messages: [{role: "user", content: fullPrompt}],
        });

        const raw = response.content[0] as { type: string; text: string };
        const parsed = JSON.parse(raw.text) as { questions: RawQuestion[] };

        if (!validate(parsed.questions)) {
          const count = parsed.questions?.length ?? 0;
          throw new Error(
              `Validation failed: got ${count} questions` +
              " or rightAnswer mismatch"
          );
        }

        await db.collection("questions").doc(today).set({
          questions: enrich(parsed.questions),
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`✓ Generated 11 questions for ${today}`);
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
          console.log(`✓ Copied questions/default as fallback for ${today}`);
        }
      }
    }
);
