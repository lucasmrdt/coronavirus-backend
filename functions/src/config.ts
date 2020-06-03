import * as functions from 'firebase-functions';

const {ENV_ONESIGNAL_APP_ID, ENV_ONESIGNAL_API_KEY} = process.env;

export const {
  onesignal: {
    id: ONESIGNAL_APP_ID = ENV_ONESIGNAL_APP_ID,
    key: ONESIGNAL_API_KEY = ENV_ONESIGNAL_API_KEY,
  } = {},
} = functions.config() || {};

export const FAKE_DATA_PREFIX = '66912914-ade4-4284-bdf7-776107ffd05e';
export const REAL_DATA_PREFIX = '07b1c2de-8ce6-4c45-84f1-07e36b189bc5';
