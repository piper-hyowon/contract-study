import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { EventLog, keccak256, Log } from "ethers";
import { ethers } from "hardhat";
import { EventTopic } from "./enum/test";
import { PuzzlePiece } from "./../typechain-types/contracts/erc-721/PuzzlePiece";

describe("PuzzlePiece", function () {
  let puzzlePieceInstance: PuzzlePiece;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  const tokenCollectionName: string = "Duzzle Puzzle Pieces";
  const tokenCollectionSymbol: string = "DZPZ";
  const tokenCollectionBaseUri: string = "baseUrihaha";

  this.beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const dalContract = await ethers.getContractFactory("PuzzlePiece");
    puzzlePieceInstance = (await dalContract.deploy(
      tokenCollectionBaseUri,
      owner.address,
      owner.address
    )) as unknown as PuzzlePiece;
  });

  describe("Deployment", function () {
    it("Create a token collection with a name, symbole, baseURI", async function () {
      expect(await puzzlePieceInstance.symbol()).to.equal(
        tokenCollectionSymbol
      );
      expect(await puzzlePieceInstance.name()).to.equal(tokenCollectionName);
      expect(await puzzlePieceInstance.getBaseURI()).to.equal(
        tokenCollectionBaseUri
      );
    });

    it("Should set minter role to owner", async function () {
      const minterRole = keccak256(ethers.toUtf8Bytes("MINTER"));
      const ownerHasMinterRole = await puzzlePieceInstance.hasRole(
        minterRole,
        owner.address
      );

      expect(ownerHasMinterRole).to.be.true;
    });
  });

  describe("Mint", function () {
    it("Is able to query the NFT balances of an address", async function () {
      const [, tokenId1] = (
        (
          await (await puzzlePieceInstance.mint(owner, BigInt(0))).wait()
        )?.logs.find((e) => e.topics[0] === EventTopic.Mint) as EventLog
      ).args;
      const [, tokenId2] = (
        (
          await (await puzzlePieceInstance.mint(owner, BigInt(1))).wait()
        )?.logs.find((e) => e.topics[0] === EventTopic.Mint) as EventLog
      ).args;

      expect(await puzzlePieceInstance.balanceOf(owner)).to.equal(2);
      expect(await puzzlePieceInstance.ownerOf(tokenId1)).to.equal(owner);
      expect(await puzzlePieceInstance.ownerOf(tokenId2)).to.equal(owner);

      const [, tokenId3] = (
        (
          await (
            await puzzlePieceInstance.mint(addr1.address, BigInt(2))
          ).wait()
        )?.logs.find((e) => e.topics[0] === EventTopic.Mint) as EventLog
      ).args;
      expect(await puzzlePieceInstance.ownerOf(tokenId3)).to.equal(addr1);
    });

    it("Only allows owner to mint NFTs", async function () {
      // 퍼즐 조각 NFT를 유저가 Mint할 수 있지만 이 컨트랙트의 mint 메서드는 minter 만 호출 가능한 이유
      // : 유저는 PuzzlePiece Contract 가 아닌 'PlayDuzzle Contract" 를 호출해서 민트해야한다.
      // PuzzlePiece 에서 직접적으로 Mint 하는건 PlayDuzzle Contract(minter)임
      await expect(
        puzzlePieceInstance.connect(addr1).mint(addr1.address, BigInt(0))
      ).to.be.reverted;
    });

    it("Emits a transfer event for newly minted NFTs", async function () {
      await expect(puzzlePieceInstance.mint(addr1.address, 0))
        .to.emit(puzzlePieceInstance, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          addr1.address,
          0
        );

      const txResponse = await puzzlePieceInstance.mint(
        addr1.address,
        BigInt(1)
      );
      const txReceipt = await txResponse.wait();
      const transferEvent = txReceipt?.logs.find(
        (e) => e.topics[0] === EventTopic.Transfer
      );
      const [, , tokenId] = (<EventLog>transferEvent).args;
      expect(tokenId).to.equal(1);
    });

    it("Emits a mint event for newly minted NFTs", async function () {
      await expect(puzzlePieceInstance.mint(addr1.address, BigInt(0)))
        .to.emit(puzzlePieceInstance, "Mint")
        .withArgs(addr1.address, 0);

      const txResponse = await puzzlePieceInstance.mint(
        addr1.address,
        BigInt(1)
      );
      const txReceipt = await txResponse.wait();
      const transferEvent = txReceipt?.logs.find(
        (e) => e.topics[0] === EventTopic.Mint
      );
      const [, tokenId] = (<EventLog>transferEvent).args;
      expect(tokenId).to.equal(1);
    });
  });

  describe("Transfer", function () {
    it("Is able to transfer NFTs to another wallet when called by owner", async function () {
      await puzzlePieceInstance.mint(owner, BigInt(0));
      await puzzlePieceInstance["safeTransferFrom(address,address,uint256)"](
        owner.address,
        addr1.address,
        0
      );
      expect(await puzzlePieceInstance.ownerOf(0)).to.equal(addr1.address);
    });

    it("Emits a Transfer event when transferring a NFT", async function () {
      await puzzlePieceInstance.mint(owner, BigInt(0));
      await expect(
        puzzlePieceInstance["safeTransferFrom(address,address,uint256)"](
          owner.address,
          addr1.address,
          0
        )
      )
        .to.emit(puzzlePieceInstance, "Transfer")
        .withArgs(owner.address, addr1.address, 0);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      await expect(
        puzzlePieceInstance
          .connect(addr1)
          .transferFrom(owner.address, addr1.address, 1)
      ).to.be.revertedWithCustomError(
        puzzlePieceInstance,
        "ERC721NonexistentToken"
      );

      // Owner balance shouldn't have changed.
      expect(await puzzlePieceInstance.balanceOf(owner.address)).to.equal(0);
    });
  });

  describe("Burn", function () {
    it("Is able to burn NFTs", async function () {
      const [to, mintedTokenId] = (
        (
          await (
            await puzzlePieceInstance.mint(addr1.address, BigInt(0))
          ).wait()
        )?.logs.find((e) => e.topics[0] === EventTopic.Mint) as EventLog
      ).args;
      const balance = await puzzlePieceInstance.balanceOf(addr1.address);

      const [from, burnedTokenId] = (
        (
          await (
            await puzzlePieceInstance.burn(addr1.address, mintedTokenId)
          ).wait()
        )?.logs.find((e) => e.topics[0] === EventTopic.Burn) as EventLog
      ).args;

      expect(to).to.equal(from);
      expect(mintedTokenId).to.equal(burnedTokenId);
      const finalBalance = await puzzlePieceInstance.balanceOf(addr1.address);
      expect(finalBalance).to.equal(balance - BigInt(1));
    });

    it("Emits a Burn event when burning a NFT", async function () {
      const [to, mintedTokenId] = (
        (
          await (
            await puzzlePieceInstance.mint(addr1.address, BigInt(3))
          ).wait()
        )?.logs.find((e: Log) => e.topics[0] === EventTopic.Mint) as EventLog
      ).args;

      await expect(puzzlePieceInstance.burn(addr1.address, mintedTokenId))
        .to.emit(puzzlePieceInstance, "Burn")
        .withArgs(to, mintedTokenId);
    });
  });
});
