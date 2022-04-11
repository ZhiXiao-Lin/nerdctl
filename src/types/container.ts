import { GlobalFlags } from "./global";

export interface RunCommandFlags extends GlobalFlags {
  addHost?: string[];
  blkioWeight?: number;
  capAdd?: string[];
  capDrop?: string[];
  cgroupConf?: string[];
  cgroupns?: string;
  cidfile?: string;
  cosignKey?: string;
  cpuPeriod?: number;
  cpuQuota?: number;
  cpuShares?: number;
  cpus?: number;
  cpusetCpus?: string;
  cpusetMems?: string;
  detach?: boolean;
  device?: string[];
  dns?: string[];
  entrypoint?: string;
  env?: string[];
  envFile?: string[];
  gpus?: string[];
  hostname?: string;
  interactive?: boolean;
  ip?: string;
  label?: string[];
  labelFile?: string[];
  memory?: string;
  mount?: string[];
  name?: string;
  net?: string[];
  network?: string[];
  pid?: string;
  pidfile?: string;
  pidsLimit?: number;
  platform?: string;
  privileged?: boolean;
  publish?: string[];
  pull?: string;
  rdtClass?: string;
  readOnly?: boolean;
  restart?: string;
  rm?: boolean;
  rootfs?: boolean;
  runtime?: string;
  securityOpt?: string[];
  shmSize?: string;
  sysctl?: string[];
  tmpfs?: string[];
  tty?: boolean;
  ulimit?: string[];
  user?: string;
  verify?: string;
  volume?: string[];
  workdir?: string;
}

export interface LogsCommandFlags extends GlobalFlags {
  follow?: boolean;
  since?: string;
  tail?: string;
  timestamps?: boolean;
  until?: string;
}

export interface RmCommandFlags extends GlobalFlags {
  force?: boolean;
  volumes?: boolean;
}
