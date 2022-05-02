import * as childProcess from "@/utils/childProcess";
import * as events from "@/constants/events";

import ChildProcess, { spawn } from "child_process";
import { ImageResult, RemoveImageCommandFlags } from "@/types/images";
import { LIMA_REPO, LIMA_VERSION } from "@/constants/lima";
import {
  RemoveCommandFlags,
  RunCommandFlags,
  StopCommandFlags,
} from "@/types/container";
import { arch, platform } from "@/utils";

import BaseBackend from "./base";
import { ChildResultType } from "@/types";
import { LimaListResult } from "@/types/lima";
import { download } from "@/utils/download";
import fs from "fs";
import path from "path";

export default class LimaBackend extends BaseBackend {
  protected get limactl() {
    return path.join(this.resourcePath, platform, "lima", "bin", "limactl");
  }

  protected get limaHome() {
    return path.join(this.resourcePath, "home");
  }

  protected get limaEnv() {
    const binDir = path.join(this.resourcePath, platform, "lima", "bin");
    const pathList = (process.env.PATH || "").split(path.delimiter);
    const newPath = [binDir].concat(...pathList).filter((x) => x);
    return {
      ...process.env,
      LIMA_HOME: this.limaHome,
      PATH: newPath.join(path.delimiter),
    };
  }

  protected get container() {
    return path.join(
      this.resourcePath,
      platform,
      "lima",
      "bin",
      "nerdctl.lima"
    );
  }

  protected get status(): Promise<LimaListResult | undefined> {
    return (async () => {
      try {
        const text = await this.limaWithCapture("list", "--json");
        const lines = text.split(/\r?\n/).filter((x) => x.trim());
        const entries = lines.map((line) => JSON.parse(line) as LimaListResult);

        return entries.find((entry) => entry.name === this.instance);
      } catch (ex) {
        console.error(
          "Could not parse lima status, assuming machine is unavailable."
        );

        return undefined;
      }
    })();
  }

  protected async lima(...args: string[]): Promise<void> {
    try {
      await childProcess.spawnFile(this.limactl, args, {
        env: this.limaEnv,
        stdio: this.log,
      });
    } catch (ex) {
      console.error(`+ limactl ${args.join(" ")}`);
      console.error(ex);
      throw ex;
    }
  }

  protected async limaWithCapture(...args: string[]): Promise<string> {
    const { stdout } = await childProcess.spawnFile(this.limactl, args, {
      env: this.limaEnv,
      stdio: ["ignore", "pipe", this.log],
    });
    return stdout;
  }

  protected async containerWithCapture(...args: string[]): Promise<string> {
    const { stdout } = await childProcess.spawnFile(this.container, args, {
      env: this.limaEnv,
      stdio: ["ignore", "pipe", this.log],
    });
    return stdout;
  }

  protected async containerWithProcess(
    command: string,
    ...args: string[]
  ): Promise<ChildResultType> {
    const child = await spawn(this.container, [command, ...args], {
      env: this.limaEnv,
    });

    const result = { code: 0, stdout: "", stderr: "" };

    return await new Promise((resolve, reject) => {
      child.stdout?.on("data", (data: Buffer) => {
        const dataString = data.toString();
        result.stdout += dataString;

        if ("pull" === command) {
          this.emit(events.IMAGE_PULL_OUTPUT, dataString);
        }
      });
      child.stderr?.on("data", (data: Buffer) => {
        let dataString = data.toString();
        result.stderr += dataString;

        if ("pull" === command) {
          this.emit(events.IMAGE_PULL_OUTPUT, dataString);
        }
      });
      child.on("exit", (code, signal) => {
        if (result.stderr) {
        }
        if (code === 0) {
          resolve({ ...result, code });
        } else if (signal) {
          reject(
            Object.create(result, {
              code: { value: -1 },
              signal: { value: signal },
              [childProcess.ErrorCommand]: {
                enumerable: false,
                value: child.spawnargs,
              },
            })
          );
        } else {
          reject(
            Object.create(result, {
              code: { value: code },
              [childProcess.ErrorCommand]: {
                enumerable: false,
                value: child.spawnargs,
              },
            })
          );
        }
      });
    });
  }

  async run(image: string, flags?: RunCommandFlags): Promise<ChildResultType> {
    const args: string[] = [...this.mergeFlags(flags), image];

    return await this.containerWithProcess("run", ...args);
  }

  async stop(
    container: string | string[],
    flags?: StopCommandFlags
  ): Promise<ChildResultType> {
    const args: string[] = Array.isArray(container)
      ? [...container]
      : [container];

    return await this.containerWithProcess(
      "stop",
      ...this.mergeFlags(flags).concat(args)
    );
  }

  async remove(
    container: string | string[],
    flags?: RemoveCommandFlags
  ): Promise<ChildResultType> {
    const args: string[] = Array.isArray(container)
      ? [...container]
      : [container];

    return await this.containerWithProcess(
      "rm",
      ...this.mergeFlags(flags).concat(args)
    );
  }

  async pullImage(image: string): Promise<ChildResultType> {
    this.emit(events.IMAGE_PULL_START);

    const result = await this.containerWithProcess("pull", image);

    this.emit(events.IMAGE_PULL_END, result);

    return result;
  }

  async getImages(): Promise<ImageResult[]> {
    const text = await this.containerWithCapture(
      "images",
      "--format",
      `"{{json .}}"`
    );

    const lines = text.split(/\r?\n/).filter((x) => x.trim());
    const entries = lines.map(
      (line) => JSON.parse(line.substring(1, line.length - 1)) as ImageResult
    );

    return entries;
  }

  async removeImage(
    image: string | string[],
    flags?: RemoveImageCommandFlags
  ): Promise<ChildResultType> {
    const args: string[] = Array.isArray(image) ? [...image] : [image];

    return await this.containerWithProcess(
      "rmi",
      ...this.mergeFlags(flags).concat(args)
    );
  }

  async checkVM(): Promise<boolean> {
    try {
      await fs.promises.access(this.limactl, fs.constants.X_OK);
      return (await this.status)!.status === "Running";
    } catch (ex: any) {
      return false;
    }
  }

  async initVM(): Promise<boolean> {
    this.emit(events.VM_INIT_START);

    const platformName = platform === "darwin" ? "Darwin" : "Linux";
    const url = `${LIMA_REPO}/v${LIMA_VERSION}/lima-${LIMA_VERSION}-${platformName}-${arch}.tar.gz`;
    const resourcesDir = path.join(this.path, "resources", platform);
    const limaDir = path.join(resourcesDir, "lima");
    const tarPath = path.join(resourcesDir, `lima-${LIMA_VERSION}.tgz`);

    await download(url, tarPath);
    await fs.promises.mkdir(limaDir, { recursive: true });

    const child = ChildProcess.spawn("/usr/bin/tar", ["-xf", tarPath], {
      cwd: limaDir,
      stdio: "inherit",
    });

    await new Promise((resolve, reject) => {
      child.on("exit", (code, signal) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`Lima extract failed with ${code || signal}`));
        }
      });
    });

    await this.lima("start", "--tty=false", this.instance);

    this.emit(events.VM_INIT_END);

    return true;
  }
}
