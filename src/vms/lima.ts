import * as childProcess from "@/utils/childProcess";
import * as events from "@/constants/events";

import ChildProcess, { spawn } from "child_process";
import { ImageResult, RemoveImageCommandFlags } from "@/types/images";
import { LIMA_REPO, LIMA_VERSION } from "@/constants/lima";
import { LimaConfiguration, LimaListResult } from "@/types/lima";
import {
  RemoveCommandFlags,
  RunCommandFlags,
  StopCommandFlags,
} from "@/types/container";
import { isM1, platform } from "@/utils";

import { APP_NAME } from "@/constants/app";
import BaseBackend from "./base";
import { ChildResultType } from "@/types";
import { download } from "@/utils/download";
import fs from "fs";
import merge from "lodash/merge";
import net from "net";
import path from "path";
import yaml from "yaml";

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

  protected get currentConfig(): Promise<LimaConfiguration | undefined> {
    return (async () => {
      try {
        const configPath = path.join(this.limaHome, this.instance, "lima.yaml");
        const configRaw = await fs.promises.readFile(configPath, "utf-8");

        return yaml.parse(configRaw) as LimaConfiguration;
      } catch (ex) {
        if ((ex as NodeJS.ErrnoException).code === "ENOENT") {
          return undefined;
        }
      }
    })();
  }

  #sshPort = 0;
  get sshPort(): Promise<number> {
    return (async () => {
      if (this.#sshPort === 0) {
        if ((await this.status)?.status === "Running") {
          // if the machine is already running, we can't change the port.
          const existingPort = (await this.currentConfig)?.ssh.localPort;

          if (existingPort) {
            this.#sshPort = existingPort;

            return existingPort;
          }
        }

        const server = net.createServer();

        await new Promise((resolve) => {
          server.once("listening", resolve);
          server.listen(0, "127.0.0.1");
        });
        this.#sshPort = (server.address() as net.AddressInfo).port;
        server.close();
      }

      return this.#sshPort;
    })();
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
    const { stdout } = await childProcess.spawnFile(
      this.limactl,
      ["shell", this.instance, this.container, ...args],
      {
        env: this.limaEnv,
        stdio: ["ignore", "pipe", this.log],
      }
    );
    return stdout;
  }

  protected async containerWithProcess(
    command: string,
    ...args: string[]
  ): Promise<ChildResultType> {
    const child = await spawn(
      this.limactl,
      ["shell", this.instance, this.container, command, ...args],
      {
        env: this.limaEnv,
      }
    );

    const result = { code: 0, stdout: "", stderr: "" };

    return await new Promise((resolve, reject) => {
      child.stdout?.on("data", (data: Buffer) => {
        const dataString = data.toString();
        result.stdout += dataString;

        if ("pull" === command) {
          this.emit(events.IMAGE_PULL_OUTPUT, dataString);
        }
        if ("run" === command) {
          this.emit(events.CONTAINER_RUN_OUTPUT, dataString);
        }
      });
      child.stderr?.on("data", (data: Buffer) => {
        let dataString = data.toString();
        result.stderr += dataString;

        if ("pull" === command) {
          this.emit(events.IMAGE_PULL_OUTPUT, dataString);
        }
        if ("run" === command) {
          this.emit(events.CONTAINER_RUN_OUTPUT, dataString);
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

    try {
      if (!!(await this.status)) {
        await this.lima("start", this.instance);
      } else {
        const platformName = platform === "darwin" ? "macos" : "linux";
        const archName = isM1 ? "-aarch64" : "";

        const url = `${LIMA_REPO}/${LIMA_VERSION}/lima-and-qemu.${platformName}${archName}.tar.gz`;
        const resourcesDir = path.join(this.resourcePath, platform);
        const limaDir = path.join(resourcesDir, "lima");
        const tarPath = path.join(resourcesDir, `lima-${LIMA_VERSION}.tgz`);

        this.emit(events.VM_INIT_OUTPUT, `Downloading virtual machine`);

        await download(url, tarPath);
        await fs.promises.mkdir(limaDir, { recursive: true });

        this.emit(events.VM_INIT_OUTPUT, "Extracting virtual machine files");

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

        const config: LimaConfiguration = merge({
          arch: null,
          images: [
            {
              location:
                "https://cloud-images.ubuntu.com/releases/22.04/release-20220420/ubuntu-22.04-server-cloudimg-amd64.img",
              arch: "x86_64",
              digest:
                "sha256:de5e632e17b8965f2baf4ea6d2b824788e154d9a65df4fd419ec4019898e15cd",
            },
            {
              location:
                "https://cloud-images.ubuntu.com/releases/22.04/release-20220420/ubuntu-22.04-server-cloudimg-arm64.img",
              arch: "aarch64",
              digest:
                "sha256:66224c7fed99ff5a5539eda406c87bbfefe8af6ff6b47d92df3187832b5b5d4f",
            },
            {
              location:
                "https://cloud-images.ubuntu.com/releases/22.04/release/ubuntu-22.04-server-cloudimg-amd64.img",
              arch: "x86_64",
            },
            {
              location:
                "https://cloud-images.ubuntu.com/releases/22.04/release/ubuntu-22.04-server-cloudimg-arm64.img",
              arch: "aarch64",
            },
          ],
          cpus: 2,
          memory: 2 * 1024 * 1024 * 1024,
          mounts: [
            { location: "~", writable: true },
            { location: `/tmp/${APP_NAME}`, writable: true },
          ],
          ssh: { localPort: await this.sshPort },
          caCerts: { removeDefaults: null, files: null, certs: null },
          containerd: { system: null, user: null },
          cpuType: { aarch64: null, x86_64: null },
          firmware: { legacyBIOS: null },
          video: { display: null },
          networks: null,
          propagateProxyEnv: null,
          hostResolver: {
            enabled: null,
            ipv6: null,
            hosts: {
              [`host.${APP_NAME}.internal`]: "host.lima.internal",
            },
          },
        });

        const CONFIG_PATH = path.join(
          this.limaHome,
          "_config",
          `${this.instance}.yaml`
        );

        await fs.promises.mkdir(path.dirname(CONFIG_PATH), {
          recursive: true,
        });
        await fs.promises.writeFile(
          CONFIG_PATH,
          yaml.stringify(config),
          "utf-8"
        );

        this.emit(events.VM_INIT_OUTPUT, "Starting virtual machine");

        await this.lima("start", "--tty=false", CONFIG_PATH);
      }
    } finally {
      this.emit(events.VM_INIT_END);
    }

    return true;
  }
}
