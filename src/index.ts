import { isWindows, platform } from "./utils";

import BaseBackend from "@/vms/base";
import LimaBackend from "@/vms/lima";
import WslBackend from "@/vms/wsl";
import os from "os";

export function factory(vm?: string, instance?: string): BaseBackend {
  const arch = os.arch() === "arm64" ? "aarch64" : "x86_64";
  instance = instance ?? isWindows ? "Ubuntu-20.04" : "default";
  switch (platform) {
    case "linux":
      return new LimaBackend(arch, vm, instance);
    case "darwin":
      return new LimaBackend(arch, vm, instance);
    case "win32":
      return new WslBackend(arch, vm, instance);
    default:
      throw new Error(`OS "${platform}" is not supported.`);
  }
}
