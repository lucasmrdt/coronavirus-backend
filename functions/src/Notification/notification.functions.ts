import * as functions from 'firebase-functions';
import {log} from '../logger';
import {
  COUNTRY_REF_KEY,
  Country,
  getDBCountry,
  getDBCountries,
  hasChanged,
} from '../Country';
import {
  addWatcherForCountry,
  removeWatcherForCountry,
  getWatchersForCountry,
} from './notification.model';
import {sendCountryUpdateNotification} from './notification.api';

export const watchCountryUpdate = functions.database
  .ref(`${COUNTRY_REF_KEY}/{countryId}`)
  .onUpdate(async snapshot => {
    const before: Country = snapshot.before.val();
    const after: Country = snapshot.after.val();

    if (!before || hasChanged(before, after)) {
      const watchers = await getWatchersForCountry(after);
      if (watchers.length) {
        log(`[NOTIFY] (${after.name}|${after.subName || 'global'})`);
        await sendCountryUpdateNotification(watchers, before, after);
      }
    }
  });

export const toggleSubscribeToCountryNews = functions.https.onCall(
  async data => {
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
      country = await getDBCountry(countryId);
    } catch {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'country id provided not found',
      );
    }

    const watchers = await getWatchersForCountry(country);
    if (watchers.includes(pushToken)) {
      await removeWatcherForCountry(country, pushToken);
    } else {
      await addWatcherForCountry(country, pushToken);
    }
    return {success: true};
  },
);

export const subscribeToAnyNews = functions.https.onCall(async data => {
  const {pushToken} = data;

  if (!pushToken || typeof pushToken !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'invalid push token or country id provided',
    );
  }

  const countries = await getDBCountries();
  const countriesValue = Array.from(countries.values());

  await Promise.all(
    countriesValue.map(country => addWatcherForCountry(country, pushToken)),
  );
  return {success: true};
});
