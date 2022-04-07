import { Architecture } from "@/types";
import downloadLima from "@/download/lima";
import os from "os";

export default abstract class BaseBackend {
  protected readonly arch: Architecture;
  protected readonly platform: string = os.platform();

  constructor(arch: Architecture) {
    this.arch = arch;
  }

  async init(): Promise<void> {
    switch (this.platform) {
      case "darwin":
      case "linux":
        await downloadLima();
        break;
    }
  }
}
