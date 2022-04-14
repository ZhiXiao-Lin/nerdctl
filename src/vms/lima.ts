import {
  LogsCommandFlags,
  RmCommandFlags,
  RunCommandFlags,
  StopCommandFlags,
} from "@/types/container";
import { ShellString, which } from "shelljs";

import BaseBackend from "./base";
import { ChildProcess } from "child_process";
import { ImageResult } from "@/types/images";
import { LimaListResult } from "@/types/lima";
import { LoginCommandFlags } from "@/types/registry";

export default class LimaBackend extends BaseBackend {
  async initVM(): Promise<boolean> {
    if (!which("brew")) return false;
    if (!which(this.vm)) {
      const child = (await this.exec(`brew install lima`)) as ChildProcess;
      await new Promise((resolve, reject) => {
        child?.stdout?.on("data", (data) => {
          console.log(data);
        });
        child?.stdout?.on("close", () => {
          resolve(true);
        });
        child?.stderr?.on("data", (data) => {
          console.log(data);
        });
        child?.stderr?.on("close", () => {
          reject(false);
        });
      });
    }

    const listChild = (await this.exec(
      `${this.vm} list --json`
    )) as ChildProcess;
    if (!listChild || !listChild.stdout) return false;

    const list: LimaListResult[] = await new Promise((resolve, reject) => {
      const list: LimaListResult[] = [];
      listChild.stdout!.on("data", (data) => {
        if (!data) return;
        list.push(JSON.parse(data));
      });
      listChild.stdout!.on("close", () => {
        resolve(list);
      });
    });

    const defaultVM = list.find(
      (vm: LimaListResult) => vm.name === this.instance
    );

    if (!defaultVM || defaultVM.status !== "Running") {
      return false;
    }

    return true;
  }

  async startVM(): Promise<ChildProcess> {
    return (await this.exec(
      `${this.vm} start ${this.instance}`
    )) as ChildProcess;
  }

  async stopVM(): Promise<void> {
    await this.exec(`${this.vm} stop ${this.instance}`);
  }

  async deleteVM(): Promise<void> {
    await this.exec(`${this.vm} delete ${this.instance}`);
  }

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
