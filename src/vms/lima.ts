import {
  ContainerCommandFlags,
  LogsCommandFlags,
  RunCommandFlags,
} from "@/types/container";

import BaseBackend from "./base";
import { ChildProcess } from "child_process";
import { ExecResult } from "@/types";
import { ImageResult } from "@/types/images";

export default class LimaBackend extends BaseBackend {
  async init(): Promise<void> {}

  async start(): Promise<void> {}

  //#region containers
  async run(
    image: string,
    flags?: RunCommandFlags
  ): Promise<ExecResult | string> {
    const command = `${this.container} run ${this.mergeFlags(flags)} ${image}`;

    if (!flags?.detach) {
      return await this.exec(command, { async: false });
    }

    const child = (await this.exec(command)) as ChildProcess;

    return new Promise((resove, reject) => {
      child.stdout!.on("data", (data) => {
        if (!data) reject("");
        resove(data);
      });
    });
  }

  async rm(
    container: string,
    flags?: ContainerCommandFlags
  ): Promise<ChildProcess> {
    return (await this.exec(
      `${this.container} rm ${this.mergeFlags(flags)} ${container}`,
      { async: false }
    )) as ChildProcess;
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
      child.stdout!.on("data", (data) => {
        if (!data) reject(null);
        resolve(JSON.parse(data));
      });
    });
  }
  //#endregion
}
