import * as functions from 'firebase-functions';
import * as Fuse from 'fuse.js';
import {log} from '../logger';
import {getArgisCountries, getWorldometersCountries} from './country.api';
import {updateDBCountries} from './country.model';
import {mergeDataSources} from './country.utils';

async function refreshCountries() {
  log(`[COUNTRY_REFRESH]`);
  const rawArgis = await getArgisCountries();
  const argis = Array.from(rawArgis.values());
  const worldometers = await getWorldometersCountries();
  const countries = mergeDataSources(argis, worldometers);
  const formattedCountries = new Map(
    countries.map(country => [country.id, country]),
  );
  await updateDBCountries(formattedCountries);
}

export const scheduleRefreshCountries = functions.pubsub
  .schedule('*/5 * * * *')
  .onRun(refreshCountries);

export const launchRefreshCountries = functions.https.onRequest(
  async (_, res) => {
    await refreshCountries();
    res.status(200).json({success: true});
  },
);
