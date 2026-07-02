import {type GenerationConfig, type QuestionBrief} from "../types";
import {pickOne, pickN} from "./questionUtils";

export interface BuiltPrompt {
  briefs: QuestionBrief[];
  examplesUsed: string[];
  fullPrompt: string;
}

/**
 * Builds the full prompt to send to Claude from its constituent parts.
 * @param {string} basePrompt - Base instructions from Firestore.
 * @param {GenerationConfig} config - Generation config with pools.
 * @param {string[]} recentThemes - Themes to avoid from recent days.
 * @return {BuiltPrompt} The assembled prompt and metadata for logging.
 */
export function buildPrompt(
    basePrompt: string,
    config: GenerationConfig,
    recentThemes: string[]
): BuiltPrompt {
  const examples = pickN(config.examplePool, config.exampleCount);
  const examplesBlock = "\n\nHere are examples of the tone and style" +
    " to match:\n" +
    examples.map((e) =>
      `- "${e.question}" → answers: "${e.answer1}"` +
      ` / "${e.answer2}" / "${e.answer3}"` +
      ` → right: "${e.rightAnswer}"`
    ).join("\n");

  const briefs: QuestionBrief[] = Array.from({length: 11}, () => ({
    topic: pickOne(config.topics),
    angle: pickOne(config.angles),
    answerType: pickOne(config.answerTypes),
    structure: pickOne(config.structures),
  }));
  const briefsBlock = "\n\nGenerate exactly 11 questions, one per brief" +
    " below. Follow each brief precisely:\n" +
    briefs.map((b, i) =>
      `${i + 1}. Topic: ${b.topic} | Angle: ${b.angle}` +
      ` | Answer type: ${b.answerType} | Structure: ${b.structure}`
    ).join("\n");

  const avoidBlock = recentThemes.length > 0 ?
    "\n\nDo NOT enter any of these recently used thematic territories" +
    " — avoid even subtle variations:\n" +
    recentThemes.map((t) => `- ${t}`).join("\n") :
    "";

  const formatBlock = "\n\nReturn ONLY valid JSON, no markdown, no" +
    " explanation, no code fences. Exact shape:\n" +
    "{ \"questions\": [{ \"question\": \"...\", \"answer1\": \"...\"," +
    " \"answer2\": \"...\", \"answer3\": \"...\", \"rightAnswer\":" +
    " \"...\" }], \"themes\": [\"...\", ...] }\n\n" +
    "The \"themes\" array must have exactly 11 entries, one per" +
    " question in order. Each entry is a short specific descriptor" +
    " of the exact concept covered (up to 8 words) — not a category" +
    " label. Good: \"why building is called building if already" +
    " built\". Bad: \"architectural wordplay\".";

  return {
    briefs,
    examplesUsed: examples.map((e) => e.question),
    fullPrompt: basePrompt + examplesBlock + briefsBlock +
      avoidBlock + formatBlock,
  };
}
