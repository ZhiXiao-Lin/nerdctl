import { Architecture, ExecResult } from "@/types";
import { ExecOptions, ShellString, exec } from "shelljs";
import {
  LogsCommandFlags,
  RmCommandFlags,
  RunCommandFlags,
  StopCommandFlags,
} from "@/types/container";

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

  protected readonly vm: string = "limactl";
  protected readonly instance: string = "default";
  protected readonly runtime: string = "nerdctl";

  constructor(
    arch: Architecture,
    vm: string = "limactl",
    instance: string = "default"
  ) {
    this.arch = arch;
    this.vm = vm;
    this.instance = instance;
  }

  get container() {
    if (this.platform !== "darwin")
      return `${this.vm} -e XDG_RUNTIME_DIR=/run/user/$(id -u) ${this.runtime}`;
    return `${this.vm} shell ${this.instance} ${this.runtime}`;
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
        if (Array.isArray(value)) {
          value.forEach((val) => {
            flagParams.push(`${flag} ${val}`);
          });
        }
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

  abstract initVM(): Promise<boolean>;
  abstract startVM(): Promise<ChildProcess | null>;
  abstract stopVM(): Promise<void>;
  abstract deleteVM(): Promise<void>;

  //#region registry
  async login(
    flags?: LoginCommandFlags,
    server?: string
  ): Promise<ShellString> {
    const command = `${this.container} login ${this.mergeFlags(
      flags
    )} ${server}`;

    return (await this.exec(command, { async: false })) as ShellString;
  }

  async logout(server?: string): Promise<ShellString> {
    const command = `${this.container} logout ${server}`;

    return (await this.exec(command, { async: false })) as ShellString;
  }
  //#endregion

  //#region containers
  async run(image: string, flags?: RunCommandFlags): Promise<ChildProcess> {
    const command = `${this.container} run ${this.mergeFlags(flags)} ${image}`;
    return (await this.exec(command)) as ChildProcess;
  }

  async stop(
    container: string | string[],
    flags?: StopCommandFlags
  ): Promise<ShellString> {
    const containers = Array.isArray(container)
      ? container.join(" ")
      : container;
    return (await this.exec(
      `${this.container} stop ${this.mergeFlags(flags)} ${containers}`,
      { async: false }
    )) as ShellString;
  }

  async rm(
    container: string | string[],
    flags?: RmCommandFlags
  ): Promise<ShellString> {
    const containers = Array.isArray(container)
      ? container.join(" ")
      : container;
    return (await this.exec(
      `${this.container} rm ${this.mergeFlags(flags)} ${containers}`,
      { async: false }
    )) as ShellString;
  }

  async logs(
    container: string,
    flags?: LogsCommandFlags
  ): Promise<ChildProcess> {
    return (await this.exec(
      `${this.container} logs ${this.mergeFlags(flags)} ${container}`
    )) as ChildProcess;
  }
  //#endregion

  //#region images
  async pullImage(image: string): Promise<ChildProcess> {
    return (await this.exec(`${this.container} pull ${image}`)) as ChildProcess;
  }

  async getImages(): Promise<ImageResult[]> {
    const child = (await this.exec(
      `${this.container} images --format "{{json .}}"`
    )) as ChildProcess;

    return new Promise((resolve, reject) => {
      if (!!child.exitCode) reject(null);

      const images: ImageResult[] = [];

      child.stdout!.on("data", (data) => {
        if (!data) return;
        images.push(JSON.parse(data));
      });

      child.stdout!.on("close", () => {
        resolve(images);
      });
    });
  }
  //#endregion
}
