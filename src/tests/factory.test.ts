import BaseBackend from "@/vms/base";
import { factory } from "..";

describe("factory", () => {
  test("Should be instantiated correctly", () =>
    expect(factory()).toBeInstanceOf(BaseBackend));
});
