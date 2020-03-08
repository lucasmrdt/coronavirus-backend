require("firebase-functions");
import * as admin from "firebase-admin";

admin.initializeApp();

export * from "./Medical/medical.functions";
export * from "./Notification/notification.functions";
