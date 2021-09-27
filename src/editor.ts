/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from "lit";
import {
  HomeAssistant,
  fireEvent,
  LovelaceCardEditor,
  ActionConfig,
} from "custom-card-helpers";

import { NissanLeafCardConfig } from "./types";
import { customElement, property, state } from "lit/decorators";

const options = {
  required: {
    icon: "tune",
    name: "Required",
    secondary: "Required options for this card to function",
    show: true,
  },
  actions: {
    icon: "gesture-tap-hold",
    name: "Actions",
    secondary: "Perform actions based on tapping/clicking",
    show: false,
    options: {
      tap: {
        icon: "gesture-tap",
        name: "Tap",
        secondary: "Set the action to perform on tap",
        show: false,
      },
      hold: {
        icon: "gesture-tap-hold",
        name: "Hold",
        secondary: "Set the action to perform on hold",
        show: false,
      },
      double_tap: {
        icon: "gesture-double-tap",
        name: "Double Tap",
        secondary: "Set the action to perform on double tap",
        show: false,
      },
    },
  },
  appearance: {
    icon: "palette",
    name: "Appearance",
    secondary: "Customize the name, icon, etc",
    show: false,
  },
};

@customElement("nissan-leaf-card-editor")
export class NissanLeafCardEditor
  extends LitElement
  implements LovelaceCardEditor
{
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: NissanLeafCardConfig;
  @state() private _toggle?: boolean;
  @state() private _helpers?: any;
  private _initialized = false;

  public setConfig(config: NissanLeafCardConfig): void {
    this._config = config;

    this.loadCardHelpers();
  }

  protected shouldUpdate(): boolean {
    if (!this._initialized) {
      this._initialize();
    }

    return true;
  }

  get _name(): string {
    return this._config?.name || "";
  }

  get _chargeEntity(): string {
    return this._config?.chargeEntity || "";
  }

  protected render(): TemplateResult | void {
    if (!this.hass || !this._helpers) {
      return html``;
    }

    // The climate more-info has ha-switch and paper-dropdown-menu elements that are lazy loaded unless explicitly done here
    this._helpers.importMoreInfoControl("climate");

    // You can restrict on domain type
    const entities = Object.keys(this.hass.states).filter(
      (eid) => eid.substr(0, eid.indexOf(".")) === "sensor"
    );

    return html`
      <div class="card-config">
        <div class="option" @click=${this._toggleOption} .option=${"required"}>
          <div class="row">
            <ha-icon .icon=${`mdi:${options.required.icon}`}></ha-icon>
            <div class="title">${options.required.name}</div>
          </div>
          <div class="secondary">${options.required.secondary}</div>
        </div>
        ${options.required.show
          ? html`
              <div class="values">
                <paper-dropdown-menu
                  label="Charge Entity (Required)"
                  @value-changed=${this._valueChanged}
                  .configValue=${"chargeEntity"}
                >
                  <paper-listbox
                    slot="dropdown-content"
                    .selected=${entities.indexOf(this._chargeEntity)}
                  >
                    ${entities.map((entity) => {
                      return html` <paper-item>${entity}</paper-item> `;
                    })}
                  </paper-listbox>
                </paper-dropdown-menu>
              </div>
            `
          : ""}
      </div>
    `;
  }

  private _initialize(): void {
    if (this.hass === undefined) return;
    if (this._config === undefined) return;
    if (this._helpers === undefined) return;
    this._initialized = true;
  }

  private async loadCardHelpers(): Promise<void> {
    this._helpers = await (window as any).loadCardHelpers();
  }

  private _toggleAction(ev): void {
    this._toggleThing(ev, options.actions.options);
  }

  private _toggleOption(ev): void {
    this._toggleThing(ev, options);
  }

  private _toggleThing(ev, optionList): void {
    const show = !optionList[ev.target.option].show;
    for (const [key] of Object.entries(optionList)) {
      optionList[key].show = false;
    }
    optionList[ev.target.option].show = show;
    this._toggle = !this._toggle;
  }

  private _valueChanged(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === "") {
        const tmpConfig = { ...this._config };
        delete tmpConfig[target.configValue];
        this._config = tmpConfig;
      } else {
        this._config = {
          ...this._config,
          [target.configValue]:
            target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, "config-changed", { config: this._config });
  }

  static get styles(): CSSResultGroup {
    return css`
      .option {
        padding: 4px 0px;
        cursor: pointer;
      }
      .row {
        display: flex;
        margin-bottom: -14px;
        pointer-events: none;
      }
      .title {
        padding-left: 16px;
        margin-top: -6px;
        pointer-events: none;
      }
      .secondary {
        padding-left: 40px;
        color: var(--secondary-text-color);
        pointer-events: none;
      }
      .values {
        padding-left: 16px;
        background: var(--secondary-background-color);
        display: grid;
      }
      ha-formfield {
        padding-bottom: 8px;
      }
    `;
  }
}
