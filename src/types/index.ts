export type Architecture = "x86_64" | "aarch64";

export type ProcessCallback = (data: string) => void;
export interface ChildResultType {
  stdout: string;
  stderr: string;
  code: number;
  signal?: string;
}
