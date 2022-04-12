import {
  LogsCommandFlags,
  RmCommandFlags,
  RunCommandFlags,
  StopCommandFlags,
} from "@/types/container";

import BaseBackend from "./base";
import { ChildProcess } from "child_process";
import { ExecResult } from "@/types";
import { ImageResult } from "@/types/images";
import { LoginCommandFlags } from "@/types/registry";
import { ShellString } from "shelljs";

export default class LimaBackend extends BaseBackend {
  async init(): Promise<void> {}

  async start(): Promise<void> {}

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
