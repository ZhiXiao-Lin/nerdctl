# Nerdctl

Node wrapper for nerdctl

# Install

```shell
yarn add nerdctl
```

# Useage

```ts
import { factory } from "nerdctl";

const engine = factory();
const IMAGE = "hello-world";

await engine.pullImage(IMAGE);
await engine.run(IMAGE);
```

## License

Nest is [MIT licensed](LICENSE).
