import { expect } from "chai";
import { ethers } from "hardhat";
import { PuzzlePiece } from "../typechain";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";




describe("PlayDuzzle", function () {
  let instance: PuzzlePiece;
  beforeEach(async function () {
    const signers = await ethers.getSigners();

    const contract = await ethers.getContractFactory("PlayDuzzle");
    instance = (await contract.deploy(
      "Test Token",
      "TT",
      "",
      signers[0].address,
    )) as PuzzlePiece;
    await instance.deployed();
  });

  it("테스트", async function () {
    const result = await instance.getBaseURI();
    // instance.mint()
    console.log(result);
  });
});
