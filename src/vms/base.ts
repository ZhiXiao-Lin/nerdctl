import { Architecture, ExecResult } from "@/types";
import { ContainerCommandFlags, RunCommandFlags } from "@/types/container";
import { ExecOptions, exec } from "shelljs";

import { ChildProcess } from "child_process";
import { GlobalFlags } from "@/types/global";
import { ImageResult } from "@/types/images";
import { platform } from "@/utils";

export default abstract class BaseBackend {
  public debug: boolean = false;
  protected readonly arch: Architecture;
  protected readonly platform: string = platform;

  protected readonly vm = "limactl";
  protected readonly runtime = "nerdctl";

  constructor(arch: Architecture) {
    this.arch = arch;
  }

  get container() {
    return `${this.vm} shell ${this.instance} ${this.runtime}`;
  }

  #instance = "default";
  get instance() {
    return this.#instance;
  }
  set instance(instance: string) {
    this.#instance = instance;
  }

  protected async exec(
    command: string,
    options?: ExecOptions
  ): Promise<ExecResult> {
    return exec(command, { silent: true, async: true, ...options });
  }

  protected mergeFlags(flags?: GlobalFlags): string {
    const flagParams: string[] = [];
    if (flags) {
      for (const [key, value] of Object.entries(flags)) {
        const flag = `--${key}`;
        if (typeof value === "boolean") {
          flagParams.push(flag);
        }
        if (typeof value === "string") {
          flagParams.push(`${flag} ${value}`);
        }
      }
    }

    const params = flagParams.join(" ");

    if (flags?.debug) {
      console.log("flags:", params);
    }

    return params;
  }

  abstract init(): Promise<void>;
  abstract start(): Promise<void>;

  abstract run(
    image: string,
    flags?: RunCommandFlags
  ): Promise<ExecResult | string>;

  abstract rm(
    container: string,
    flags?: ContainerCommandFlags
  ): Promise<ChildProcess>;

  abstract pullImage(image: string): Promise<ChildProcess>;
  abstract getImages(): Promise<ImageResult[]>;
}
