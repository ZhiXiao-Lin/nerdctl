import { ImageResult, RemoveImageCommandFlags } from "@/types/images";
import {
  RemoveCommandFlags,
  RunCommandFlags,
  StopCommandFlags,
} from "@/types/container";

import BaseBackend from "./base";
import { ChildResultType } from "@/types";

export default class WslBackend extends BaseBackend {
  run(image: string, flags?: RunCommandFlags): Promise<ChildResultType> {
    throw new Error("Method not implemented.");
  }
  stop(
    container: string | string[],
    flags?: StopCommandFlags
  ): Promise<ChildResultType> {
    throw new Error("Method not implemented.");
  }
  remove(
    container: string | string[],
    flags?: RemoveCommandFlags
  ): Promise<ChildResultType> {
    throw new Error("Method not implemented.");
  }
  pullImage(image: string): Promise<ChildResultType> {
    throw new Error("Method not implemented.");
  }
  getImages(): Promise<ImageResult[]> {
    throw new Error("Method not implemented.");
  }
  removeImage(
    image: string | string[],
    flags?: RemoveImageCommandFlags
  ): Promise<ChildResultType> {
    throw new Error("Method not implemented.");
  }

  async checkVM(): Promise<boolean> {
    return true;
  }

  async initVM(): Promise<boolean> {
    return true;
  }
}
