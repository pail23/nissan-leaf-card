export const CARD_VERSION = "0.0.1";

import * as imageGeneric from "./img/nissan-leaf.png";
export const LEAF_IMAGE = imageGeneric.default;

export const LEAF_SERVICE_DOMAIN = "nissan_leaf";
export const LEAF_ENTITY_BASE = "_charge";

export const ENTITIES = {
  range: "sensor.range",
  rangeAC: "sensor.range_ac",
  chargingStatus: "binary_sensor.charging_status",
  plugStatus: "binary_sensor.charging_status",
};
