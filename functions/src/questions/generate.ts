import {onSchedule} from "firebase-functions/v2/scheduler";
import {defineSecret} from "firebase-functions/params";
import * as admin from "firebase-admin";
import {CloudTasksClient} from "@google-cloud/tasks";
import Anthropic from "@anthropic-ai/sdk";
import {ClaudeResponse} from "../types";
import {todayKey, fetchRecentThemes, validate, enrich} from "./helpers";

const anthropicKey = defineSecret("ANTHROPIC_API_KEY");
const notificationSecret = defineSecret("NOTIFICATION_TRIGGER_SECRET");

const PROJECT_ID = "strangequizz";
const QUEUE_LOCATION = "us-central1";
const QUEUE_NAME = "notifications-queue";

/**
 * Reads delayMinutes and triggerUrl from Firestore and enqueues a Cloud Task.
 * @param {admin.firestore.Firestore} db - Firestore instance.
 * @param {string} secret - The notification trigger secret value.
 * @return {Promise<void>}
 */
async function enqueueNotification(
    db: admin.firestore.Firestore,
    secret: string
): Promise<void> {
  const snap = await db.collection("settings").doc("notification").get();
  const delayMinutes = (snap.data()?.delayMinutes as number | undefined) ?? 120;
  const triggerUrl = snap.data()?.triggerUrl as string | undefined;

  if (!triggerUrl) {
    console.error("✗ Missing triggerUrl in settings/notification, skipping");
    return;
  }

  const client = new CloudTasksClient();
  const queue = client.queuePath(PROJECT_ID, QUEUE_LOCATION, QUEUE_NAME);
  const scheduleTime = Math.floor(Date.now() / 1000) + delayMinutes * 60;

  await client.createTask({
    parent: queue,
    task: {
      scheduleTime: {seconds: scheduleTime},
      httpRequest: {
        httpMethod: "POST" as const,
        url: triggerUrl,
        headers: {"x-trigger-secret": secret},
      },
    },
  });

  console.log(
      `✓ Notification enqueued for ${delayMinutes} minutes from now`
  );
}

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
        const prompt = configSnap.data()?.prompt as string | undefined;

        if (!prompt) {
          throw new Error(
              "No prompt found at /questionConfig/questionPrompt"
          );
        }

        const recentThemes = await fetchRecentThemes(db, 7);
        const avoidBlock = recentThemes.length > 0 ?
          "\n\nDo NOT enter any of these recently used thematic territories" +
          " — avoid even subtle variations:\n" +
          recentThemes.map((t) => `- ${t}`).join("\n") :
          "";
        const fullPrompt = prompt + avoidBlock;

        await db.collection("questionConfig").doc("usedPrompts")
            .collection("prompts").doc(today).set({
              themesInjected: recentThemes,
              fullPrompt,
              generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

        const client = new Anthropic({apiKey: anthropicKey.value()});
        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          messages: [{role: "user", content: fullPrompt}],
        });

        const raw = response.content[0] as { type: string; text: string };
        const parsed = JSON.parse(raw.text) as ClaudeResponse;

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
          console.log(`✓ Copied questions/default as fallback for ${today}`);
        }
      }
    }
);
