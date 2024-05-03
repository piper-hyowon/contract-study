import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "dotenv/config";
import "hardhat-deploy";
import "./hardhat-type-extensions";

import { extendEnvironment, HardhatUserConfig, task } from "hardhat/config";
import { getConfig } from "./config";

import {
  transaction,
} from "./scripts/transaction";
import { utils } from "ethers";

extendEnvironment((hre) => {
  hre.configByNetwork = getConfig(hre.network.name);
});

task("transaction", "").setAction(async (args, hre, runSuper) => {
  await transaction(hre);
});

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.2",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    hardhat: {},
    amoy: {
      url: process.env.RPC_AMOY,
      chainId: parseInt(process.env.CHAIN_ID_AMOY!),
    },
  },
};

export default config;
