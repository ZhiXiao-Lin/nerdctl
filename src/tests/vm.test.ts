import { ChildProcess } from "child_process";
import { factory } from "..";

describe("vm", () => {
  const engine = factory();

  test("init", async () => {
    await engine.stopVM();
    await engine.deleteVM();
    await engine.initVM();
    const child = (await engine.startVM()) as ChildProcess;

    const result = await new Promise((resolve, reject) => {
      child.stdout!.on("data", (data) => {
        console.log("data:", data);
      });
      child.stdout!.on("close", () => {
        resolve(true);
      });
      child.stderr!.on("data", (data) => {
        console.log("error:", data);
      });
      child.stderr!.on("close", () => {
        resolve(false);
      });
    });
    expect(result).toBeTruthy();
  }, 300000);
});
