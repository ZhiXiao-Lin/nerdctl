import { ChildProcess } from "child_process";
import { factory } from "..";

describe("container", () => {
  const engine = factory();
  const IMAGE = "hello-world";
  const NAME = "hello";

  test("run", async () => {
    const result = (await engine.run(IMAGE, {
      name: NAME,
      detach: true,
    })) as ChildProcess;
    expect(result.exitCode).toBeNull();
  });

  afterAll(() => {
    (async () => {
      await engine.rm(IMAGE);
    })();
  });
});
