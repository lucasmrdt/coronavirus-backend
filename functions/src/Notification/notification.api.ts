import * as functions from 'firebase-functions';
import * as OneSignal from 'onesignal-node';
import {Country} from '../Country';
import {capitalize} from '../utils';

const {ENV_ONESIGNAL_APP_ID, ENV_ONESIGNAL_API_KEY} = process.env;

const {
  id: ONESIGNAL_APP_ID = ENV_ONESIGNAL_APP_ID,
  key: ONESIGNAL_API_KEY = ENV_ONESIGNAL_API_KEY,
} = functions.config().onesignal || {};

if (!ONESIGNAL_API_KEY || !ONESIGNAL_APP_ID) {
  throw new Error(
    "env variables 'ONESIGNAL_API_KEY' and 'ONESIGNAL_APP_ID' are required",
  );
}

const client = new OneSignal.Client(ONESIGNAL_APP_ID, ONESIGNAL_API_KEY);

const showDiff = (diff: number, locale: string) =>
  diff
    ? `(${diff < 0 ? '-' : '+'}${Math.abs(diff).toLocaleString(locale)})`
    : '';

export const sendCountryUpdateNotification = async (
  pushTokens: string[],
  before: Country,
  after: Country,
) => {
  const {
    nbConfirmed: beforeNbConfirmed,
    nbDeaths: beforeNbDeaths,
    nbRecovered: beforeNbRecovered,
  } = before;
  const beforeNbActives =
    beforeNbConfirmed - beforeNbDeaths - beforeNbRecovered;

  const {name, subName, nbConfirmed, nbDeaths, nbRecovered} = after;
  const nbActives = nbConfirmed - nbDeaths - nbRecovered;

  const diffActives = nbActives - beforeNbActives;
  const diffDeaths = nbDeaths - beforeNbDeaths;
  const diffRecovered = nbRecovered - beforeNbRecovered;

  const titlePrefix = `${name}${subName ? ` (${capitalize(subName)})` : ''}`;

  try {
    const a = await client.createNotification({
      headings: {
        en: `${titlePrefix} | Total : ${nbActives.toLocaleString(
          'en',
        )} ${showDiff(nbConfirmed - beforeNbConfirmed, 'en')} 🙍🏻‍♂️`,
        fr: `${titlePrefix} | Total : ${nbActives.toLocaleString(
          'fr',
        )} ${showDiff(0, 'fr')} 🙍🏻‍♂️`,
      },
      contents: {
        en: `${nbActives.toLocaleString('en')} ${showDiff(
          diffActives,
          'en',
        )} 🤢  ·  ${nbRecovered.toLocaleString('en')} ${showDiff(
          diffRecovered,
          'en',
        )} 😇  ·  ${nbDeaths.toLocaleString('en')} ${showDiff(
          diffDeaths,
          'en',
        )} 💀`,
        fr: `${nbActives.toLocaleString('fr')} ${showDiff(
          diffActives,
          'fr',
        )} 🤢  ·  ${nbRecovered.toLocaleString('fr')} ${showDiff(
          diffRecovered,
          'fr',
        )} 😇  ·  ${nbDeaths.toLocaleString('fr')} ${showDiff(
          diffDeaths,
          'fr',
        )} 💀`,
      },
      include_player_ids: pushTokens,
    });
    console.log(a);
  } catch (e) {
    console.log(e);
  }
};
