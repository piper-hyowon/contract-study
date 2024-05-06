import { IConfig } from "./types";

require("dotenv").config({ path: "../.env" });

const config: IConfig = {
  chainId: parseInt(process.env.CHAIN_ID_LOCAL!),
  ownerPk: process.env.OWNER_PK_LOCAL!,
  rpcUrl: process.env.RPC_LOCAL!,
};

export default config;
