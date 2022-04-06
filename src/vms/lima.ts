import * as childProcess from "@/utils/childProcess";
import * as engine from "../engine";

import { APP_NAME } from "@/constants/app";
import Logging from "@/utils/logging";
import events from "events";
import os from "os";
import path from "path";
import paths from "@/utils/paths";

interface LimaListResult {
  name: string;
  status: "Broken" | "Stopped" | "Running";
  dir: string;
  arch: "x86_64" | "aarch64";
  sshLocalPort?: number;
  hostAgentPID?: number;
  qemuPID?: number;
  errors?: string[];
}

const console = Logging.lima;
const MACHINE_NAME = "0";
const IMAGE_VERSION = "0.2.9";
const ALPINE_EDITION = "rd";
const ALPINE_VERSION = "3.14.3";

/** The following files, and their parents up to /, must only be writable by root,
 *  and none of them are allowed to be symlinks (lima-vm requirements).
 */
const VDE_DIR = `/opt/${APP_NAME}`;

function defined<T>(input: T | null | undefined): input is T {
  return input !== null && typeof input !== "undefined";
}

export default class LimaBackend
  extends events.EventEmitter
  implements engine.VmBackend
{
  constructor(arch: engine.Architecture) {
    super();
    this.arch = arch;
  }

  /** The current architecture. */
  protected readonly arch: engine.Architecture;

  debug = false;

  get backend(): "lima" {
    return "lima";
  }

  protected get baseDiskImage() {
    const imageName = `alpine-lima-v${IMAGE_VERSION}-${ALPINE_EDITION}-${ALPINE_VERSION}.iso`;

    return path.join(paths.resources, os.platform(), imageName);
  }

  protected static get limactl() {
    return path.join(paths.resources, os.platform(), "lima", "bin", "limactl");
  }

  protected static get limaEnv() {
    const binDir = path.join(paths.resources, os.platform(), "lima", "bin");
    const vdeDir = path.join(VDE_DIR, "bin");
    const pathList = (process.env.PATH || "").split(path.delimiter);
    const newPath = [binDir, vdeDir].concat(...pathList).filter((x) => x);

    return {
      ...process.env,
      LIMA_HOME: paths.lima,
      PATH: newPath.join(path.delimiter),
    };
  }

  /**
   * Run `limactl` with the given arguments, and return stdout.
   */
  protected async limaWithCapture(
    this: Readonly<this>,
    ...args: string[]
  ): Promise<string> {
    args = this.debug ? ["--debug"].concat(args) : args;
    const { stdout } = await childProcess.spawnFile(LimaBackend.limactl, args, {
      env: LimaBackend.limaEnv,
      stdio: ["ignore", "pipe", console],
    });

    return stdout;
  }

  /**
   * Get the current Lima VM status, or undefined if there was an error
   * (e.g. the machine is not registered).
   */
  protected get status(): Promise<LimaListResult | undefined> {
    return (async () => {
      try {
        const text = await this.limaWithCapture("list", "--json");
        const lines = text.split(/\r?\n/).filter((x: string) => x.trim());
        const entries = lines.map(
          (line: string) => JSON.parse(line) as LimaListResult
        );

        return entries.find(
          (entry: { name: any }) => entry.name === MACHINE_NAME
        );
      } catch (ex) {
        console.error(
          "Could not parse lima status, assuming machine is unavailable."
        );

        return undefined;
      }
    })();
  }

  protected get isRegistered(): Promise<boolean> {
    return this.status.then(defined);
  }

  protected async startVM() {}

  async start(): Promise<void> {
    try {
      // Start the VM; if it's already running, this does nothing.
      await this.startVM();
    } catch (err) {
      console.error("Error starting lima:", err);
      throw err;
    } finally {
    }
  }
}
