import * as admin from 'firebase-admin';
import {log} from '../logger';
import {Country} from '../Country';
import {
  COUNTRIES_ID_BY_PUSH_TOKEN,
  PUSH_TOKENS_BY_COUNTRY_REF,
} from './notification.constants';

const pushTokensByCountryRef = admin.database().ref(PUSH_TOKENS_BY_COUNTRY_REF);

const countriesIdByPushToken = admin.database().ref(COUNTRIES_ID_BY_PUSH_TOKEN);

export const getWatchersForCountry = (country: Country) =>
  new Promise<string[]>((res, rej) =>
    pushTokensByCountryRef.child(country.id).once(
      'value',
      snapshot => {
        const value = snapshot.val();
        res(Array.isArray(value) ? value : []);
      },
      rej,
    ),
  );

export const getWatchedCountriesIdForUser = (pushId: string) =>
  new Promise<string[]>((res, rej) =>
    countriesIdByPushToken.child(pushId).once(
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
) => {
  const watchers = await getWatchersForCountry(country);
  const countriesId = await getWatchedCountriesIdForUser(pushId);
  if (watchers.includes(pushId)) {
    log(
      `user "${pushId}" has already watch country "${
        country.name
      }|${country.subName || 'global'}"`,
    );
    return;
  }
  log(
    `add watcher "${pushId}" for country "${country.name}|${country.subName ||
      'global'}"`,
  );
  await countriesIdByPushToken.child(pushId).set([...countriesId, country.id]);
  await pushTokensByCountryRef.child(country.id).set([...watchers, pushId]);
};

export const removeWatcherForCountry = async (
  country: Country,
  pushId: string,
) => {
  const watchers = await getWatchersForCountry(country);
  const countriesId = await getWatchedCountriesIdForUser(pushId);
  if (!watchers.includes(pushId)) {
    log(
      `user "${pushId}" hasn't yet watch country "${
        country.name
      }|${country.subName || 'global'}"`,
    );
    return;
  }
  log(
    `remove watcher "${pushId}" for country "${
      country.name
    }|${country.subName || 'global'}"`,
  );
  const newWatchers = watchers.filter(watcher => watcher !== pushId);
  const newCountriesId = countriesId.filter(
    countryId => countryId !== country.id,
  );
  await countriesIdByPushToken.child(pushId).set(newCountriesId);
  await pushTokensByCountryRef.child(country.id).set(newWatchers);
};
