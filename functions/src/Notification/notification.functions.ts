import * as functions from 'firebase-functions';

import {log} from '@/logger';
import {FAKE_DATA_PREFIX, REAL_DATA_PREFIX} from '@/config';
import {
  COUNTRY_REF_KEY,
  Country,
  getDBCountry,
  getDBCountries,
  hasChanged,
} from '@/Country';

import {
  addWatcherForCountry,
  removeWatcherForCountry,
  getWatchersForCountry,
} from './notification.model';
import {sendCountryUpdateNotification} from './notification.api';

// @xxx WATCH COUNTRY UPDATE
const getOnUpdate = (needFake: boolean) => async (
  snapshot: functions.Change<functions.database.DataSnapshot>,
) => {
  const before: Country = snapshot.before.val();
  const after: Country = snapshot.after.val();

  if (!before || hasChanged(before, after)) {
    const watchers = await getWatchersForCountry(after, needFake);
    if (watchers.length) {
      log(needFake, `[NOTIFY] (${after.name}|${after.subName || 'global'})`);
      await sendCountryUpdateNotification(watchers, before, after);
    }
  }
};

const fakeOnUpdate = getOnUpdate(true);
const realOnUpdate = getOnUpdate(false);

export const watchCountryUpdateA = functions.database
  .ref(`${FAKE_DATA_PREFIX}_${COUNTRY_REF_KEY}/{countryId}`)
  .onUpdate(fakeOnUpdate);

export const watchCountryUpdateB = functions.database
  .ref(`${REAL_DATA_PREFIX}_${COUNTRY_REF_KEY}/{countryId}`)
  .onUpdate(realOnUpdate);

// @xxx SUBSCRIBE TO COUNTRY
const getOnSubscribeToCountry = (needFake: boolean) => async (data: any) => {
  const {pushToken, countryId} = data;

  if (
    !pushToken ||
    typeof pushToken !== 'string' ||
    !countryId ||
    typeof countryId !== 'string'
  ) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'invalid push token or country id provided',
    );
  }

  let country: Country;
  try {
    country = await getDBCountry(countryId, needFake);
  } catch {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'country id provided not found',
    );
  }

  const watchers = await getWatchersForCountry(country, needFake);
  if (watchers.includes(pushToken)) {
    await removeWatcherForCountry(country, pushToken, needFake);
  } else {
    await addWatcherForCountry(country, pushToken, needFake);
  }
  return {success: true};
};

const fakeOnSubscribeToCountry = getOnSubscribeToCountry(true);
const realOnSubscribeToCountry = getOnSubscribeToCountry(false);

export const toggleSubscribeToCountryNewsA = functions.https.onCall(
  fakeOnSubscribeToCountry,
);
export const toggleSubscribeToCountryNewsB = functions.https.onCall(
  realOnSubscribeToCountry,
);

// @xxx SUBSCRIBE TO ALL COUNTRY
export const subscribeToAnyNews = functions.https.onCall(async data => {
  const {pushToken} = data;

  if (!pushToken || typeof pushToken !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'invalid push token or country id provided',
    );
  }

  const countries = await getDBCountries(false);
  const countriesValue = Object.values(countries);

  await Promise.all(
    countriesValue.map(country =>
      addWatcherForCountry(country, pushToken, false),
    ),
  );
  return {success: true};
});
