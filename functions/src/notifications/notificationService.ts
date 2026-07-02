import * as admin from "firebase-admin";
import {CloudTasksClient} from "@google-cloud/tasks";

const PROJECT_ID = "strangequizz";
const QUEUE_LOCATION = "us-central1";
const QUEUE_NAME = "notifications-queue";

/**
 * Reads delayMinutes and triggerUrl from Firestore and enqueues a Cloud Task.
 * @param {admin.firestore.Firestore} db - Firestore instance.
 * @param {string} secret - The notification trigger secret value.
 * @return {Promise<void>}
 */
export async function enqueueNotification(
    db: admin.firestore.Firestore,
    secret: string
): Promise<void> {
  const snap = await db.collection("settings").doc("notification").get();
  const delayMinutes =
    (snap.data()?.delayMinutes as number | undefined) ?? 120;
  const triggerUrl = snap.data()?.triggerUrl as string | undefined;

  if (!triggerUrl) {
    console.error(
        "✗ Missing triggerUrl in settings/notification, skipping"
    );
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
