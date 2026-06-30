import * as admin from "firebase-admin";
import {RawQuestion} from "../types";
import {QUESTION_NUMS, IMAGE_NAMES, ANIMATION_TYPES} from "./constants";

/**
 * Returns today's date formatted as YYYY-MM-DD.
 * @return {string} The formatted date string.
 */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns the date key for N days ago.
 * @param {number} daysAgo - Number of days to go back.
 * @return {string} The formatted date string.
 */
export function dateKeyDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/**
 * Fetches themes from the last N days of generated questions.
 * @param {admin.firestore.Firestore} db - Firestore instance.
 * @param {number} days - Number of past days to fetch.
 * @return {Promise<string[]>} Flat array of recent theme strings.
 */
export async function fetchRecentThemes(
    db: admin.firestore.Firestore,
    days: number
): Promise<string[]> {
  const keys = Array.from({length: days}, (_, i) => dateKeyDaysAgo(i + 1));
  const snaps = await Promise.all(
      keys.map((key) => db.collection("questions").doc(key).get())
  );
  return snaps
      .filter((snap) => snap.exists && Array.isArray(snap.data()?.themes))
      .flatMap((snap) => snap.data()?.themes as string[]);
}

/**
 * Validates that Claude returned exactly 11 well-formed questions.
 * @param {RawQuestion[]} questions - Array of raw questions from Claude.
 * @return {boolean} True if valid.
 */
export function validate(questions: RawQuestion[]): boolean {
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
export function enrich(questions: RawQuestion[]) {
  return questions.map((q, i) => ({
    ...q,
    questionNum: QUESTION_NUMS[i],
    questionImage: IMAGE_NAMES[i],
    animationType: ANIMATION_TYPES[i],
  }));
}
