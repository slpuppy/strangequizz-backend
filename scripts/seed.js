const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("../service-account.json");

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

// ─── Questions ───────────────────────────────────────────────────────────────

const questions = [
  {
    question: "Why is there something instead of nothing?",
    questionNum: "First question",
    answer1: "They both co-exist",
    answer2: "obviously aliens",
    answer3: "I don't know",
    questionImage: "circle",
    rightAnswer: "obviously aliens",
    animationType: "rotate",
  },
  {
    question: "What is always coming but never arrives?",
    questionNum: "Second question",
    answer1: "my bus",
    answer2: "tomorrow",
    answer3: "the food I ordered",
    questionImage: "clock",
    rightAnswer: "tomorrow",
    animationType: "pendulum",
  },
  {
    question: "Whats the color of the dress?",
    questionNum: "Third question",
    answer1: "black and blue",
    answer2: "white and gold",
    answer3: "what dress?",
    questionImage: "face",
    rightAnswer: "black and blue",
    animationType: "pendulum",
  },
  {
    question: "What happens when you clean a vacuum cleaner?",
    questionNum: "Fourth question",
    answer1: "it becomes clean",
    answer2: "nothing",
    answer3: "you become a vacuum cleaner",
    questionImage: "pendu",
    rightAnswer: "you become a vacuum cleaner",
    animationType: "pendulum",
  },
  {
    question: "When did time begin?",
    questionNum: "Fifth question",
    answer1: "before it's existence",
    answer2: "wait. time is relative",
    answer3: "at 4:20",
    questionImage: "eye",
    rightAnswer: "wait. time is relative",
    animationType: "rotate",
  },
  {
    question: "So, what is time?",
    questionNum: "Sixth question",
    answer1: "time is space",
    answer2: "an illusion",
    answer3: "a pink floyd song?",
    questionImage: "pyr",
    rightAnswer: "a pink floyd song?",
    animationType: "rotate",
  },
  {
    question: "What is the closest thing to real magic?",
    questionNum: "Seventh question",
    answer1: "ilusionism",
    answer2: "chemestry",
    answer3: "placebo effect",
    questionImage: "magik",
    rightAnswer: "placebo effect",
    animationType: "rotate",
  },
  {
    question: "Why do cats purr?",
    questionNum: "Eighth question",
    answer1: "they're relaxed",
    answer2: "i think it depends",
    answer3: "they like you",
    questionImage: "hand",
    rightAnswer: "i think it depends",
    animationType: "rotate",
  },
  {
    question: "Why do we cook bacon and bake cookies?",
    questionNum: "Ninth question",
    answer1: "it's how food works",
    answer2: "great question",
    answer3: "terrible question",
    questionImage: "brain",
    rightAnswer: "it's how food works",
    animationType: "pendulum",
  },
  {
    question: "Fool me once shame on you, fool me twice?",
    questionNum: "Fake Last question",
    answer1: "i'm a fool",
    answer2: "wait, why this question is fake?",
    answer3: "shame on me?",
    questionImage: "ohboy",
    rightAnswer: "i'm a fool",
    animationType: "pendulum",
  },
  {
    question: "If the last question was the last then why this question exists?",
    questionNum: "Real Last question",
    answer1: "because it was the fake last question",
    answer2: "because this is the real last question",
    answer3: "because this quizz is strange",
    questionImage: "confused",
    rightAnswer: "because this quizz is strange",
    animationType: "rotate",
  },
];

// ─── Prompt ──────────────────────────────────────────────────────────────────

const questionPrompt = `You are generating questions for "The Strange Quizz" — a daily quiz of 11 absurdist, philosophical, and pop-culture questions. Questions should be weird, funny, or thought-provoking in an unconventional way. The "correct" answer follows the quizz's own strange logic, not necessarily real-world facts.

Here are examples of the tone and style to match:

- "Why is there something instead of nothing?" → answers: "They both co-exist" / "obviously aliens" / "I don't know" → right: "obviously aliens"
- "What is always coming but never arrives?" → answers: "my bus" / "tomorrow" / "the food I ordered" → right: "tomorrow"
- "What happens when you clean a vacuum cleaner?" → answers: "it becomes clean" / "nothing" / "you become a vacuum cleaner" → right: "you become a vacuum cleaner"
- "When did time begin?" → answers: "before it's existence" / "wait. time is relative" / "at 4:20" → right: "wait. time is relative"
- "So, what is time?" → answers: "time is space" / "an illusion" / "a pink floyd song?" → right: "a pink floyd song?"
- "What is the closest thing to real magic?" → answers: "ilusionism" / "chemestry" / "placebo effect" → right: "placebo effect"
- "Why do we cook bacon and bake cookies?" → answers: "it's how food works" / "great question" / "terrible question" → right: "it's how food works"

Notice: questions are short, answers are lowercase and conversational, the "right" answer is often the funniest or most unexpected one — not the factually correct one.

Generate a FRESH set of 11 questions in this exact style. Do not reuse the examples above.

Return ONLY valid JSON — no markdown, no explanation:
{
  "questions": [
    {
      "question": "...",
      "answer1": "...",
      "answer2": "...",
      "answer3": "...",
      "rightAnswer": "<must exactly match answer1, answer2, or answer3>"
    }
  ]
}

Generate exactly 11 questions.`;

// ─── Seed ────────────────────────────────────────────────────────────────────

async function seed() {
  await db.collection("questions").doc("default").set({ questions });
  console.log("✓ Seeded questions/default with 11 questions");

  await db.collection("questionConfig").doc("questionPrompt").set({
    prompt: questionPrompt,
    updatedAt: new Date(),
  });
  console.log("✓ Seeded config/questionPrompt");

  process.exit(0);
}

seed().catch((err) => {
  console.error("✗ Seed failed:", err);
  process.exit(1);
});
