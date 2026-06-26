import {onSchedule} from "firebase-functions/v2/scheduler";
import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {sendEngagementPush} from "./send";

const notificationSecret = defineSecret("NOTIFICATION_TRIGGER_SECRET");

export const scheduledEngagementNotification = onSchedule(
    {
      schedule: "0 2 * * *",
      timeZone: "UTC",
    },
    async () => {
      await sendEngagementPush();
    }
);

export const triggerEngagementNotification = onRequest(
    {secrets: [notificationSecret]},
    async (req, res) => {
      const secret = req.headers["x-trigger-secret"];
      if (secret !== notificationSecret.value()) {
        res.status(401).send("Unauthorized");
        return;
      }
      await sendEngagementPush();
      res.status(200).send("Notifications sent");
    }
);
