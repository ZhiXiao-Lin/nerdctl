import { GlobalFlags } from "./global";

export interface LoginCommandFlags extends GlobalFlags {
  password?: string;
  passwordStdin?: boolean;
  username?: string;
}
