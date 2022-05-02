import * as events from "@/constants/events";

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

if (process.env.NODE_ENV === "development") {
  async function test() {
    const IMAGE_NAME = "hello-world";
    const CONTAINER_NAME = "hello";

    const vm = factory();

    if (!(await vm.checkVM())) {
      await vm.initVM();
    }

    vm.on(events.IMAGE_PULL_START, () => {});
    vm.on(events.IMAGE_PULL_OUTPUT, (data) => {
      console.log(data);
    });
    vm.on(events.IMAGE_PULL_END, (data) => {
      console.log(data);
    });
    vm.on(events.CONTAINER_RUN_OUTPUT, (data) => {
      console.log(data);
    });

    await vm.pullImage(IMAGE_NAME);

    const images = await vm.getImages();
    console.log(images);

    await vm.run(IMAGE_NAME, { name: CONTAINER_NAME });
    await vm.stop(CONTAINER_NAME);
    await vm.remove(CONTAINER_NAME);
  }

  test();
}
