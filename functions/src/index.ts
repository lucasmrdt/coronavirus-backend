require("firebase-functions");
import * as admin from "firebase-admin";

admin.initializeApp();

export * from "./Country/country.functions";
export * from "./Notification/notification.functions";
