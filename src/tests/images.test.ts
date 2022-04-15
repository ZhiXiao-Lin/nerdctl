import { ChildProcess } from "child_process";
import { factory } from "..";

describe("images", () => {
  const engine = factory("wsl -u vmenv");
  const IMAGE = "hello-world";

  test("pull image", async () => {
    const child = (await engine.pullImage(IMAGE)) as ChildProcess;
    const result = await new Promise((resolve, reject) => {
      child?.stdout?.on("data", (data) => {
        console.log(data);
      });
      child?.stdout?.on("close", () => {
        resolve(true);
      });
      child?.stderr?.on("data", (data) => {
        console.log(data);
      });
      child?.stderr?.on("close", () => {
        reject(false);
      });
    });
    expect(result).toEqual(true);
  });
});
