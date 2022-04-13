import { ShellString } from "shelljs";
import { config } from "dotenv";
import { factory } from "..";

describe("registry", () => {
  const engine = factory();
  config();

  test("login should be successful", async () => {
    // const result = (await engine.login(
    //   {
    //     username: process.env.OCI_REGISTRY_USERNAME,
    //     password: process.env.OCI_REGISTRY_PASSWORD,
    //   },
    //   process.env.OCI_REGISTRY
    // )) as ShellString;
    // expect(result?.code).toEqual(0);
  });
});
