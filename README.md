# Nerdctl

Node wrapper for nerdctl

# Install

```shell
yarn add nerdctl
```

# Useage

```ts
import { events, factory } from "nerdctl";

const IMAGE_NAME = "hello-world";
const CONTAINER_NAME = "hello";

const vm = factory();

vm.on(events.VM_INIT_START, () => {
  console.log("VM_INIT_START");
});
vm.on(events.VM_INIT_OUTPUT, (data) => {
  console.log(data);
});
vm.on(events.VM_INIT_END, () => {
  console.log("VM_INIT_END");
});
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

if (!(await vm.checkVM())) {
  await vm.initVM();
}

await vm.pullImage(IMAGE_NAME);

const images = await vm.getImages();
console.log(images);

await vm.run(IMAGE_NAME, { name: CONTAINER_NAME });
await vm.stop(CONTAINER_NAME);
await vm.remove(CONTAINER_NAME);
```

## License

Node nerdctl is [MIT licensed](LICENSE).
