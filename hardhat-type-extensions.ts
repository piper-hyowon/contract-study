import "hardhat/types/config";
import "hardhat/types/runtime";
import { IConfig } from "./config/types";

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    configByNetwork: IConfig;
  }
}
