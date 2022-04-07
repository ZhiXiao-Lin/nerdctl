import BaseBackend from "./base";

/**
 * Lima configuration
 */
type LimaConfiguration = {
  arch?: "x86_64" | "aarch64";
  images: {
    location: string;
    arch?: "x86_64" | "aarch64";
    digest?: string;
  }[];
  cpus?: number;
  memory?: number;
  disk?: number;
  mounts?: {
    location: string;
    writable?: boolean;
  }[];
  ssh: {
    localPort: number;
    loadDotSSHPubKeys?: boolean;
  };
  firmware?: {
    legacyBIOS?: boolean;
  };
  video?: {
    display?: string;
  };
  provision?: {
    mode: "system" | "user";
    script: string;
  }[];
  containerd?: {
    system?: boolean;
    user?: boolean;
  };
  probes?: {
    mode: "readiness";
    description: string;
    script: string;
    hint: string;
  }[];
  hostResolver?: {
    hosts?: Record<string, string>;
  };
  portForwards?: Array<Record<string, any>>;
  networks?: Array<Record<string, string>>;
  paths?: Record<string, string>;
};
interface LimaListResult {
  name: string;
  status: "Broken" | "Stopped" | "Running";
  dir: string;
  arch: "x86_64" | "aarch64";
  sshLocalPort?: number;
  hostAgentPID?: number;
  qemuPID?: number;
  errors?: string[];
}

export default class LimaBackend extends BaseBackend {
  async start(): Promise<void> {}
}
