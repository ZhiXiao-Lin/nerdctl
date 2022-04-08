import { GlobalFlags } from "./global";

export interface RunCommandFlags extends GlobalFlags {
  detach?: boolean;
}

export interface ContainerCommandFlags extends GlobalFlags {}
