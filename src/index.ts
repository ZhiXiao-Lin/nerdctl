import { ChildProcess, exec } from "child_process";

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
  const images = await vm.getImages();
  console.log(images);
  await vm.pullImage("hello-world");

  const container = await vm.run('hello-world', { detach: true });

  vm.
}

test();
