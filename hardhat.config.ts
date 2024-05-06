import "@nomicfoundation/hardhat-toolbox";
import { getConfig } from "./config";
import { extendEnvironment, HardhatUserConfig } from "hardhat/config";
import "dotenv/config";
import "./hardhat-type-extensions";
import "@nomicfoundation/hardhat-ethers";

extendEnvironment((hre) => {
  hre.configByNetwork = getConfig(hre.network.name);
});

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "shanghai",
      optimizer: {
        enabled: true,
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
