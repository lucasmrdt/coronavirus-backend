import * as admin from "firebase-admin";
import { MedicalCase } from "./medical.type";
import { MEDICAL_REF_KEY } from "./medical.constants";

export const medicalRef = admin.database().ref(MEDICAL_REF_KEY);

export const getDBMedicalCases = () =>
  new Promise<Map<string, MedicalCase>>((res, rej) =>
    medicalRef.once(
      "value",
      snapshot => {
        let value = snapshot.val();

        if (!Array.isArray(value)) {
          value = [];
        }
        res(
          new Map(
            value
              .filter((medicalCase?: MedicalCase) => medicalCase)
              .map((medicalCase: MedicalCase) => [medicalCase.id, medicalCase])
          )
        );
      },
      rej
    )
  );

export const updateDBMedicalCases = (medicalCase: MedicalCase) => {
  return medicalRef.child(medicalCase.id).set(medicalCase);
};
