import * as functions from 'firebase-functions';

import {log, success} from '@/logger';

import {
  getArgisCountries,
  getWorldometersCountries,
  getWorldometersHistory,
} from './country.api';
import {
  updateDBCountries,
  getDBCountries,
  updateDBHistories,
} from './country.model';
import {mergeDataSources} from './country.utils';
import {CountryHistory} from './country.type';

async function refreshCountries(needFake: boolean) {
  log(needFake, '[COUNTRY_REFRESH]');
  const argis = await getArgisCountries(needFake);
  const worldometers = await getWorldometersCountries(needFake);
  console.log(JSON.stringify(worldometers));
  const countries = mergeDataSources(argis, worldometers);
  const formattedCountries = countries.reduce(
    (acc, country) => ({...acc, [country.id]: country}),
    {},
  );

  // console.log(formattedCountries);

  await updateDBCountries(formattedCountries, needFake);

  success(
    needFake,
    `[COUNTRY_REFRESH] ${countries.length} countries refreshed`,
  );
}

async function refreshHistories(needFake: boolean) {
  const dbCountries = await getDBCountries(needFake);
  const countriesWithHistory = Object.values(dbCountries).filter(
    (country) => country.historyName,
  );

  log(
    needFake,
    `[HISTORY_REFRESH] for ${countriesWithHistory.length} countries`,
  );
  const histories = await Promise.all(
    countriesWithHistory.map<Promise<CountryHistory>>(async (country) => {
      const history = await getWorldometersHistory(
        country.historyName!,
        needFake,
      );
      return {
        id: country.id,
        country: country.name,
        flag: country.flag || null,
        ...history,
      };
    }),
  );

  const formattedHistories = histories.reduce(
    (acc, history) => ({...acc, [history.id]: history}),
    {},
  );

  await updateDBHistories(formattedHistories, needFake);
  success(
    needFake,
    `[HISTORY_REFRESH] ${histories.length} histories refreshed`,
    histories.map(({country}) => country),
  );
}

// @xxx each 4 hours refresh history
export const scheduleRefreshHistory = functions.pubsub
  .schedule('* */4 * * *')
  .onRun(
    async () =>
      await Promise.all([false].map((needFake) => refreshHistories(needFake))),
  );

// @xxx each 2 hours refresh countries
export const scheduleRefreshCountries = functions.pubsub
  .schedule('* */2 * * *')
  .onRun(
    async () =>
      await Promise.all(
        [true, false].map((needFake) => refreshCountries(needFake)),
      ),
  );

export const launchRefreshCountries = functions.https.onRequest(
  async (_, res) => {
    await Promise.all(
      [true, false].map((needFake) => refreshCountries(needFake)),
    );
    res.status(200).json({success: true});
  },
);

export const launchRefreshHistories = functions.https.onRequest(
  async (_, res) => {
    await Promise.all([false].map((needFake) => refreshHistories(needFake)));
    res.status(200).json({success: true});
  },
);
