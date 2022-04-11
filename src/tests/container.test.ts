import { factory } from "..";

describe("container", () => {
  const engine = factory();
  const IMAGE = "hello-world";
  const NAME = "hello";

  test("rm", async () => {
    await engine.run(IMAGE, { name: NAME, detach: true });
    const result = await engine.rm(NAME, { force: true });

    expect(result.code).toEqual(0);
  });
});
