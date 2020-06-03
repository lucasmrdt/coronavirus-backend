import * as admin from 'firebase-admin';

import {FAKE_DATA_PREFIX, REAL_DATA_PREFIX} from '@/config';
import {log} from '@/logger';
import {Country} from '@/Country';

import {
  COUNTRIES_ID_BY_PUSH_TOKEN,
  PUSH_TOKENS_BY_COUNTRY_REF,
} from './notification.constants';

export const fakePushTokensByCountryRef = admin
  .database()
  .ref(`${FAKE_DATA_PREFIX}_${PUSH_TOKENS_BY_COUNTRY_REF}`);
export const realPushTokensByCountryRef = admin
  .database()
  .ref(`${REAL_DATA_PREFIX}_${PUSH_TOKENS_BY_COUNTRY_REF}`);

export const fakeCountriesIdByPushTokenRef = admin
  .database()
  .ref(`${FAKE_DATA_PREFIX}_${COUNTRIES_ID_BY_PUSH_TOKEN}`);
export const realCountriesIdByPushTokenRef = admin
  .database()
  .ref(`${REAL_DATA_PREFIX}_${COUNTRIES_ID_BY_PUSH_TOKEN}`);

const getPushTokensByCountryRef = (needFake: boolean) =>
  needFake ? fakePushTokensByCountryRef : realPushTokensByCountryRef;
const getCountriesIdByPushTokenRef = (needFake: boolean) =>
  needFake ? fakeCountriesIdByPushTokenRef : realCountriesIdByPushTokenRef;

export const getWatchersForCountry = (country: Country, needFake: boolean) =>
  new Promise<string[]>((res, rej) =>
    getPushTokensByCountryRef(needFake)
      .child(country.id)
      .once(
        'value',
        snapshot => {
          const value = snapshot.val();
          res(Array.isArray(value) ? value : []);
        },
        rej,
      ),
  );

export const getWatchedCountriesIdForUser = (
  pushId: string,
  needFake: boolean,
) =>
  new Promise<string[]>((res, rej) =>
    getCountriesIdByPushTokenRef(needFake)
      .child(pushId)
      .once(
        'value',
        snapshot => {
          const value = snapshot.val();
          res(Array.isArray(value) ? value : []);
        },
        rej,
      ),
  );

export const addWatcherForCountry = async (
  country: Country,
  pushId: string,
  needFake: boolean,
) => {
  const watchers = await getWatchersForCountry(country, needFake);
  const countriesId = await getWatchedCountriesIdForUser(pushId, needFake);
  if (watchers.includes(pushId)) {
    log(
      needFake,
      `user "${pushId}" has already watch country "${
        country.name
      }|${country.subName || 'global'}"`,
    );
    return;
  }
  log(
    needFake,
    `add watcher "${pushId}" for country "${country.name}|${country.subName ||
      'global'}"`,
  );
  await getCountriesIdByPushTokenRef(needFake)
    .child(pushId)
    .set([...countriesId, country.id]);
  await getPushTokensByCountryRef(needFake)
    .child(country.id)
    .set([...watchers, pushId]);
};

export const removeWatcherForCountry = async (
  country: Country,
  pushId: string,
  needFake: boolean,
) => {
  const watchers = await getWatchersForCountry(country, needFake);
  const countriesId = await getWatchedCountriesIdForUser(pushId, needFake);
  if (!watchers.includes(pushId)) {
    log(
      needFake,
      `user "${pushId}" hasn't yet watch country "${
        country.name
      }|${country.subName || 'global'}"`,
    );
    return;
  }
  log(
    needFake,
    `remove watcher "${pushId}" for country "${
      country.name
    }|${country.subName || 'global'}"`,
  );
  const newWatchers = watchers.filter(watcher => watcher !== pushId);
  const newCountriesId = countriesId.filter(
    countryId => countryId !== country.id,
  );
  await getCountriesIdByPushTokenRef(needFake)
    .child(pushId)
    .set(newCountriesId);
  await getPushTokensByCountryRef(needFake)
    .child(country.id)
    .set(newWatchers);
};
