import fetch from "node-fetch";
import { API_ENDPOINT } from "./medical.constants";
import { MedicalCase } from "./medical.type";

interface APIResponse {
  features: Array<{
    attributes: {
      OBJECTID: string;
      Country_Region: string;
      Country_State: string;
      Last_Update: number;
      Lat: number;
      Long_: number;
      Confirmed: number;
      Deaths: number;
      Recovered: number;
    };
  }>;
}

export const getAPIMedicalCases = async () => {
  const res = await fetch(API_ENDPOINT);
  const data: APIResponse = await res.json();
  return new Map<string, MedicalCase>(
    data.features.map(({ attributes }) => [
      attributes.OBJECTID,
      {
        id: attributes.OBJECTID,
        apiLastUpdate: attributes.Last_Update,
        country: attributes.Country_Region,
        state: attributes.Country_State,
        lat: attributes.Lat,
        long: attributes.Long_,
        nbConfirmed: attributes.Confirmed,
        nbDeaths: attributes.Deaths,
        nbRecovered: attributes.Recovered
      }
    ])
  );
};
