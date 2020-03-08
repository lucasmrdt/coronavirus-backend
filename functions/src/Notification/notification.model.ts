import * as admin from "firebase-admin";
import { log } from "../logger";
import { MedicalCase } from "../Medical";

const notificationRef = admin.database().ref("/notifications");

export const getWatchersForCase = (medicalCase: MedicalCase) =>
  new Promise<string[]>((res, rej) =>
    notificationRef.child(medicalCase.id).once(
      "value",
      snapshot => {
        const value = snapshot.val();
        res(Array.isArray(value) ? value : []);
      },
      rej
    )
  );

export const addWatcherForCase = async (
  medicalCase: MedicalCase,
  pushId: string
) => {
  const watchers = await getWatchersForCase(medicalCase);
  if (watchers.includes(pushId)) {
    log(`user "${pushId}" has already watch country "${medicalCase}"`);
    return;
  }
  log(`add watcher "${pushId}" for country "${medicalCase}"`);
  return notificationRef.child(medicalCase.id).update([...watchers, pushId]);
};

export const removeWatcherForCase = async (
  medicalCase: MedicalCase,
  pushId: string
) => {
  const watchers = await getWatchersForCase(medicalCase);
  if (!watchers.includes(pushId)) {
    log(`user "${pushId}" hasn't yet watch country "${medicalCase}"`);
    return;
  }
  log(`remove watcher "${pushId}" for country "${medicalCase}"`);
  const newWatchers = watchers.filter(watcher => watcher !== pushId);
  return notificationRef.child(medicalCase.id).update(newWatchers);
};
