import os from "os";

export const platform = os.platform();
export const arch = os.arch();
export const isWindows = platform === "win32";
export const isM1 = platform === "darwin" ? arch === "arm64" : false;

export const getVMArch = () => (os.arch() === "arm64" ? "aarch64" : "x86_64");
