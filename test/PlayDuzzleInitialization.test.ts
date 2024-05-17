import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ContractTransactionResponse, EventLog } from "ethers";
import { ethers } from "hardhat";
import { EventTopic } from "./enum/test";
import { Dal } from "../typechain-types/contracts/erc-20/Dal";
import { abi as DalAbi } from "../artifacts/contracts/erc-20/Dal.sol/Dal.json";
import { PlayDuzzle } from "../typechain-types/contracts/service/PlayDuzzle";
import { FactoryOptions } from "hardhat/types";
import { SeasonData } from "./data/playduzzle/input-data-class/season";
import { DefaultDuzzleData } from "./data/playduzzle/input-data-class/constants";
import { PlayDuzzleContractData } from "./data/playduzzle/input-data-class/playduzzle-deploy";
import { InputData1 } from "./data/playduzzle/input-data";

const _ = new PlayDuzzleContractData(...InputData1.deployParameters);

//
/** 1.  PlayDuzzle 컨트랙트 배포
 *  new PlayDuzzleContractData 클래스
 * - PlayDuzzleContractData 의 deployParameters 이용
 *
 *  2. 배포 후 생성된 Dal, Blueprint, PuzzlePiece 인스턴스 세팅
 *  PlayDuzzleContractData.setInstance()
 */

/** 새 시즌 시작을 위한(첫 시즌 포함) - PlayDuzzle 컨트랙트는 배포된 상태
 * SeasonData 클래스와 PlayDuzzle 컨트랙트 함수 호출 순서
 * 1. new SeasonData 생성
 *
 * 2. PlayDuzzle 컨트랙트 startSeason() 메서드 호출
 *  SeasonData 의 startSeasonParameters 이용
 *
 * 3. 만들어진 재료 컨트랙트 주소 값을 저장
 *  startSeason() 호출시 발생한 이벤트 파라미터 값으로 Zone Data 세팅
 *  SeasonData.makeZoneDataParameters(재료토큰주소[]) 로 세팅
 *
 * 4. Zone 별 조각수/필요한재료토큰 목록/개수 세팅
 *  PlayDuzzle 컨트랙트의 setZoneData() 메서드를 zone 개수만큼 호출
 *  파라미터로는 SeasonData.setZoneDataParametersArr 사용
 *
 */
const firstSeasonData = new SeasonData(InputData1.seasonData1);
let secondSeasonData: SeasonData;

describe("PlayDuzzle Initialization / Start New Season", function () {
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;

  this.beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const playDuzzleContract = await ethers.getContractFactory(
      "PlayDuzzle"
      // options
    );
    const playDuzzleInstance = (await playDuzzleContract.deploy(
      ..._.deployParameters
    )) as unknown as PlayDuzzle;

    const dalTokenAddress = await playDuzzleInstance.dalToken();
    const dalInstance = (await ethers.getContractAt(
      DalAbi,
      dalTokenAddress
    )) as unknown as Dal;

    _.setInstance(playDuzzleInstance, dalInstance);
  });

  describe("Starting a First Season", function () {
    it("Only allows owner to start a new season", async function () {
      await expect(
        _.playDuzzleInstance!.connect(addr1).startSeason(
          ...firstSeasonData.startSeasonParameters
        )
      ).to.be.revertedWithCustomError(
        _.playDuzzleInstance!,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("get all season ids", async function () {
      const seasonIds = await _.playDuzzleInstance!.getAllSeasonIds();
      await _.playDuzzleInstance!.startSeason(
        ...firstSeasonData.startSeasonParameters
      );

      const seasonIdsAfterStartSeason =
        await _.playDuzzleInstance!.getAllSeasonIds();
      expect(seasonIds.length + 1).to.equal(seasonIdsAfterStartSeason.length);

      await _.playDuzzleInstance!.startSeason(
        ...firstSeasonData.startSeasonParameters
      );
      const seasonIdsAfterStart2Seasons =
        await _.playDuzzleInstance!.getAllSeasonIds();
      expect(seasonIds.length + 2).to.equal(seasonIdsAfterStart2Seasons.length);
    });

    it("set season data", async function () {
      const { existedItemCollections, newItemNames } = firstSeasonData.initData;
      const itemCount = firstSeasonData.initData.maxSupplys.length;
      const receipt = await (
        await _.playDuzzleInstance!.startSeason(
          ...firstSeasonData.startSeasonParameters
        )
      ).wait();

      const materialItemTokenAddresses: string[] = (
        receipt?.logs.find(
          (e) => e.topics[0] === EventTopic.StartSeason
        ) as EventLog
      ).args[0];

      expect(materialItemTokenAddresses.length).to.equal(itemCount);
      expect(
        materialItemTokenAddresses.slice(0, existedItemCollections.length)
      ).to.eql(existedItemCollections); // 배열 비교, deep-eql
      expect(
        materialItemTokenAddresses.slice(existedItemCollections.length).length
      ).to.equal(newItemNames.length);

      firstSeasonData.makeZoneDataParameters(materialItemTokenAddresses);

      // 에러 없이 zone count 만큼 setZoneData() 호출 확인
      const setZoneDatas = new Array(DefaultDuzzleData.ZoneCount)
        .fill(null)
        .map((_e, i) =>
          _.playDuzzleInstance!.setZoneData(
            ...firstSeasonData.setZoneDataParametersArr![i]
          )
        );
      const result = await Promise.allSettled(setZoneDatas);
      expect(result.every((e) => e.status === "fulfilled")).to.be.true;

      // setZoneData() 호출시 발생한 이벤트 값으로 컨트랙트 storage 에 의도한 값 세팅 확인F
      for (let zone: number = 0; zone < DefaultDuzzleData.ZoneCount; zone++) {
        let contractResponse: ContractTransactionResponse =
          await _.playDuzzleInstance!.setZoneData(
            ...firstSeasonData.setZoneDataParametersArr![zone]
          );
        const args = (
          (await contractResponse.wait())?.logs.find(
            (e) => e.topics[0] === EventTopic.SetZoneData
          ) as EventLog
        ).args;
        expect(zone).to.equal(args.getValue("zoneId"));
        expect(firstSeasonData.initData.pieceCountOfZones[zone]).to.equal(
          args.getValue("pieceCountOfZones")
        );
        expect(firstSeasonData.requiredMaterialTokensForMinting![zone]).to.eql(
          args.getValue("requiredItemsForMinting")
        );
        expect(
          firstSeasonData.initData.requiredMaterialAmounts[zone].map((e) =>
            BigInt(e)
          )
        ).to.eql(args.getValue("requiredItemAmount"));
      }
    });
  });

  describe("Starting a Second Season", function () {
    it("set season data with existed material tokens of first season", async function () {
      const startFirstSeasonReceipt = await (
        await _.playDuzzleInstance!.startSeason(
          ...firstSeasonData.startSeasonParameters
        )
      ).wait();

      const firstSeasonMaterialTokenAddresses: string[] = (
        startFirstSeasonReceipt?.logs.find(
          (e) => e.topics[0] === EventTopic.StartSeason
        ) as EventLog
      ).args[0];

      // 두 번째 시즌에서 사용하는 재료:
      // - 첫 시즌의 0,1 재료 토큰 중 하나 유지 (1번째)
      InputData1.seasonData2.existedItemCollections = [
        firstSeasonMaterialTokenAddresses[1],
      ];

      secondSeasonData = new SeasonData(InputData1.seasonData2);

      const { existedItemCollections, newItemNames } =
        secondSeasonData.initData;
      const itemCount = secondSeasonData.initData.maxSupplys.length;
      const startSecondSeasonReceipt = await (
        await _.playDuzzleInstance!.startSeason(
          ...secondSeasonData.startSeasonParameters
        )
      ).wait();

      const secondSeasonMaterialTokenAddresses: string[] = (
        startSecondSeasonReceipt?.logs.find(
          (e) => e.topics[0] === EventTopic.StartSeason
        ) as EventLog
      ).args[0];

      expect(secondSeasonMaterialTokenAddresses.length).to.equal(itemCount);
      expect(
        secondSeasonMaterialTokenAddresses.slice(
          0,
          existedItemCollections.length
        )
      ).to.eql(existedItemCollections); // 배열 비교, deep-eql
      expect(
        secondSeasonMaterialTokenAddresses.slice(existedItemCollections.length)
          .length
      ).to.equal(newItemNames.length);

      secondSeasonData.makeZoneDataParameters(
        secondSeasonMaterialTokenAddresses
      );

      // 에러 없이 zone count 만큼 setZoneData() 호출 확인
      const setZoneDatas = new Array(DefaultDuzzleData.ZoneCount)
        .fill(null)
        .map((_e, i) =>
          _.playDuzzleInstance!.setZoneData(
            ...secondSeasonData.setZoneDataParametersArr![i]
          )
        );
      const result = await Promise.allSettled(setZoneDatas);
      expect(result.every((e) => e.status === "fulfilled")).to.be.true;

      // setZoneData() 호출시 발생한 이벤트 값으로 컨트랙트 storage 에 의도한 값 세팅 확인F
      for (let zone: number = 0; zone < DefaultDuzzleData.ZoneCount; zone++) {
        let contractResponse: ContractTransactionResponse =
          await _.playDuzzleInstance!.setZoneData(
            ...secondSeasonData.setZoneDataParametersArr![zone]
          );
        const args = (
          (await contractResponse.wait())?.logs.find(
            (e) => e.topics[0] === EventTopic.SetZoneData
          ) as EventLog
        ).args;
        expect(zone).to.equal(args.getValue("zoneId"));
        expect(secondSeasonData.initData.pieceCountOfZones[zone]).to.equal(
          args.getValue("pieceCountOfZones")
        );
        expect(secondSeasonData.requiredMaterialTokensForMinting![zone]).to.eql(
          args.getValue("requiredItemsForMinting")
        );
        expect(
          secondSeasonData.initData.requiredMaterialAmounts[zone].map((e) =>
            BigInt(e)
          )
        ).to.eql(args.getValue("requiredItemAmount"));
      }
    });
  });
});
