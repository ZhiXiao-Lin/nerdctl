import BaseBackend from "@/vms/base";
import LimaBackend from "@/vms/lima";
import os from "os";
import { platform } from "./utils";

export function factory(): BaseBackend {
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

if (process.env.NODE_ENV === "development") {
  async function main() {
    const engine = await factory();
    // await engine.init();
    // await engine.start();

    const IMAGE = "hello-world";

    await engine.pullImage(IMAGE);

    const id = (await engine.run(IMAGE, {
      debug: true,
      detach: true,
    })) as string;
    console.log(id);
    const images = await engine.getImages();
    console.log(images);
    console.log(await (await engine.rm(id)).stdout);
  }
  main();
}
