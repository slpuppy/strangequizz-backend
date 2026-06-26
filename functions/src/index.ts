import * as admin from "firebase-admin";

admin.initializeApp();

export {generateDailyQuestions} from "./questions/generate";
export {triggerEngagementNotification} from "./notifications/engagement";
