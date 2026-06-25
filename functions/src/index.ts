import {onSchedule} from "firebase-functions/v2/scheduler";
import {defineSecret} from "firebase-functions/params";
import * as admin from "firebase-admin";
import Anthropic from "@anthropic-ai/sdk";

admin.initializeApp();

const anthropicKey = defineSecret("ANTHROPIC_API_KEY");

// Fixed per-index values — Claude only generates creative content
const QUESTION_NUMS = [
  "First question", "Second question", "Third question",
  "Fourth question", "Fifth question", "Sixth question",
  "Seventh question", "Eighth question", "Ninth question",
  "Tenth question", "Eleventh question",
];

const IMAGE_NAMES = [
  "circle", "clock", "face", "pendu", "eye",
  "pyr", "magik", "hand", "brain", "ohboy", "confused",
];

const ANIMATION_TYPES = [
  "rotate", "pendulum", "pendulum", "pendulum", "rotate",
  "rotate", "rotate", "rotate", "pendulum", "pendulum", "rotate",
];

interface RawQuestion {
  question: string;
  answer1: string;
  answer2: string;
  answer3: string;
  rightAnswer: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns today's date formatted as YYYY-MM-DD.
 * @return {string} The formatted date string.
 */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Validates that Claude returned exactly 11 well-formed questions.
 * @param {RawQuestion[]} questions - Array of raw questions from Claude.
 * @return {boolean} True if valid.
 */
function validate(questions: RawQuestion[]): boolean {
  if (questions.length !== 11) return false;
  return questions.every(
      (q) =>
        q.question && q.answer1 && q.answer2 && q.answer3 &&
        [q.answer1, q.answer2, q.answer3].includes(q.rightAnswer)
  );
}

/**
 * Enriches raw Claude output with structural fields the app needs.
 * @param {RawQuestion[]} questions - Array of raw questions from Claude.
 * @return {object[]} Enriched question objects.
 */
function enrich(questions: RawQuestion[]) {
  return questions.map((q, i) => ({
    ...q,
    questionNum: QUESTION_NUMS[i],
    questionImage: IMAGE_NAMES[i],
    animationType: ANIMATION_TYPES[i],
  }));
}

// ─── Cloud Function ──────────────────────────────────────────────────────────

export const generateDailyQuestions = onSchedule(
    {
      schedule: "0 0 * * *",
      timeZone: "UTC",
      secrets: [anthropicKey],
    },
    async () => {
      const db = admin.firestore();
      const today = todayKey();

      try {
      // Read customisable prompt from Firestore
        const configSnap = await db
            .collection("config").doc("questionPrompt").get();
        const prompt = configSnap.data()?.prompt as string | undefined;

        if (!prompt) {
          throw new Error("No prompt found at /config/questionPrompt");
        }

        // Call Claude
        const client = new Anthropic({apiKey: anthropicKey.value()});
        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          messages: [{role: "user", content: prompt}],
        });

        const raw = response.content[0] as { type: string; text: string };
        const text = raw.text;
        const parsed = JSON.parse(text) as { questions: RawQuestion[] };

        if (!validate(parsed.questions)) {
          const count = parsed.questions?.length ?? 0;
          throw new Error(
              `Validation failed: got ${count} questions` +
              " or rightAnswer mismatch"
          );
        }

        await db
            .collection("questions")
            .doc(today)
            .set({
              questions: enrich(parsed.questions),
              generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

        console.log(`✓ Generated 11 questions for ${today}`);
      } catch (error) {
        console.error(
            `✗ Generation failed for ${today}, falling back to default:`,
            error
        );

        // Copy questions/default as today's fallback
        const defaultSnap = await db
            .collection("questions").doc("default").get();
        if (defaultSnap.exists) {
          await db
              .collection("questions")
              .doc(today)
              .set({
                ...defaultSnap.data(),
                generatedAt: admin.firestore.FieldValue.serverTimestamp(),
                fallback: true,
              });
          console.log(`✓ Copied questions/default as fallback for ${today}`);
        }
      }
    }
);
