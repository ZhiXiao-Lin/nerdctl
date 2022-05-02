import BaseBackend from "@/vms/base";
import LimaBackend from "@/vms/lima";
import WslBackend from "@/vms/wsl";
import { platform } from "@/utils";

export * as events from "@/constants/events";

export function factory(path: string = process.cwd()): BaseBackend {
  switch (platform) {
    case "linux":
      return new LimaBackend(path);
    case "darwin":
      return new LimaBackend(path);
    case "win32":
      return new WslBackend(path);
    default:
      throw new Error(`OS "${platform}" is not supported.`);
  }
}
