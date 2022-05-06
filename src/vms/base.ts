import { ChildResultType, VMImage } from "@/types";
import { ImageResult, RemoveImageCommandFlags } from "@/types/images";
import {
  RemoveCommandFlags,
  RunCommandFlags,
  StopCommandFlags,
} from "@/types/container";

import { APP_NAME } from "@/constants/app";
import { EventEmitter } from "events";
import { GlobalFlags } from "@/types/global";
import { Log } from "@/utils/logging";
import { join } from "path";
import { paramCase } from "change-case";

export default abstract class BaseBackend extends EventEmitter {
  protected readonly log: Log;
  protected readonly path: string;
  protected readonly instance: string = "0";
  protected readonly container: string = "nerdctl";

  constructor(path: string) {
    super();
    this.path = path;
    this.log = new Log(APP_NAME, join(this.resourcePath, "logs"));
  }

  protected get resourcePath() {
    return join(this.path, "res");
  }

  //#region commons
  protected mergeFlags(flags?: GlobalFlags): string[] {
    const flagParams: string[] = [];
    if (flags) {
      for (const [key, value] of Object.entries(flags)) {
        const flag = `--${paramCase(key)}`;
        if (Array.isArray(value)) {
          value.forEach((val) => {
            flagParams.push(flag);
            flagParams.push(val);
          });
        }
        if (typeof value === "boolean") {
          flagParams.push(flag);
        }
        if (typeof value === "string") {
          flagParams.push(flag);
          flagParams.push(value);
        }
      }
    }

    return flagParams;
  }
  //#endregion

  //#region containers
  abstract run(
    image: string,
    flags?: RunCommandFlags
  ): Promise<ChildResultType>;

  abstract stop(
    container: string | string[],
    flags?: StopCommandFlags
  ): Promise<ChildResultType>;

  abstract remove(
    container: string | string[],
    flags?: RemoveCommandFlags
  ): Promise<ChildResultType>;
  //#endregion

  //#region images
  abstract pullImage(image: string): Promise<ChildResultType>;
  abstract getImages(): Promise<ImageResult[]>;
  abstract removeImage(
    image: string | string[],
    flags?: RemoveImageCommandFlags
  ): Promise<ChildResultType>;
  //#endregion

  //#region VMs
  abstract checkVM(): Promise<boolean>;
  abstract initVM(): Promise<boolean>;
  abstract downloadVM(): Promise<boolean>;
  abstract downloadVMImages(): Promise<VMImage[]>;
  //#endregion
}
