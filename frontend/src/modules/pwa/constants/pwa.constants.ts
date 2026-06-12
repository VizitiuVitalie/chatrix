export const APP_UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

export const APP_VERSION_MANIFEST_PATH = '/version.json';

export const RUNNING_BUILD_ID =
  typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev';
