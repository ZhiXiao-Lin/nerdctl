import { factory } from "..";

describe("images", () => {
  const engine = factory();
  const IMAGE = "hello-world";

  test("pull image", async () => {
    const result = await engine.pullImage(IMAGE);
    expect(result.exitCode).toBeNull();
  });
});
