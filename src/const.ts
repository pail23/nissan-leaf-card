export const CARD_VERSION = '0.0.1';

import * as imageGeneric from './img/nissan-leaf.png';
export const LEAF_IMAGE = imageGeneric.default;

export const ENTITIES = {
  soc: 'sensor.leaf_soc',
  range: 'sensor.leaf_range',
  chargingStatus: 'binary_sensor.keba_charging',
  plugStatus: 'binary_sensor.keba_plugged_in',
};
