import { Architecture } from "@/types";
import BaseBackend from "./base";
import { ChildProcess } from "child_process";
import { which } from "shelljs";

export default class WslBackend extends BaseBackend {
  constructor(
    protected readonly arch: Architecture,
    protected readonly vm: string = "wsl",
    protected readonly instance: string = "default"
  ) {
    super(arch, vm, instance);
  }

  async initVM(): Promise<boolean> {
    if (!which("wsl")) return false;
    if (!which(this.runtime)) return false;
    return true;
  }

  async startVM(): Promise<ChildProcess | null> {
    return null;
  }

  async stopVM(): Promise<void> {}

  async deleteVM(): Promise<void> {}
}
