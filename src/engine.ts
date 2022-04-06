import LimaBackend from "@/vms/lima";
import events from "events";
import os from "os";

export type Architecture = "x86_64" | "aarch64";

export interface VmBackend extends events.EventEmitter {
  /** The name of the VM backend */
  readonly backend: "wsl" | "lima" | "not-implemented";
}

export function factory(arch: Architecture): VmBackend {
  const platform = os.platform();

  switch (platform) {
    case "linux":
      return new LimaBackend(arch);
    case "darwin":
      return new LimaBackend(arch);
    default:
      throw new Error(`OS "${platform}" is not supported.`);
  }
}
