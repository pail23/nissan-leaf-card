import {
  ActionConfig,
  LovelaceCard,
  LovelaceCardConfig,
  LovelaceCardEditor,
} from "custom-card-helpers";

declare global {
  interface HTMLElementTagNameMap {
    "nissan-leaf-card-editor": LovelaceCardEditor;
    "hui-error-card": LovelaceCard;
  }
}

// TODO Add your configuration elements here for type-checking
export interface NissanLeafCardConfig extends LovelaceCardConfig {
  type: string;
  name?: string;
  chargeEntity?: string;
}
