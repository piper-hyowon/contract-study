import { IConfig } from "./types";

require("dotenv").config({ path: "../.env" });

const config: IConfig = {
  chainId: parseInt(process.env.CHAIN_ID_AMOY!),
  ownerPk: process.env.OWNER_PK_AMOY!,
  rpcUrl: process.env.RPC_AMOY!,
};

export default config;
