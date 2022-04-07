// This downloads the macOS resources related to Lima.

import { download, getResource } from "./download";

import childProcess from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const limaRepo = "https://github.com/rancher-sandbox/lima-and-qemu";
const limaTag = "v1.22";

async function getLima(platform: string) {
  const url = `${limaRepo}/releases/download/${limaTag}/lima-and-qemu.${platform}.tar.gz`;
  const expectedChecksum = (await getResource(`${url}.sha512sum`)).split(
    /\s+/
  )[0];
  const resourcesDir = path.join(process.cwd(), "resources", os.platform());
  const limaDir = path.join(resourcesDir, "lima");
  const tarPath = path.join(resourcesDir, `lima-${limaTag}.tgz`);

  await download(url, tarPath, {
    expectedChecksum,
    checksumAlgorithm: "sha512",
    access: fs.constants.W_OK,
  });
  await fs.promises.mkdir(limaDir, { recursive: true });

  const child = childProcess.spawn("/usr/bin/tar", ["-xf", tarPath], {
    cwd: limaDir,
    stdio: "inherit",
  });

  await new Promise<void>((resolve, reject) => {
    child.on("exit", (code, signal) => {
      if (code === 0) {
        fs.promises.unlink(tarPath);
        resolve();
      } else {
        reject(new Error(`Lima extract failed with ${code || signal}`));
      }
    });
  });
}

export default function run() {
  let platform: string = os.platform();
  let arch = "x86_64";

  if (platform === "darwin") {
    platform = "macos";
    if (os.arch() === "arm64") {
      arch = "aarch64";
      platform = `macos-${arch}`;
    }
  }

  return Promise.all([getLima(platform)]);
}
