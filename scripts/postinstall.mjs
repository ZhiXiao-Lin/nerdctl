import os from "os";

async function runScripts() {
  switch (os.platform()) {
    case "darwin":
      await (await import("./download/lima.mjs")).default();
      break;
    case "win32":
      await (await import("./download/wsl.mjs")).default();
      break;
  }
}

runScripts().catch((e) => {
  console.error(e);
  process.exit(1);
});
