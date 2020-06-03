import * as OneSignal from 'onesignal-node';

import {capitalize} from '@/utils';
import {ONESIGNAL_API_KEY, ONESIGNAL_APP_ID} from '@/config';
import {Country} from '@/Country';

if (!ONESIGNAL_API_KEY || !ONESIGNAL_APP_ID) {
  throw new Error(
    "env variables 'ENV_ONESIGNAL_API_KEY' and 'ENV_ONESIGNAL_APP_ID' are required",
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
    nbActives: beforeNbActives,
    nbDeaths: beforeNbDeaths,
    nbRecovered: beforeNbRecovered,
  } = before;
  const {name, subName, nbActives, nbDeaths, nbRecovered} = after;

  const diffActives = nbActives - beforeNbActives;
  const diffDeaths = nbDeaths - beforeNbDeaths;
  const diffRecovered = nbRecovered - beforeNbRecovered;

  const titlePrefix = `${name}${subName ? ` (${capitalize(subName)})` : ''}`;

  try {
    await client.createNotification({
      headings: {
        en: titlePrefix,
        fr: titlePrefix,
      },
      contents: {
        en: `😷 ${nbActives.toLocaleString('en')} ${showDiff(
          diffActives,
          'en',
        )}\n😇 ${nbRecovered.toLocaleString('en')} ${showDiff(
          diffRecovered,
          'en',
        )}\n😵 ${nbDeaths.toLocaleString('en')} ${showDiff(diffDeaths, 'en')}`,
        fr: `😷 ${nbActives.toLocaleString('fr')} ${showDiff(
          diffActives,
          'fr',
        )}\n😇 ${nbRecovered.toLocaleString('fr')} ${showDiff(
          diffRecovered,
          'fr',
        )}\n😵 ${nbDeaths.toLocaleString('fr')} ${showDiff(diffDeaths, 'fr')}`,
      },
      include_player_ids: pushTokens,
    });
  } catch (e) {
    console.log(e);
  }
};
