export interface RawQuestion {
  question: string;
  answer1: string;
  answer2: string;
  answer3: string;
  rightAnswer: string;
}

export interface ClaudeResponse {
  questions: RawQuestion[];
  themes: string[];
}

export interface QuestionBrief {
  topic: string;
  angle: string;
  answerType: string;
}

export interface GenerationConfig {
  topics: string[];
  angles: string[];
  answerTypes: string[];
  examplePool: RawQuestion[];
  exampleCount: number;
}
