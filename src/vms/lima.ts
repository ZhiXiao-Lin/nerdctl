import BaseBackend from "./base";
import { ChildProcess } from "child_process";
import { LimaListResult } from "@/types/lima";
import { which } from "shelljs";

export default class LimaBackend extends BaseBackend {
  async initVM(): Promise<boolean> {
    if (!which("brew")) return false;
    if (!which(this.vm)) {
      const child = (await this.exec(`brew install lima`)) as ChildProcess;
      await new Promise((resolve, reject) => {
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
    }

    const listChild = (await this.exec(
      `${this.vm} list --json`
    )) as ChildProcess;
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

  async startVM(): Promise<ChildProcess> {
    return (await this.exec(
      `${this.vm} start ${this.instance}`
    )) as ChildProcess;
  }

  async stopVM(): Promise<void> {
    await this.exec(`${this.vm} stop ${this.instance}`);
  }

  async deleteVM(): Promise<void> {
    await this.exec(`${this.vm} delete ${this.instance}`);
  }
}
