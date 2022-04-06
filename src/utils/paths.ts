import { APP_NAME } from "@/constants/app";
import os from "os";
import path from "path";

export interface Paths {
  /** appHome: the location of the main appdata directory. */
  appHome: string;
  /** altAppHome is a secondary directory for application data. */
  altAppHome: string;
  /** Directory which holds configuration. */
  config: string;
  /** Directory which holds logs. */
  logs: string;
  /** Directory which holds caches that may be removed. */
  cache: string;
  /** Directory holding the WSL distribution (Windows-specific). */
  wslDistro: string;
  /** Directory holding the WSL data distribution (Windows-specific). */
  wslDistroData: string;
  /** Directory holding Lima state (macOS-specific). */
  lima: string;
  /** Directory holding provided binary resources */
  integration: string;
  /** The directory that used to hold provided binary integrations */
  oldIntegration: string;
  /** Directory that holds resource files in the RD installation. */
  resources: string;
}

class ProvidesResources {
  get resources(): string {
    const basePath = "";

    return path.join(basePath, "resources");
  }
}

export class DarwinPaths extends ProvidesResources implements Paths {
  appHome = path.join(os.homedir(), "Library", "Application Support", APP_NAME);
  altAppHome = path.join(os.homedir(), ".rd");
  config = path.join(os.homedir(), "Library", "Preferences", APP_NAME);
  logs = path.join(os.homedir(), "Library", "Logs", APP_NAME);
  cache = path.join(os.homedir(), "Library", "Caches", APP_NAME);
  lima = path.join(this.appHome, "lima");
  oldIntegration = "/usr/local/bin";
  integration = path.join(this.altAppHome, "bin");

  get wslDistro(): string {
    throw new Error("wslDistro not available for darwin");
  }

  get wslDistroData(): string {
    throw new Error("wslDistro not available for darwin");
  }
}

const UnsupportedPaths: Paths = new Proxy({} as Paths, {
  get(target, prop) {
    throw new Error(`Paths ${String(prop)} not available for ${os.platform()}`);
  },
});

function getPaths(): Paths {
  switch (os.platform()) {
    case "darwin":
      return new DarwinPaths();
    default:
      return UnsupportedPaths;
  }
}

export default getPaths();
