import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { EventLog } from "ethers";
import { EventTopic } from "./enum/test";
import { Dal } from "../typechain-types/contracts/erc-20/Dal";

describe("Dal", function () {
  let dalInstance: Dal;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  this.beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const dalContract = await ethers.getContractFactory("Dal");
    const cap = 1000;

    dalInstance = (await dalContract.deploy(
      cap,
      owner, // service contract address,
      owner
    )) as unknown as Dal;
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await dalInstance.owner()).to.equal(owner.address);
    });
  });

  describe("Mint Limit", function () {
    it("Should not mint over the cap", async function () {
      const cap = await dalInstance.cap();
      await expect(
        dalInstance.mint(addr1.address, cap + BigInt(1))
      ).to.be.revertedWithCustomError(dalInstance, "ERC20ExceededCap");
    });

    it("Only minter(owner) can mint", async function () {
      await expect(
        dalInstance.connect(addr1).mint(addr1.address, 1)
      ).to.be.revertedWithCustomError(
        dalInstance,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Transactions", function () {
    it("Emits a transfer event for newly minted", async function () {
      await expect(dalInstance.mint(addr1.address, 1))
        .to.emit(dalInstance, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          addr1.address,
          1
        );

      const txResponse = await dalInstance.mint(addr1.address, 1);
      const txReceipt = await txResponse.wait();
      const transferEvent = txReceipt?.logs.find(
        (e) => e.topics[0] === EventTopic.Transfer
      );
      const [from, to, value] = (<EventLog>transferEvent).args;
      expect(from).to.equal("0x0000000000000000000000000000000000000000");
      expect(to).to.equal(addr1.address);
      expect(value).to.equal(1);
    });

    it("Emits a mint event for newly minted", async function () {
      await expect(dalInstance.mint(addr1.address, 3))
        .to.emit(dalInstance, "Mint")
        .withArgs(addr1.address, 3);

      const txResponse = await dalInstance.mint(addr1.address, 3);
      const txReceipt = await txResponse.wait();
      const transferEvent = txReceipt?.logs.find(
        (e) => e.topics[0] === EventTopic.Mint
      );
      const [to, value] = (<EventLog>transferEvent).args;
      expect(to).to.equal(addr1.address);
      expect(value).to.equal(3);
    });

    it("Transfer", async function () {
      const INITIAL_SUPPLY: number = 50;
      await dalInstance.mint(owner.address, INITIAL_SUPPLY);

      // Transfer 50 tokens from owner to addr1
      const TRANSFER_AMOUNT: number = 50;
      await dalInstance.transfer(addr1.address, TRANSFER_AMOUNT);

      const addr1Balance = await dalInstance.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(TRANSFER_AMOUNT);

      // Transfer 50 tokens from addr1 to addr2
      await dalInstance.connect(addr1).transfer(addr2.address, TRANSFER_AMOUNT);
      const addr2Balance = await dalInstance.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(TRANSFER_AMOUNT);

      const finalAddr1Balance = await dalInstance.balanceOf(addr1.address);
      expect(finalAddr1Balance).to.equal(0);
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
      const initialOwnerBalance = await dalInstance.balanceOf(owner.address);

      // await dalInstance.connect(addr1).transfer(owner.address, 1)
      // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(
        dalInstance.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWithCustomError(dalInstance, "ERC20InsufficientBalance");

      // Owner balance shouldn't have changed.
      expect(await dalInstance.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });

    it("Should update balances after transfers", async function () {
      const INITIAL_SUPPLY: number = 50;
      await dalInstance.mint(owner.address, INITIAL_SUPPLY);

      const initialOwnerBalance = await dalInstance.balanceOf(owner.address);
      const TRANSFER_AMOUNT_ADDR1: number = 10;
      const TRANSFER_AMOUNT_ADDR2: number = 20;

      // Transfer 10 tokens from owner to addr1.
      await dalInstance.transfer(addr1.address, TRANSFER_AMOUNT_ADDR1);

      // Transfer another 20 tokens from owner to addr2.
      await dalInstance.transfer(addr2.address, TRANSFER_AMOUNT_ADDR2);

      // Check balances.
      const finalOwnerBalance = await dalInstance.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(
        initialOwnerBalance -
          BigInt(TRANSFER_AMOUNT_ADDR1 + TRANSFER_AMOUNT_ADDR2)
      );

      const addr1Balance = await dalInstance.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(TRANSFER_AMOUNT_ADDR1);

      const addr2Balance = await dalInstance.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(TRANSFER_AMOUNT_ADDR2);
    });
  });
});
