import { HardhatRuntimeEnvironment } from "hardhat/types";
import tokenAbi from "../artifacts/contracts/TestToken.sol/TestToken.json";
import { TestToken } from "../typechain";

export const transaction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, configByNetwork } = hre;
  const { chainId, ownerPk, rpcUrl } = configByNetwork;

  console.log(
    `[task] transaction >> network=${hre.network.name} / chainId=${chainId}`
  );

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(ownerPk, provider);
};
