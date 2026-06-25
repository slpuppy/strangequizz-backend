const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("../service-account.json");

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

// ─── Content ─────────────────────────────────────────────────────────────────

const endGameOver = {
  label1: "You tried so hard and got so far",
  label2: "but in the end...",
  label3: "And because this quizz is strange, unfortunatelly...",
  title: "You lost forever",
  subtitle: "just kidding you lost today, and tomorrow is another day",
  buttons: [{ title: "come back tomorrow" }],
  images: [{ url: "penrose.png" }],
};

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  await db.collection("settings").doc("app").set(
    { dailyAttempts: 3 },
    { merge: true }
  );
  console.log("✓ Seeded settings/app → dailyAttempts: 3");

  await db.collection("content").doc("end_gameOver").set(endGameOver);
  console.log("✓ Seeded content/end_gameOver");

  await db.collection("content").doc("main").set(
    { label1: "you're done for today, stranger" },
    { merge: true }
  );
  console.log("✓ Seeded content/main → label1 (locked subtitle)");

  process.exit(0);
}

seed().catch((err) => {
  console.error("✗ Seed failed:", err);
  process.exit(1);
});
