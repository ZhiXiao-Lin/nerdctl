import BaseBackend from "./base";
import { LimaListResult } from "@/types/lima";
import { ProcessCallback } from "@/types";
import { exec } from "child_process";
import { isM1 } from "@/utils";

export default class LimaBackend extends BaseBackend {
  async checkInstance(): Promise<boolean> {
    const listChild = exec(`${this.vm} list --json`);
    if (!listChild || !listChild.stdout) return false;

    const list: LimaListResult[] = await new Promise((resolve, reject) => {
      const list: LimaListResult[] = [];
      listChild.stdout!.on("data", (data) => {
        if (!data) return;
        list.push(JSON.parse(data));
      });
      listChild.stdout!.on("close", () => {
        resolve(list);
      });
    });

    const defaultVM = list.find(
      (vm: LimaListResult) => vm.name === this.instance
    );

    if (!defaultVM || defaultVM.status !== "Running") {
      return false;
    }

    return true;
  }

  async initVM(callback?: ProcessCallback): Promise<boolean> {
    const command = `${isM1 ? `arch -arm64 ` : ""}brew install lima`;

    return await this.fork(command, callback);
  }

  async initInstance(callback?: ProcessCallback): Promise<boolean> {
    const command = `${this.vm} start ${this.instance}`;

    return await this.fork(command, callback);
  }
}
