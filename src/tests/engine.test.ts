import { factory } from "..";

describe("engine", () => {
  const engine = factory();
  const IMAGE = "hello-world";
  test("The image should be pulled correctly", async () => {
    const result = await engine.pullImage(IMAGE);
    expect(result.exitCode).toBeNull();
  });
});
