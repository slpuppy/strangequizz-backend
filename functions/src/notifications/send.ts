import * as admin from "firebase-admin";

/**
 * Reads notification copy from Firestore and sends to all device tokens.
 * Cleans up stale tokens automatically.
 * @return {Promise<void>}
 */
export async function sendEngagementPush(): Promise<void> {
  const db = admin.firestore();

  const notifSnap = await db
      .collection("settings").doc("notification").get();
  const title = notifSnap.data()?.title as string | undefined;
  const body = notifSnap.data()?.body as string | undefined;
  const sound = (notifSnap.data()?.sound as string | undefined) ?? "default";

  if (!title || !body) {
    throw new Error("Missing title or body in settings/notification");
  }

  const devicesSnap = await db.collection("devices").get();
  const tokens = devicesSnap.docs.map((d) => d.data().token as string);

  if (tokens.length === 0) {
    console.log("✓ No device tokens found, skipping send");
    return;
  }

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {title, body},
    apns: {
      payload: {
        aps: {sound},
      },
    },
  });

  console.log(`✓ Sent ${response.successCount}/${tokens.length} notifications`);

  const staleTokens: string[] = [];
  response.responses.forEach((res, i) => {
    if (res.error) {
      console.error(`✗ Token[${i}] error: ${res.error.code}`, res.error);
    }
    if (res.error?.code === "messaging/registration-token-not-registered") {
      staleTokens.push(tokens[i]);
    }
  });

  if (staleTokens.length > 0) {
    const batch = db.batch();
    staleTokens.forEach((token) => {
      batch.delete(db.collection("devices").doc(token));
    });
    await batch.commit();
    console.log(`✓ Removed ${staleTokens.length} stale tokens`);
  }
}
