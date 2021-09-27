/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LitElement,
  html,
  TemplateResult,
  css,
  PropertyValues,
  CSSResultGroup,
} from "lit";
import { HassEntity } from "home-assistant-js-websocket";
import { customElement, property, state } from "lit/decorators";
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  fireEvent,
  LovelaceCardEditor,
  getLovelace,
} from "custom-card-helpers"; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import "./editor";

import type { NissanLeafCardConfig } from "./types";
import { actionHandler } from "./action-handler-directive";
import {
  CARD_VERSION,
  LEAF_IMAGE,
  LEAF_SERVICE_DOMAIN,
  LEAF_ENTITY_BASE,
  ENTITIES,
} from "./const";
import { localize } from "./localize/localize";

/* eslint no-console: 0 */
console.info(
  `%c  NISSAN-LEAF-CARD \n%c  ${localize(
    "common.version"
  )} ${CARD_VERSION}    `,
  "color: orange; font-weight: bold; background: black",
  "color: white; font-weight: bold; background: dimgray"
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: "nissan-leaf-card",
  name: "Nissan Leaf Card",
  description:
    "A nissan leaf card for visualizing the status of your Nissan Leaf",
});

// TODO Name your custom element
@customElement("nissan-leaf-card")
export class NissanLeafCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement("nissan-leaf-card-editor");
  }

  public static getStubConfig(): object {
    return {};
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: NissanLeafCardConfig;

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: NissanLeafCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error(localize("common.invalid_configuration"));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      name: "Nissan Leaf",
      ...config,
    };
  }

  get chargeEntity(): HassEntity | undefined {
    return this.config.chargeEntity != undefined
      ? this.hass.states[this.config.chargeEntity]
      : undefined;
  }

  private get entityBasename(): string {
    return this.config.chargeEntity === undefined
      ? ""
      : this.config.chargeEntity.split(".")[1].replace(LEAF_ENTITY_BASE, "");
  }

  private getEntityState(entity) {
    try {
      return entity.state;
    } catch (err) {
      return undefined;
    }
  }

  private getEntityAttribute(entity, attribute: string) {
    try {
      return entity.attributes[attribute];
    } catch (err) {
      return undefined;
    }
  }

  private getEntityId(entityBase: string): string | undefined {
    try {
      return (
        entityBase.split(".")[0] +
        "." +
        this.entityBasename +
        "_" +
        entityBase.split(".")[1]
      );
    } catch (err) {
      return undefined;
    }
  }

  private getEntity(entityBase) {
    try {
      const entityId = this.getEntityId(entityBase);

      return entityId === undefined ? undefined : this.hass.states[entityId];
    } catch (err) {
      return undefined;
    }
  }

  private getEntities() {
    const charge = this.chargeEntity;
    const range = this.getEntity(ENTITIES.range);
    const rangeAC = this.getEntity(ENTITIES.rangeAC);
    const chargingStatus = this.getEntity(ENTITIES.chargingStatus);
    const plugStatus = this.getEntity(ENTITIES.plugStatus);
    return {
      charge,
      range,
      rangeAC,
      chargingStatus,
      plugStatus,
    };
  }

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  private callService(service, isRequest = true, options = {}) {
    this.hass.callService(LEAF_SERVICE_DOMAIN, service, {
      ...options,
    });

    if (isRequest) {
      // this.requestInProgress = true; //TODO: Removed, must be improved to check all sensors
      this.requestUpdate();
    }
  }

  private handleMore(entity): void {
    if (entity && entity.entity_id) {
      fireEvent(
        this,
        "hass-more-info",
        {
          entityId: entity.entity_id,
        },
        {
          bubbles: true,
          composed: true,
        }
      );
    }
  }

  private renderInfoItemText(entity, round = false) {
    if (entity === null || entity === undefined) {
      return html``;
    }
    const value = round
      ? Math.round(this.getEntityState(entity))
      : this.getEntityState(entity);
    const useUnit = this.getEntityAttribute(entity, "unit_of_measurement");
    // const icon = this.renderIcon(entity);
    return html` ${value} ${useUnit} `;
  }

  private renderInfoItem(
    entity,
    tooltip: string,
    icon: string,
    round = false
  ): TemplateResult | void {
    return html`
      <div
        class="infoitems-item"
        @click="${() => this.handleMore(entity)}"
        ?more-info="true"
      >
        <div class="tooltip">
          <ha-icon icon="${icon}"></ha-icon>
          ${this.renderInfoItemText(entity, round)}
          <span class="tooltiptext">${tooltip}</span>
        </div>
      </div>
    `;
  }

  private renderInfoItemsLeft(): TemplateResult | void {
    const { charge, plugStatus } = this.getEntities();
    const pluggedIn = plugStatus ? plugStatus.state == "on" : false;
    const plugIcon = pluggedIn ? "mdi:power-plug" : "mdi:power-plug-off";
    return html`
      ${this.renderInfoItem(charge, localize("common.charge"), "mdi:battery")}
      ${this.renderInfoItem(undefined, localize("common.charge"), plugIcon)}
    `;
  }

  private renderInfoItemsRight(): TemplateResult | void {
    const { range, rangeAC, chargingStatus } = this.getEntities();
    return html`
      ${this.renderInfoItem(
        range,
        localize("common.range"),
        "mdi:map-marker-distance"
      )}
      ${this.renderInfoItem(
        rangeAC,
        localize("common.rangeAC"),
        "mdi:map-marker-distance"
      )}
      ${this.renderInfoItem(
        chargingStatus,
        localize("common.chargingStatus"),
        "mdi:ev-station"
      )}
    `;
  }

  private renderToolbarButton(
    service,
    icon,
    text,
    isRequest = true
  ): TemplateResult | void {
    let useText = "";
    try {
      useText = localize(text);
    } catch (e) {
      useText = text;
    }
    return html`
      <div class="tooltip">
        <ha-icon-button
          icon="${icon}"
          title="${useText}"
          @click="${() => this.callService(service, isRequest)}"
        ></ha-icon-button>
        <span class="tooltiptext">${useText}</span>
      </div>
    `;
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    // TODO Check for stateObj or other necessary things and render a warning if missing

    /*
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}

*/
    return html`
      <ha-card
        .header=${this.config.name}
        tabindex="0"
        .label=${`Nissan Leaf: ${
          this.config.chargeEntity || "No Entity Defined"
        }`}
      >
        <div class="header">
          <div class="infoitems-left">${this.renderInfoItemsLeft()}</div>

          <div class="infoitems">${this.renderInfoItemsRight()}</div>
        </div>
        <img src="${LEAF_IMAGE}" />
        <div class="toolbar">
          ${this.renderToolbarButton("update", "mdi:reload", "Update")}
        </div>
      </ha-card>
    `;
  }
  /*
  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }
*/
  private _showWarning(warning: string): TemplateResult {
    return html` <hui-warning>${warning}</hui-warning> `;
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement("hui-error-card");
    errorCard.setConfig({
      type: "error",
      error,
      origConfig: this.config,
    });

    return html` ${errorCard} `;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css`
      img {
        display: block;
        width: 100%;
        margin-left: auto;
        margin-right: auto;
        margin-top: 25px;
        margin-bottom: 20px;
      }

      .toolbar {
        // background: var(--lovelace-background, var(--primary-background-color));
        min-height: 30px;
        display: flex;
        flex-direction: row;
        justify-content: space-evenly;

        // border-color: black;
        // border-style: dashed;
      }

      .toolbar ha-icon-button {
        color: var(--custom-primary-color);
        flex-direction: column;
        width: 44px;
        height: 44px;
        --mdc-icon-button-size: 44px;
        margin: 5px 0;

        // border-color: red;
        // border-style: dashed;
      }

      .toolbar ha-icon-button:first-child {
        margin-left: 5px;
      }

      .toolbar ha-icon-button:last-child {
        margin-right: 5px;
      }
      .header {
        height: 0px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        color: var(--custom-text-color);

        // border-color: green;
        // border-style: dashed;
      }

      .infoitems {
        // display: flex;
        height: 250px;
        text-align: right;
        // font-weight: bold;
        // transform: translate(-10px, 50%);
        color: var(--custom-text-color);
        top: 70px;
        right: 20px;
        position: absolute;

        // border-color: darkblue;
        // border-style: dashed;
      }

      .infoitems-left {
        text-align: center;
        color: var(--custom-text-color);

        height: 250px;
        text-align: left;
        // transform: translate(10px, 50%);
        top: 70px;
        left: 20px;
        position: absolute;

        // border-color: darkgreen;
        // border-style: dashed;
      }

      .infoitems-item {
        // display: flex;
        // spacing: 0px 0 40
        // text-align: right;
        padding: 5px;
        font-weight: bold;
        color: var(--custom-text-color);

        // border: 1px;
        // border-style: dotted;
      }

      .tooltip {
        position: relative;
        display: inline-block;
        // border-bottom: 1px dotted black; /* If you want dots under the hoverable text */
      }

      /* Tooltip text */
      .tooltip {
        position: relative;
        display: inline-block;
      }

      .tooltip .tooltiptext {
        visibility: hidden;
        width: 160px;
        background-color: black;
        color: #fff;
        text-align: center;
        border-radius: 6px;
        padding: 1px 0;
        position: absolute;
        z-index: 1;
        top: 110%;
        left: 50%;
        margin-left: -80px;
      }

      .tooltip .tooltiptext::after {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: transparent transparent black transparent;
      }

      .tooltip-right .tooltiptext-right {
        visibility: hidden;
        width: 160px;
        background-color: black;
        color: #fff;
        text-align: center;
        border-radius: 6px;
        padding: 1px 0;
        position: absolute;
        z-index: 1;
        margin-left: -80px;
        top: 5px;
        right: 105%;
      }

      .tooltip-right .tooltiptext-right::after {
        content: ' ';
        position: absolute;
        top: 50%;
        left: 100%; /* To the right of the tooltip */
        margin-top: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: transparent transparent transparent black;
      }

      .tooltip:hover .tooltiptext {
        visibility: visible;
      }

      .tooltip-right:hover .tooltiptext-right {
        visibility: visible;
      }
    `;
  }
}
