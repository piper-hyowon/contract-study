import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "ethers";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // ignore type error
  const { configByNetwork, network } = hre;
  const { chainId, ownerPk, rpcUrl } = configByNetwork;
  const { deploy } = hre.deployments;

  console.log(
    `[deployment] Duzzle >> network=${hre.network.name} / chainId=${chainId}`
  );

  const deployment = await deploy("TestToken", {
    from: ownerPk,
    args: [
      "Duzzle Token",
      "DT",
    ],
    log: true,
    gasPrice: ethers.utils.parseUnits("40", "gwei"),
  });

  console.log(deployment);
};

export default deploy;

deploy.tags = ["duzzle"];
