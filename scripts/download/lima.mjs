// This downloads the macOS resources related to Lima.

import { download, getResource } from "../lib/download.mjs";

import childProcess from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

export const LIMA_REPO = "https://github.com/lima-vm/lima/releases/download";
export const LIMA_VERSION = "0.10.0";

async function getLima(platform, arch) {
  const url = `${LIMA_REPO}/v${LIMA_VERSION}/lima-${LIMA_VERSION}-${platform}-${arch}.tar.gz`;
  const resourcesDir = path.join(process.cwd(), "resources", os.platform());
  const limaDir = path.join(resourcesDir, "lima");
  const tarPath = path.join(resourcesDir, `lima-${LIMA_VERSION}.tgz`);

  await download(url, tarPath);
  await fs.promises.mkdir(limaDir, { recursive: true });

  const child = childProcess.spawn("/usr/bin/tar", ["-xf", tarPath], {
    cwd: limaDir,
    stdio: "inherit",
  });

  return await new Promise((resolve, reject) => {
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`Lima extract failed with ${code || signal}`));
      }
    });
  });
}

export default function run() {
  let platform = os.platform();
  let arch = os.arch();

  if (platform === "darwin") {
    platform = "Darwin";
  }

  if (platform === "linux") {
    platform = "Linux";
  }

  return Promise.all([getLima(platform, arch)]);
}
