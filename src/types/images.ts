import { GlobalFlags } from "./global";

export interface ImageResult {
  CreatedAt: string;
  CreatedSince: string;
  Digest: string;
  ID: string;
  Repository: string;
  Tag: string;
  Size: string;
  BlobSize: string;
  Platform: string;
}

export interface RemoveImageCommandFlags extends GlobalFlags {
  async?: boolean;
  force?: boolean;
}
