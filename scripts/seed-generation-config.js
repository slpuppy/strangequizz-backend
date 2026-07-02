const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("../service-account.json");

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

// ─── Topics ───────────────────────────────────────────────────────────────────

const topics = [
  "music", "biology", "money", "dreams", "sports", "fashion", "mythology",
  "childhood", "mathematics", "social media", "cooking", "architecture",
  "language", "technology", "animals", "medicine", "weather", "emotions",
  "history", "space", "physics", "psychology", "art", "literature", "cinema",
  "philosophy", "relationships", "sleep", "memory", "time", "death",
  "identity", "humor", "nature", "politics",
];

// ─── Angles ───────────────────────────────────────────────────────────────────

const angles = [
  "language paradox — exploits a contradiction or absurdity in how we use words",
  "logical loop — following the logic leads back to itself",
  "social norm interrogation — questions why something universally accepted is done at all",
  "false assumption — challenges a premise everyone takes for granted",
  "definition collapse — asks what X really is until the concept falls apart",
  "causality flip — questions which caused which, or reverses cause and effect",
  "scale absurdity — takes something normal to an extreme or zero to reveal the absurdity",
  "comparison nobody makes — draws a parallel between two unrelated things that is surprisingly accurate",
];

// ─── Answer Types ─────────────────────────────────────────────────────────────

const answerTypes = [
  "absurdist deflection — answers with something completely unrelated but undeniably funny",
  "circular logic — the answer loops back to the question itself",
  "pop culture escape — exits the question into a movie, song, or cultural reference",
  "uncomfortable truth — the most honest answer nobody wants to say out loud",
  "non-answer acceptance — acknowledges the question is fundamentally unanswerable",
  "literal interpretation — takes the question at face value in an unexpected way",
];

// ─── Structures ───────────────────────────────────────────────────────────────

const structures = [
  "why is X called X if it's actually Y",
  "why do we X but Y",
  "if you do X to X, what happens",
  "which came first, X or Y",
  "at what point does X become Y",
  "is X the same as Y or completely different",
  "what's the difference between X and Y",
  "what is X, really",
  "when does X actually happen",
  "who decided X was a thing",
  "why does nobody talk about X",
  "who is X for, really",
  "why do we all pretend X isn't Y",
  "why do we need X if Y already exists",
  "what would happen if everyone stopped doing X",
  "what if X is actually Y all along",
  "can X exist without Y",
  "what happens when X runs out",
  "what would X say if it could talk",
  "how do you know X is real",
  "what comes after X",
  "what's the point of X if Y",
  "why does X feel like Y",
  "is X actually just Y with a different name",
  "what are we really doing when we do X",
];

// ─── Example Pool ─────────────────────────────────────────────────────────────

const examplePool = [
  {
    question: "Why is there something instead of nothing?",
    answer1: "they both co-exist", answer2: "obviously aliens", answer3: "I don't know",
    rightAnswer: "obviously aliens",
  },
  {
    question: "What is always coming but never arrives?",
    answer1: "my bus", answer2: "tomorrow", answer3: "the food I ordered",
    rightAnswer: "tomorrow",
  },
  {
    question: "What happens when you clean a vacuum cleaner?",
    answer1: "it becomes clean", answer2: "nothing", answer3: "you become a vacuum cleaner",
    rightAnswer: "you become a vacuum cleaner",
  },
  {
    question: "When did time begin?",
    answer1: "before it's existence", answer2: "wait. time is relative", answer3: "at 4:20",
    rightAnswer: "wait. time is relative",
  },
  {
    question: "So, what is time?",
    answer1: "time is space", answer2: "an illusion", answer3: "a pink floyd song?",
    rightAnswer: "a pink floyd song?",
  },
  {
    question: "What is the closest thing to real magic?",
    answer1: "ilusionism", answer2: "chemestry", answer3: "placebo effect",
    rightAnswer: "placebo effect",
  },
  {
    question: "Why do we cook bacon and bake cookies?",
    answer1: "it's how food works", answer2: "great question", answer3: "terrible question",
    rightAnswer: "it's how food works",
  },
  {
    question: "Why do we park in driveways and drive on parkways?",
    answer1: "english is lying to us", answer2: "someone got confused", answer3: "geography is a concept",
    rightAnswer: "english is lying to us",
  },
  {
    question: "Is a hot dog a sandwich?",
    answer1: "no", answer2: "yes, legally", answer3: "this question ends friendships",
    rightAnswer: "this question ends friendships",
  },
  {
    question: "What came before the universe?",
    answer1: "nothing, but weird nothing", answer2: "another universe's mistakes", answer3: "the concept of before didn't exist yet",
    rightAnswer: "the concept of before didn't exist yet",
  },
  {
    question: "Why do we say we 'catch' a cold if it catches us?",
    answer1: "because we're in denial", answer2: "germs have better reflexes", answer3: "language is a lie",
    rightAnswer: "germs have better reflexes",
  },
  {
    question: "What do fish think about all day?",
    answer1: "water", answer2: "nothing, they reset every 3 seconds", answer3: "the concept of outside",
    rightAnswer: "the concept of outside",
  },
  {
    question: "Why does round pizza come in a square box?",
    answer1: "circles are harder to fold", answer2: "the box industry won", answer3: "nobody questioned it",
    rightAnswer: "the box industry won",
  },
  {
    question: "What happens to your lap when you stand up?",
    answer1: "it escapes", answer2: "it never existed", answer3: "it goes to your knees",
    rightAnswer: "it never existed",
  },
  {
    question: "Why is abbreviation such a long word?",
    answer1: "irony", answer2: "it's not done yet", answer3: "the inventor had a bad day",
    rightAnswer: "irony",
  },
  {
    question: "What's the sound of one hand clapping?",
    answer1: "wind", answer2: "a high five with yourself", answer3: "jazz",
    rightAnswer: "a high five with yourself",
  },
  {
    question: "If you hate losing socks in the dryer, where do they go?",
    answer1: "a better dimension", answer2: "they were never real", answer3: "the dryer keeps them",
    rightAnswer: "a better dimension",
  },
  {
    question: "Can something be new and improved at the same time?",
    answer1: "no", answer2: "yes, it's marketing", answer3: "only if it was broken before",
    rightAnswer: "yes, it's marketing",
  },
  {
    question: "Why do we say goodbye if we might see each other again?",
    answer1: "optimism is exhausting", answer2: "goodbye is a lie we tell ourselves", answer3: "it's practice",
    rightAnswer: "goodbye is a lie we tell ourselves",
  },
  {
    question: "What is the color of wind?",
    answer1: "clear", answer2: "whatever direction it's going", answer3: "it doesn't have one and that's the problem",
    rightAnswer: "whatever direction it's going",
  },
  {
    question: "What's the opposite of a synonym?",
    answer1: "a word", answer2: "an antonym", answer3: "a synonym, obviously",
    rightAnswer: "a synonym, obviously",
  },
  {
    question: "Why do we say 'heads up' when we mean duck?",
    answer1: "english evolved wrong", answer2: "someone panicked and it stuck", answer3: "nobody knows and nobody's fixing it",
    rightAnswer: "nobody knows and nobody's fixing it",
  },
  {
    question: "If you told a joke in an empty room, is it still funny?",
    answer1: "no", answer2: "funnier actually", answer3: "the room laughs eventually",
    rightAnswer: "funnier actually",
  },
  {
    question: "What came after the last thing?",
    answer1: "nothing", answer2: "this question", answer3: "a brief silence",
    rightAnswer: "this question",
  },
  {
    question: "Why do we call it a 'rush hour' when nothing moves?",
    answer1: "optimism died there", answer2: "time flies when you're furious", answer3: "the name is the joke",
    rightAnswer: "the name is the joke",
  },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  await db.collection("questionConfig").doc("generationConfig").set({
    topics,
    angles,
    answerTypes,
    structures,
    examplePool,
    exampleCount: 6,
  });

  console.log("✓ Seeded questionConfig/generationConfig");
  console.log(`  → ${topics.length} topics`);
  console.log(`  → ${angles.length} angles`);
  console.log(`  → ${answerTypes.length} answer types`);
  console.log(`  → ${structures.length} structures`);
  console.log(`  → ${examplePool.length} example questions`);
  console.log(`  → exampleCount: 6`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("✗ Seed failed:", err);
  process.exit(1);
});
