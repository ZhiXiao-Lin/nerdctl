import os from "os";

export const platform = os.platform();
export const arch = os.arch();
export const isM1 = platform === "darwin" ? arch === "arm64" : false;
