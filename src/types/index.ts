export type Architecture = "x86_64" | "aarch64";

export interface ChildResultType {
  stdout: string;
  stderr: string;
  code: number;
  signal?: string;
}

export interface VMImage {
  location: string;
  arch: string;
}
