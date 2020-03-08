import * as functions from "firebase-functions";
import * as moment from "moment";
import { log } from "../logger";
import { getAPIMedicalCases } from "./medical.api";
import { updateDBMedicalCases, getDBMedicalCases } from "./medical.model";

async function refreshMedicalCases() {
  log(`[MEDICAL_REFRESH]`);

  const apiCases = await getAPIMedicalCases();
  const dbCases = await getDBMedicalCases();

  const updates: Promise<any>[] = [];
  apiCases.forEach((apiValue, key) => {
    const dbValue = dbCases.get(key);
    if (!dbValue || dbValue.apiLastUpdate !== apiValue.apiLastUpdate) {
      const prevDate = moment(dbValue?.apiLastUpdate).calendar();
      const newDate = moment(apiValue?.apiLastUpdate).calendar();
      log(
        `[MEDICAL_NEW_VERSION] (${apiValue.country}) ${prevDate} ➡️ ${newDate}`
      );
      updates.push(updateDBMedicalCases(apiValue));
    }
  });
  await Promise.all(updates);
}

export const scheduleRefreshMedicalCases = functions.pubsub
  .schedule("*/30 * * * *")
  .onRun(refreshMedicalCases);

export const launchRefreshMedicalCases = functions.https.onRequest(
  async (_, res) => {
    await refreshMedicalCases();
    res.status(200).json({ success: true });
  }
);
