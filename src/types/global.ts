export interface GlobalFlags {
  address?: string;
  cgroupManager?: string;
  cniNetconfpath?: string;
  cniPath?: string;
  dataRoot?: string;
  debug?: boolean;
  debugFull?: boolean;
  host?: string;
  hostsDir?: string[];
  insecureRegistry?: boolean;
  namespace?: string;
  snapshotter?: string;
  storageDriver?: string;
}
