import { Architecture, ExecResult } from "@/types";
import { ExecOptions, ShellString, exec } from "shelljs";
import { RmCommandFlags, RunCommandFlags } from "@/types/container";

import { ChildProcess } from "child_process";
import { GlobalFlags } from "@/types/global";
import { ImageResult } from "@/types/images";
import { LoginCommandFlags } from "@/types/registry";
import { paramCase } from "change-case";
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
        const flag = `--${paramCase(key)}`;
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

  abstract login(
    flags?: LoginCommandFlags,
    server?: string
  ): Promise<ShellString>;

  abstract run(image: string, flags?: RunCommandFlags): Promise<ChildProcess>;

  abstract stop(
    container: string | string[],
    flags?: RmCommandFlags
  ): Promise<ShellString>;
  abstract rm(
    container: string | string[],
    flags?: RmCommandFlags
  ): Promise<ShellString>;

  abstract pullImage(image: string): Promise<ChildProcess>;
  abstract getImages(): Promise<ImageResult[]>;
}
