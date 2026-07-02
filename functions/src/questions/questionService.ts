import * as admin from "firebase-admin";
import {type GenerationConfig} from "../types";
import {dateKeyDaysAgo} from "../shared/dateUtils";

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
  const keys = Array.from(
      {length: days}, (_, i) => dateKeyDaysAgo(i + 1)
  );
  const snaps = await Promise.all(
      keys.map((key) => db.collection("questions").doc(key).get())
  );
  return snaps
      .filter((snap) => snap.exists && Array.isArray(snap.data()?.themes))
      .flatMap((snap) => snap.data()?.themes as string[]);
}

/**
 * Fetches the generation config from Firestore.
 * @param {admin.firestore.Firestore} db - Firestore instance.
 * @return {Promise<GenerationConfig>} The generation config.
 */
export async function fetchGenerationConfig(
    db: admin.firestore.Firestore
): Promise<GenerationConfig> {
  const snap = await db
      .collection("questionConfig").doc("generationConfig").get();
  if (!snap.exists) {
    throw new Error(
        "No generationConfig found at /questionConfig/generationConfig"
    );
  }
  return snap.data() as GenerationConfig;
}
