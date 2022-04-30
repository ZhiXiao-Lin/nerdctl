import { Architecture, ProcessCallback } from "@/types";
import { ImageResult, RemoveImageCommandFlags } from "@/types/images";
import {
  LogsCommandFlags,
  RemoveCommandFlags,
  RunCommandFlags,
  StopCommandFlags,
} from "@/types/container";
import { exec, execSync } from "child_process";

import { GlobalFlags } from "@/types/global";
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

  //#region commons
  protected async fork(
    command: string,
    callback?: ProcessCallback
  ): Promise<boolean> {
    const child = exec(command);

    return await new Promise((resolve) => {
      child?.stdout?.on("data", (data) => {
        callback && callback(data);
      });
      child?.stdout?.on("close", () => {
        resolve(true);
      });
      child?.stderr?.on("data", (data) => {
        callback && callback(data);
      });
      child?.stderr?.on("close", () => {
        resolve(false);
      });
    });
  }

  protected execSync(command: string): string {
    return execSync(command).toString();
  }

  protected which(command: string) {
    return this.execSync(`which ${command}`);
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
  //#endregion

  //#region VMs
  async checkVM(): Promise<boolean> {
    return !!this.which(this.vm);
  }
  async checkInstance(): Promise<boolean> {
    return true;
  }
  async initVM(callback?: ProcessCallback): Promise<boolean> {
    return true;
  }
  async initInstance(callback?: ProcessCallback): Promise<boolean> {
    return true;
  }
  //#endregion

  //#region registry
  login(flags?: LoginCommandFlags, server?: string): string {
    const command = `${this.container} login ${this.mergeFlags(
      flags
    )} ${server}`;

    return this.execSync(command);
  }

  logout(server?: string): string {
    const command = `${this.container} logout ${server}`;

    return this.execSync(command);
  }
  //#endregion

  //#region containers
  async run(
    image: string,
    flags?: RunCommandFlags,
    callback?: ProcessCallback
  ): Promise<boolean> {
    const command = `${this.container} run ${this.mergeFlags(flags)} ${image}`;

    return await this.fork(command, callback);
  }

  stop(container: string | string[], flags?: StopCommandFlags): string {
    const containers = Array.isArray(container)
      ? container.join(" ")
      : container;
    const command = `${this.container} stop ${this.mergeFlags(
      flags
    )} ${containers}`;

    return this.execSync(command);
  }

  remove(container: string | string[], flags?: RemoveCommandFlags): string {
    const containers = Array.isArray(container)
      ? container.join(" ")
      : container;
    const command = `${this.container} rm ${this.mergeFlags(
      flags
    )} ${containers}`;

    return this.execSync(command);
  }

  async logs(container: string, flags?: LogsCommandFlags): Promise<boolean> {
    const command = `${this.container} logs ${this.mergeFlags(
      flags
    )} ${container}`;

    return await this.fork(command);
  }
  //#endregion

  //#region images
  async pullImage(image: string, callback?: ProcessCallback): Promise<boolean> {
    const command = `${this.container} pull ${image}`;

    return await this.fork(command, callback);
  }

  async getImages(): Promise<ImageResult[]> {
    const child = exec(`${this.container} images --format "{{json .}}"`);

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

  removeImage(
    image: string | string[],
    flags?: RemoveImageCommandFlags
  ): string {
    const images = Array.isArray(image) ? image.join(" ") : image;
    const command = `${this.container} rmi ${this.mergeFlags(flags)} ${images}`;

    return this.execSync(command);
  }
  //#endregion
}
