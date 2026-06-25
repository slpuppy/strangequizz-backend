const { initializeApp, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const { getFirestore } = require("firebase-admin/firestore");
const { GoogleAuth } = require("google-auth-library");
const serviceAccount = require("../service-account.json");

initializeApp({ credential: cert(serviceAccount) });

async function test() {
  // Step 1: verify we can get an OAuth token for FCM scope
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  console.log("OAuth token obtained:", tokenResponse.token ? "YES" : "NO");

  // Step 2: make a raw FCM HTTP v1 call to see the exact response
  const projectId = serviceAccount.project_id;
  const db = getFirestore();
  const devicesSnap = await db.collection("devices").get();
  const tokens = devicesSnap.docs.map((d) => d.data().token);
  console.log(`Found ${tokens.length} token(s)`);

  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const fetch = require("node-fetch");

  const body = JSON.stringify({
    message: {
      token: tokens[0],
      notification: { title: "Test", body: "Test notification" },
      apns: {
        payload: {
          aps: { sound: "default" },
        },
      },
    },
  });

  const res = await fetch(fcmUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenResponse.token}`,
      "Content-Type": "application/json",
    },
    body,
  });

  const json = await res.json();
  console.log("FCM HTTP status:", res.status);
  console.log("FCM response:", JSON.stringify(json, null, 2));

  process.exit(0);
}

test().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
