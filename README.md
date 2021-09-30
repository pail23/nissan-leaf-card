# Nissan Leaf Card by [@pail23](https://www.github.com/pail23)

A community driven nissan leaf custom card for the lovelace UI in homeassistant

[![GitHub Release][releases-shield]][releases]
[![License][license-shield]](LICENSE.md)
[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg?style=for-the-badge)](https://github.com/custom-components/hacs)

![Project Maintenance][maintenance-shield]
[![GitHub Activity][commits-shield]][commits]


## Options

| Name              | Type    | Requirement  | Description                                 | Default             |
| ----------------- | ------- | ------------ | ------------------------------------------- | ------------------- |
| type              | string  | **Required** | `custom:nissan-leaf-card`                   |
| name              | string  | **Optional** | Card name                                   | `Nissan Leaf`       |
| chargeEntity      | string  | **Optional** | Home Assistant entity ID for the Nissan Leaf Charge Entity (ie % Battery).       | `none`              |
| tap_action        | object  | **Optional** | Action to take on tap                       | `action: more-info` |


## Credits

This card is based on the [Boiler Plate Card Template](https://github.com/custom-cards/boilerplate-card) by Ian Richardson.