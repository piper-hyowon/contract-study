import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { EventLog, keccak256, Log } from "ethers";
import { ethers } from "hardhat";
import { EventTopic } from "./enum/test";
import { MaterialItem } from "./../typechain-types/contracts/erc-721/MaterialItem";

describe("MaterialItems", function () {
  let materialItem1_Instance: MaterialItem;
  let materialItem2_Instance: MaterialItem;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  const tokenCollectionName1: string = "Duzzle Material Item - Sand NFT";
  const tokenCollectionSymbol1: string = "SND";
  const tokenCollectionBaseUri1: string = "localhost:8000/sand";

  const tokenCollectionName2: string = "Duzzle Material Item - Hammer NFT";
  const tokenCollectionSymbol2: string = "HMR";
  const tokenCollectionBaseUri2: string = "localhost:8000/hammer";

  this.beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const materialItemContract = await ethers.getContractFactory(
      "MaterialItem"
    );
    materialItem1_Instance = (await materialItemContract.deploy(
      tokenCollectionName1,
      tokenCollectionSymbol1,
      tokenCollectionBaseUri1,
      owner.address
    )) as unknown as MaterialItem;

    materialItem2_Instance = (await materialItemContract.deploy(
      tokenCollectionName2,
      tokenCollectionSymbol2,
      tokenCollectionBaseUri2,
      owner.address
    )) as unknown as MaterialItem;
  });

  describe("Deployment", function () {
    it("Create a token collection with a name, symbole, baseURI", async function () {
      expect(await materialItem1_Instance.symbol()).to.equal(
        tokenCollectionSymbol1
      );
      expect(await materialItem1_Instance.name()).to.equal(
        tokenCollectionName1
      );
      expect(await materialItem1_Instance.getBaseURI()).to.equal(
        tokenCollectionBaseUri1
      );

      expect(await materialItem2_Instance.symbol()).to.equal(
        tokenCollectionSymbol2
      );
      expect(await materialItem2_Instance.name()).to.equal(
        tokenCollectionName2
      );
      expect(await materialItem2_Instance.getBaseURI()).to.equal(
        tokenCollectionBaseUri2
      );
    });

    it("Should set minter role to owner", async function () {
      const minterRole = keccak256(ethers.toUtf8Bytes("MINTER"));
      const ownerHasToken1MinterRole = await materialItem1_Instance.hasRole(
        minterRole,
        owner.address
      );

      const ownerHasToken2MinterRole = await materialItem2_Instance.hasRole(
        minterRole,
        owner.address
      );

      expect(ownerHasToken1MinterRole && ownerHasToken2MinterRole).to.be.true;
    });
  });

  describe("Mint", function () {
    it("Is able to query the NFT balances of an address", async function () {
      const [, tokenId1] = (
        (await (await materialItem1_Instance.mint(owner)).wait())?.logs.find(
          (e) => e.topics[0] === EventTopic.Mint
        ) as EventLog
      ).args;
      const [, tokenId2] = (
        (await (await materialItem1_Instance.mint(addr1)).wait())?.logs.find(
          (e) => e.topics[0] === EventTopic.Mint
        ) as EventLog
      ).args;
      expect(tokenId1 + BigInt(1)).to.equal(tokenId2);
      expect(await materialItem1_Instance.balanceOf(owner)).to.equal(1);
      expect(await materialItem1_Instance.balanceOf(addr1)).to.equal(1);
      expect(await materialItem1_Instance.ownerOf(tokenId1)).to.equal(owner);
      expect(await materialItem1_Instance.ownerOf(tokenId2)).to.equal(addr1);
    });

    it("Only allows owner to mint NFTs", async function () {
      await expect(materialItem1_Instance.connect(addr1).mint(addr1.address)).to
        .be.reverted;
    });
  });
});
