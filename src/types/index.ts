import { ChildProcess } from "child_process";
import { ShellString } from "shelljs";

export type Architecture = "x86_64" | "aarch64";

export type ExecResult = ChildProcess | ShellString | null;

export interface ChildResultType {
  stdout: string;
  stderr: string;
  code: number;
  signal?: string;
}
