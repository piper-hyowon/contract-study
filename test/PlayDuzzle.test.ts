import { PlayDuzzle } from "./../typechain-types/contracts/service/PlayDuzzle";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import {
  AddressLike,
  BigNumberish,
  ContractTransactionResponse,
  EventLog,
  keccak256,
  Log,
  Result,
  toBigInt,
} from "ethers";
import { ethers } from "hardhat";
import { EventTopic } from "./enum/test";
import { MaterialItem } from "./../typechain-types/contracts/erc-721/MaterialItem";

describe("PlayDuzzle", function () {
  let playDuzzleInstance: PlayDuzzle;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  this.beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const playDuzzleContract = await ethers.getContractFactory("PlayDuzzle");
    playDuzzleInstance =
      (await playDuzzleContract.deploy()) as unknown as PlayDuzzle;
    console.log("playDuzzle: ", await playDuzzleInstance.getAddress());
  });

  describe("Starting a First Season", function () {
    it("Only allows owner to start a new season", async function () {});

    it("set season data", async function () {
      const existedItemCollections: string[] = [];
      const newItemName: string[] = ["sand", "hammer"];
      const newItemSymbols: string[] = ["SND", "HMR"];
      const maxSupplys: number[] = [65, 50]; // length  =  기존 + new !!
      const pieceCountOfZones: number[] = [
        4, 5, 3, 7, 2, 10, 3, 7, 7, 9, 11, 3, 4, 4, 6, 12, 3, 8, 5, 2,
      ]; // zone 0: 0~3 (4 pieces), zone1: 4~8(5 pieces) ... zone 19:

      const totalPieceCount = pieceCountOfZones.reduce(function (a, b) {
        return a + b;
      }); // 115

      // parameter validating
      expect(newItemName.length).to.equal(newItemSymbols.length);
      expect(existedItemCollections.length + newItemName.length).to.equal(
        maxSupplys.length
      );

      const receipt = await (
        await playDuzzleInstance.startSeason(
          existedItemCollections,
          newItemName,
          newItemSymbols,
          maxSupplys,
          totalPieceCount
        )
      ).wait();

      const materialItemTokenAddresses: string[] = (
        receipt?.logs.find(
          (e) => e.topics[0] === EventTopic.StartSeason
        ) as EventLog
      ).args[0];

      expect(materialItemTokenAddresses.length).to.equal(maxSupplys.length);
      expect(
        materialItemTokenAddresses.slice(0, existedItemCollections.length)
      ).to.eql(existedItemCollections); // 배열 비교, deep-eql
      expect(
        materialItemTokenAddresses.slice(existedItemCollections.length).length
      ).to.equal(newItemName.length);

      // 20 개의 구역 데이터 세팅(zone별 퍼즐 조각 수, zone별 필요한 재료)
      const requiredItemsForMinting: string[][] = [
        [materialItemTokenAddresses[0], materialItemTokenAddresses[1]], // zone0 필요한 재료: 재료0, 재료1
        [materialItemTokenAddresses[0]], // zone1 필요한 재료: 재료0
        [materialItemTokenAddresses[1]], // zone2 필요한 재료: 재료1
        [materialItemTokenAddresses[1]], // zone3 필요한 재료: 재료1
        [materialItemTokenAddresses[0], materialItemTokenAddresses[1]], // zone4 필요한 재료: 재료0, 재료1
        [materialItemTokenAddresses[0], materialItemTokenAddresses[1]], // zone5 필요한 재료: 재료0, 재료1
        [materialItemTokenAddresses[0]], // zone6 필요한 재료: 재료0
        [materialItemTokenAddresses[0]], // zone7 필요한 재료: 재료0
        [materialItemTokenAddresses[0]], // zone8 필요한 재료: 재료0
        [materialItemTokenAddresses[0]], // zone9 필요한 재료: 재료0
        [materialItemTokenAddresses[0]], // zone10 필요한 재료: 재료0
        [materialItemTokenAddresses[0]], // zone11 필요한 재료: 재료0
        [materialItemTokenAddresses[0]], // zone12 필요한 재료: 재료0
        [materialItemTokenAddresses[0]], // zone13 필요한 재료: 재료0
        [materialItemTokenAddresses[0]], // zone14 필요한 재료: 재료0
        [materialItemTokenAddresses[0]], // zone15 필요한 재료: 재료0
        [materialItemTokenAddresses[0]], // zone16 필요한 재료: 재료0
        [materialItemTokenAddresses[0]], // zone17 필요한 재료: 재료0
        [materialItemTokenAddresses[0]], // zone18 필요한 재료: 재료0
        [materialItemTokenAddresses[0]], // zone19 필요한 재료: 재료0
      ];
      const requiredItemAmount: number[][] = [
        [1, 1], // zone0: 재료x 1개, 재료y 1개씩 필요
        [2], // zone1: 재료x 2개
        [2], // zone2: 재료x 2개
        [1], // zone3: 재료x 1개
        [3, 4], // zone4: 재료x 3개 재료y 4개
        [2, 2], // zone5: 재료x 3개 재료y 4개
        [1], // zone6: 재료x 1개
        [1], // zone7: 재료x 1개
        [1], // zone8: 재료x 1개
        [1], // zone9: 재료x 1개
        [1], // zone10: 재료x 1개
        [1], // zone11: 재료x 1개
        [1], // zone12: 재료x 1개
        [1], // zone13: 재료x 1개
        [1], // zone14: 재료x 1개
        [1], // zone15: 재료x 1개
        [1], // zone16: 재료x 1개
        [1], // zone17: 재료x 1개
        [1], // zone18: 재료x 1개
        [1], // zone19: 재료x 1개
      ];
      expect(requiredItemsForMinting.length).to.equal(
        requiredItemAmount.length
      );

      const setZoneDatas = new Array(20)
        .fill(null)
        .map((_, i) =>
          playDuzzleInstance.setZoneData(
            i,
            pieceCountOfZones[i],
            requiredItemsForMinting[i],
            requiredItemAmount[i]
          )
        );
      const result = await Promise.allSettled(setZoneDatas);
      expect(result.every((e) => e.status === "fulfilled")).to.be.true;

      for (let i: number = 0; i < 20; i++) {
        let contractResponse: ContractTransactionResponse =
          await playDuzzleInstance.setZoneData(
            i,
            pieceCountOfZones[i],
            requiredItemsForMinting[i],
            requiredItemAmount[i]
          );
        const args = (
          (await contractResponse.wait())?.logs.find(
            (e) => e.topics[0] === EventTopic.SetZoneData
          ) as EventLog
        ).args;
        expect(i).to.equal(args.getValue("zoneId"));
        expect(pieceCountOfZones[i]).to.equal(
          args.getValue("pieceCountOfZones")
        );
        expect(requiredItemsForMinting[i]).to.eql(
          args.getValue("requiredItemsForMinting")
        );
        expect(requiredItemAmount[i].map((e) => BigInt(e))).to.eql(
          args.getValue("requiredItemAmount")
        );
      }
    });
  });

  // TODO: 기존 아이템 n(>0)개 + 뉴 아이템
  describe("Starting a Second Season", function () {});
});
