import * as admin from 'firebase-admin';

import {FAKE_DATA_PREFIX, REAL_DATA_PREFIX} from '@/config';

import {COUNTRY_REF_KEY, HISTORY_REF_KEY} from './country.constants';
import {Country, CountryHistory} from './country.type';

export const fakeCountryRef = admin
  .database()
  .ref(`${FAKE_DATA_PREFIX}_${COUNTRY_REF_KEY}`);
export const realCountryRef = admin
  .database()
  .ref(`${REAL_DATA_PREFIX}_${COUNTRY_REF_KEY}`);

export const fakeHistoryRef = admin
  .database()
  .ref(`${FAKE_DATA_PREFIX}_${HISTORY_REF_KEY}`);
export const realHistoryRef = admin
  .database()
  .ref(`${REAL_DATA_PREFIX}_${HISTORY_REF_KEY}`);

const getCountryRef = (needFake: boolean) =>
  needFake ? fakeCountryRef : realCountryRef;
const getHistoryRef = (needFake: boolean) =>
  needFake ? fakeHistoryRef : realHistoryRef;

export const getDBCountries = (needFake: boolean) =>
  new Promise<{[key: string]: Country}>((res, rej) =>
    getCountryRef(needFake).once(
      'value',
      snapshot => {
        let value = snapshot.val();
        res(value);
      },
      rej,
    ),
  );

export const getDBCountry = (id: string, needFake: boolean) =>
  new Promise<Country>((res, rej) =>
    getCountryRef(needFake)
      .child(id)
      .once(
        'value',
        snapshot => {
          const country = snapshot.val();
          if (country) {
            res(country);
          } else {
            rej(new Error(`unfound country for id '${id}'`));
          }
        },
        rej,
      ),
  );

export const updateDBCountry = (country: Country, needFake: boolean) => {
  return getCountryRef(needFake)
    .child(country.id)
    .update(country);
};

export const updateDBCountries = (
  countries: {[key: string]: Country},
  needFake: boolean,
) => {
  return getCountryRef(needFake).set(countries);
};

export const updateDBHistories = (
  histories: {
    [key: string]: CountryHistory;
  },
  needFake: boolean,
) => {
  return getHistoryRef(needFake).set(histories);
};
