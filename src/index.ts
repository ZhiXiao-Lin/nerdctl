import BaseBackend from "@/vms/base";
import LimaBackend from "@/vms/lima";
import WslBackend from "@/vms/wsl";
import os from "os";
import { platform } from "./utils";

export function factory(
  vm?: string,
  instance: string = "default"
): BaseBackend {
  const arch = os.arch() === "arm64" ? "aarch64" : "x86_64";
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

async function test() {
  const vm = factory("wsl -u vmenv");
  console.log(await vm.getImages());
  const child = await vm.pullImage("hello-world");
  await new Promise((resolve, reject) => {
    child.stderr?.on("data", (data) => {
      console.log(data);
    });
    child.stdout?.on("close", () => {
      resolve(true);
    });
  });
  console.log(await vm.getImages());
}

test();
