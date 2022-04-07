import BaseBackend from "@/vms/base";
import LimaBackend from "@/vms/lima";
import os from "os";

export function factory(): BaseBackend {
  const platform = os.platform();
  const arch = os.arch() === "arm64" ? "aarch64" : "x86_64";
  switch (platform) {
    case "linux":
      return new LimaBackend(arch);
    case "darwin":
      return new LimaBackend(arch);
    default:
      throw new Error(`OS "${platform}" is not supported.`);
  }
}
