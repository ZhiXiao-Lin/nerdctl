import { Architecture } from "@/types";
import BaseBackend from "./base";

export default class WslBackend extends BaseBackend {
  constructor(
    protected readonly arch: Architecture,
    protected readonly vm: string = "wsl",
    protected readonly instance: string = "Ubuntu-20.04"
  ) {
    super(arch, vm, instance);
  }
}
