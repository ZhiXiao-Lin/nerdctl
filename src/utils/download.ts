import fetch from "node-fetch";
import fs from "fs";
import path from "path";

async function fetchWithRetry(url: string) {
  while (true) {
    try {
      return await fetch(url);
    } catch (ex: any) {
      if (ex && ex.errno === "EAI_AGAIN") {
        console.log(`Recoverable error downloading ${url}, retrying...`);
        continue;
      }
      console.dir(ex);
      throw ex;
    }
  }
}

export async function download(
  url: string,
  destPath: string,
  options = { access: fs.constants.X_OK, overwrite: false }
) {
  const { access, overwrite } = options;

  if (!overwrite) {
    try {
      await fs.promises.access(destPath, access);
      console.log(`${destPath} already exists, not re-downloading.`);

      return;
    } catch (ex: any) {
      if (ex.code !== "ENOENT") {
        throw ex;
      }
    }
  }
  console.log(`Downloading ${url} to ${destPath}...`);
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
  const response = await fetchWithRetry(url);

  if (!response.ok) {
    throw new Error(`Error downloading ${url}: ${response.statusText}`);
  }
  const tempPath = `${destPath}.download`;

  try {
    const file = fs.createWriteStream(tempPath);
    const promise = new Promise((resolve) => file.on("finish", resolve));

    response.body!.pipe(file);
    await promise;

    const mode =
      access & fs.constants.X_OK
        ? 0o755
        : access & fs.constants.W_OK
        ? 0o644
        : 0o444;

    await fs.promises.chmod(tempPath, mode);
    await fs.promises.rename(tempPath, destPath);
  } finally {
    try {
      await fs.promises.unlink(tempPath);
    } catch (ex: any) {
      if (ex.code !== "ENOENT") {
        console.error(ex);
      }
    }
  }
}
