import {RawQuestion} from "../types";
import {QUESTION_NUMS, IMAGE_NAMES, ANIMATION_TYPES} from "./constants";

/**
 * Picks one random item from an array.
 * @param {T[]} array - The source array.
 * @return {T} A random item.
 */
export function pickOne<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Picks n random items from an array without repetition.
 * @param {T[]} array - The source array.
 * @param {number} n - Number of items to pick.
 * @return {T[]} Array of n random items.
 */
export function pickN<T>(array: T[], n: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, array.length));
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
