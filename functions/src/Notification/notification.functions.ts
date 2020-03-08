import * as functions from "firebase-functions";
import { MEDICAL_REF_KEY, MedicalCase } from "../Medical";
import { log } from "../logger";
import { getWatchersForCase } from "./notification.model";

export const listeningMedicalUpdates = functions.database
  .ref(`${MEDICAL_REF_KEY}/{caseId}`)
  .onUpdate(async snapshot => {
    const medicalCase: MedicalCase = snapshot.after.val();
    const phoneIds = await getWatchersForCase(medicalCase);
    if (phoneIds.length === 0) {
      log(`[NOTIFICATION] (${medicalCase.country}) nobody to notify`);
      return;
    }
    log(
      `[NOTIFICATION] (${medicalCase.country}) notify "${phoneIds.length}" users`
    );
    // @todo
  });
