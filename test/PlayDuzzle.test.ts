import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { EventLog } from "ethers";
import { ethers } from "hardhat";
import { EventTopic } from "./enum/test";
import { Dal } from "../typechain-types/contracts/erc-20/Dal";
import { abi as DalAbi } from "../artifacts/contracts/erc-20/Dal.sol/Dal.json";
import { PlayDuzzle } from "../typechain-types/contracts/service/PlayDuzzle";
import { MaterialItem } from "../typechain-types/contracts/erc-721/MaterialItem";
import { abi as MaterialAbi } from "../artifacts/contracts/erc-721/MaterialItem.sol/MaterialItem.json";
import { abi as BlueprintAbi } from "../artifacts/contracts/erc-721/BlueprintItem.sol/BlueprintItem.json";
import { abi as PuzzlePieceAbi } from "../artifacts/contracts/erc-721/PuzzlePiece.sol/PuzzlePiece.json";

import { BlueprintItem } from "./../typechain-types/contracts/erc-721/BlueprintItem";
import { PuzzlePiece } from "../typechain-types/contracts/erc-721/PuzzlePiece";
import { PlayDuzzleContractData } from "./data/playduzzle/input-data-class/playduzzle-deploy";
import { InputData1 } from "./data/playduzzle/input-data";
import { SeasonData } from "./data/playduzzle/input-data-class/season";
import { DefaultDuzzleData } from "./data/playduzzle/input-data-class/constants";

const _ = new PlayDuzzleContractData(...InputData1.deployParameters);
const firstSeasonData = new SeasonData(InputData1.seasonData1);

describe("PlayDuzzle", function () {
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  // deploy play duzzle contract & set the first season data
  this.beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const playDuzzleContract = await ethers.getContractFactory("PlayDuzzle");
    const playDuzzleInstance = (await playDuzzleContract.deploy(
      ..._.deployParameters
    )) as unknown as PlayDuzzle;

    const dalTokenAddress = await playDuzzleInstance.dalToken();
    const dalInstance = (await ethers.getContractAt(
      DalAbi,
      dalTokenAddress
    )) as unknown as Dal;

    const blueprintItemTokenAddress =
      await playDuzzleInstance.blueprintItemToken();
    const bluePrintItemInstance = (await ethers.getContractAt(
      BlueprintAbi,
      blueprintItemTokenAddress
    )) as unknown as BlueprintItem;

    const puzzlePieceTokenAddress = await playDuzzleInstance.puzzlePieceToken();
    const puzzlePieceInstance = (await ethers.getContractAt(
      PuzzlePieceAbi,
      puzzlePieceTokenAddress
    )) as unknown as PuzzlePiece;

    _.setInstance(
      playDuzzleInstance,
      dalInstance,
      bluePrintItemInstance,
      puzzlePieceInstance
    );

    const receipt = await (
      await playDuzzleInstance.startSeason(
        ...firstSeasonData.startSeasonParameters
      )
    ).wait();

    const materialItemTokenAddresses: string[] = (
      receipt?.logs.find(
        (e) => e.topics[0] === EventTopic.StartSeason
      ) as EventLog
    ).args[0];

    firstSeasonData.makeZoneDataParameters(materialItemTokenAddresses);

    for (
      let i: number = 0;
      i < firstSeasonData.materialItemTokens!.length;
      i++
    ) {
      firstSeasonData.materialItemInstances[i] = (await ethers.getContractAt(
        MaterialAbi,
        firstSeasonData.materialItemTokens![i]
      )) as unknown as MaterialItem;
    }

    await Promise.all(
      new Array(DefaultDuzzleData.ZoneCount)
        .fill(null)
        .map((_e, i) =>
          _.playDuzzleInstance!.setZoneData(
            ...firstSeasonData.setZoneDataParametersArr![i]
          )
        )
    );
  });

  describe("Get A Random Item NFT", function () {
    it("To get a random item NFT, need 2 DAL tokens.", async function () {
      await expect(
        _.playDuzzleInstance!.connect(addr1).getRandomItem()
      ).to.be.rejectedWith("ERC20InsufficientBalance");
    });

    it("Emits a Mint event for newly minted random item nft", async function () {
      await _.dalInstance!.mint(addr1.address, 2);
      const txResponse = await _.playDuzzleInstance!.connect(
        addr1
      ).getRandomItem();
      const txReceipt = await txResponse.wait();
      expect(txReceipt?.logs.some((e) => e.topics[0] === EventTopic.Mint)).to.be
        .true;
    });

    it("get random item nft by 2 DAL", async function () {
      await _.dalInstance!.mint(addr1.address, 4);
      const dalBalance = await _.dalInstance!.balanceOf(addr1.address);

      // 재료 아이템 발행
      const txResponse = await _.playDuzzleInstance!.connect(
        addr1
      ).getRandomItem();

      const txReceipt = await txResponse.wait();
      const mintEvent = txReceipt?.logs.find(
        (e) => e.topics[0] === EventTopic.Mint
      );

      // 2DAL 차감 확인
      const finalDalBalance = await _.dalInstance!.balanceOf(addr1.address);
      expect(dalBalance - BigInt(2)).to.equal(finalDalBalance);

      // 발행된 NFT의 토큰 주소가 (재료 , 설계도면) 중에 하나인지 확인
      const tokenAddress = mintEvent?.address;
      expect([
        ...firstSeasonData.materialItemTokens!,
        await _.bluepirntInstance?.getAddress(),
      ]).include(
        tokenAddress // 컨트랙트 주소
      );

      // addr1에게 발행되었는지
      const iface = new ethers.Interface(MaterialAbi);
      const decodedLog = iface.parseLog(mintEvent!);
      const [to, tokenId] = decodedLog?.args!;
      expect(to).to.equal(addr1.address);

      // 발행된 아이템 종류에 따라 알맞은 토큰 컨트랙트의 balance 조회
      if (tokenAddress === (await _.bluepirntInstance?.getAddress())) {
        const balance = await _.bluepirntInstance!.balanceOf(addr1.address);
        expect(balance).to.equal(1);
        expect(await _.bluepirntInstance!.ownerOf(tokenId)).to.equal(
          addr1.address
        );
      } else {
        for (
          let i: number = 0;
          i < firstSeasonData.materialItemTokens!.length;
          i++
        ) {
          if (
            tokenAddress ===
            (await firstSeasonData.materialItemInstances![i].getAddress())
          ) {
            const balance = await firstSeasonData.materialItemInstances![
              i
            ].balanceOf(addr1.address);
            expect(balance).to.equal(1);
            expect(
              await firstSeasonData.materialItemInstances![i].ownerOf(tokenId)
            ).to.equal(addr1.address);
          }
        }
      }
    });

    it("if supply amount exceed total max supply, cannot mint item nft", async function () {
      const materialTotalMaxSupplys: number =
        firstSeasonData.initData.maxSupplys.reduce((acc, cur) => acc + cur); // 65 + 50 = 115

      const blueprintsTotalCount: number =
        firstSeasonData.initData.pieceCountOfZones.reduce(
          (acc, cur) => acc + cur,
          0
        ); // 115

      const totalItemMaxSupplys =
        materialTotalMaxSupplys + blueprintsTotalCount;

      await _.dalInstance!.mint(addr1, (totalItemMaxSupplys + 1) * 2);

      for (let i: number = 0; i < totalItemMaxSupplys; i++) {
        await _.playDuzzleInstance!.connect(addr1).getRandomItem();
      }

      // TODO: totalItemMaxSupplys 넘었는데 revert 안되어서 아주 가끔 실패함(40번중에 1번)
      // AssertionError: Expected transaction to be reverted with reason 'item nft sold out', but it didn't revert
      await expect(
        _.playDuzzleInstance!.connect(addr1).getRandomItem()
      ).to.be.revertedWithCustomError(_.playDuzzleInstance!, "SoldOutItems");
    });
  });

  describe("Get A Puzzle Piece NFT", function () {
    it("get puzzle piece nft burning required items", async function () {
      //   console.log(firstSeasonData.materialItemTokens);
      const materialTotalMaxSupplys: number =
        firstSeasonData.initData.maxSupplys.reduce((acc, cur) => acc + cur); // 65 + 50 = 115

      const blueprintsTotalCount: number =
        firstSeasonData.initData.pieceCountOfZones.reduce(
          (acc, cur) => acc + cur,
          0
        ); // 115

      const totalItemMaxSupplys =
        materialTotalMaxSupplys + blueprintsTotalCount;

      await _.dalInstance!.mint(addr1, totalItemMaxSupplys * 2);
      let mintedItems: {
        tokenAddress: string;
        tokenIds: string[];
        name?: string;
      }[] = [];

      // 부족한 없게 addr1 에게 모든 아이템 mint
      for (let i: number = 0; i < totalItemMaxSupplys; i++) {
        let txResponse = await _.playDuzzleInstance!.connect(
          addr1
        ).getRandomItem();
        let mintEvent = (await txResponse.wait())?.logs.find(
          (e) => e.topics[0] === EventTopic.Mint
        );
        if (mintEvent?.address! === (await _.bluepirntInstance?.getAddress())) {
          const iface = new ethers.Interface(BlueprintAbi);
          const decodedLog = iface.parseLog(mintEvent!);
          const [to, tokenId] = decodedLog?.args!;

          let e = mintedItems.find(
            (e) => e.tokenAddress === mintEvent?.address
          );
          if (e) {
            e.tokenIds.push(tokenId);
          } else {
            mintedItems.push({
              tokenAddress: (await _.bluepirntInstance?.getAddress())!,
              tokenIds: [tokenId],
              name: "blueprint",
            });
          }
        } else {
          let iface = new ethers.Interface(MaterialAbi);
          let decodedLog = iface.parseLog(mintEvent!);
          let [to, tokenId] = decodedLog?.args!;
          let e = mintedItems.find(
            (e) => e.tokenAddress === mintEvent?.address
          );
          if (e) {
            e.tokenIds.push(tokenId);
          } else {
            mintedItems.push({
              tokenAddress: mintEvent?.address!,
              tokenIds: [tokenId],
            });
          }
        }
      }
      console.log("얻은 재료들", mintedItems);

      console.log("유저 보유 아이템 - before");
      for (
        let i: number = 0;
        i < firstSeasonData.materialItemInstances!.length;
        i++
      ) {
        let balance = await firstSeasonData.materialItemInstances![i].balanceOf(
          addr1.address
        );
        console.log(`${firstSeasonData.materialItemTokens[i]}: ${balance}개`);
      }
      console.log(
        `blueprint nfts: ${await _.bluepirntInstance!.balanceOf(
          addr1.address
        )}개
        `
      );

      // pieceCountOfZones: [
      //   4, 5, 3, 7, 2, 10, 3, 7, 7, 9, 11, 3, 4, 4, 6, 12, 3, 8, 5, 2,
      // ], // zone 0: 0~3 (4 pieces), zone1: 4~8(5 pieces) ... zone 19:
      await _.playDuzzleInstance!.connect(addr1).unlockPuzzlePiece(3); // zone 0 -> 재료[0] 1개, 재료[1] 1개
      console.log("유저 보유 아이템 - after");
      for (
        let i: number = 0;
        i < firstSeasonData.materialItemInstances!.length;
        i++
      ) {
        let balance = await firstSeasonData.materialItemInstances[i].balanceOf(
          addr1.address
        );
        console.log(`${firstSeasonData.materialItemTokens[i]}: ${balance}개`);
      }
      console.log(
        `blueprint nfts: ${await _.bluepirntInstance!.balanceOf(addr1.address)}`
      );
      await _.playDuzzleInstance!.connect(addr1).unlockPuzzlePiece(4); // zone 1 -> 재료[0] 2개
      await _.playDuzzleInstance!.connect(addr1).unlockPuzzlePiece(11); // zone 2 -> 재료[1] 2개
      await _.playDuzzleInstance!.connect(addr1).unlockPuzzlePiece(12); // zone 3 -> 재료[1] 1개
      await _.playDuzzleInstance!.connect(addr1).unlockPuzzlePiece(21); // zone 5(21~30) -> 재료[0] 2개, 재료[1] 2개
      await _.playDuzzleInstance!.connect(addr1).unlockPuzzlePiece(48); // zone 9(48~56) -> 재료[0] 1개

      expect(await _.puzzlePieceInstance!.ownerOf(4)).to.equal(addr1.address);
      expect(await _.puzzlePieceInstance!.ownerOf(11)).to.equal(addr1.address);
      expect(await _.puzzlePieceInstance!.ownerOf(12)).to.equal(addr1.address);
      expect(await _.puzzlePieceInstance!.ownerOf(21)).to.equal(addr1.address);
      expect(await _.puzzlePieceInstance!.ownerOf(48)).to.equal(addr1.address);
    });

    // TODO: getRandomItem() 메서드 N 번 호출 -> 얻은 아이템들로 unlock 가능한 zone 잠금해제 되는지 확인
    // 다른 zone mint 시도 - 오류 확인
    it("Unable to mint the puzzle piece nft without specific materials and blueprint nft", async function () {});
  });

  describe("Get Season Data", function () {
    it("get all season ids", async function () {
      const seasonIds = await _.playDuzzleInstance!.getAllSeasonIds();
      console.log("seasonIds: ", seasonIds);
    });

    it("get item minted counts by season id", async function () {
      const [materialItemTokens, itemMaxSupplys, itemMinted, mintedBlueprint] =
        await _.playDuzzleInstance!.getItemMintedCountsBySeasonId(0);

      // 시즌 시작시 startSeason() 파라미터로 전달한 값과 일치하는지 확인
      expect(firstSeasonData.materialItemTokens).to.eql(materialItemTokens);
      expect(firstSeasonData.initData.maxSupplys.map((e) => BigInt(e))).to.eql(
        itemMaxSupplys
      );
      // getRandomItem() 을 한 번도 호출한 적 없는 상태
      expect(itemMinted).to.eql(new Array(itemMinted.length).fill(BigInt(0)));
      expect(mintedBlueprint).to.eql(
        new Array(mintedBlueprint.length).fill(false)
      );

      // DAL 발행 -> getRandomItem() 호출
      await _.dalInstance?.mint(addr1.address, 2);
      const mintEvent = (
        await (
          await _.playDuzzleInstance!.connect(addr1).getRandomItem()
        ).wait()
      )?.logs.find((e) => e.topics[0] === EventTopic.Mint);
      const itemTokenAddress = mintEvent?.address;

      const [x, y, itemMintedFinal, mintedBlueprintFinal] =
        await _.playDuzzleInstance!.getItemMintedCountsBySeasonId(0);

      if (itemTokenAddress === (await _.bluepirntInstance?.getAddress())) {
        const blueprintId =
          mintEvent?.index! - Number(await _.playDuzzleInstance?.offset());

        // TODO: 2번 실패함
        expect(mintedBlueprintFinal[blueprintId]).to.be.true;
      } else {
        const materialItemIdx = materialItemTokens.findIndex(
          (e) => e === itemTokenAddress
        );
        expect(itemMintedFinal[materialItemIdx]).to.equal(1);
      }
    });

    it("get puzzle piece minted counts by season id", async function () {
      const [totalPieceCount, mintedCount] =
        await _.playDuzzleInstance!.getPuzzlePieceMintedCountsBySeasonId(0);
      const _totalPieceCount: number =
        firstSeasonData.initData.pieceCountOfZones.reduce(function (a, b) {
          return a + b;
        });
      expect(Number(totalPieceCount)).to.equal(_totalPieceCount);
      expect(Number(mintedCount)).to.equal(0);
    });

    it("get other data by season id", async function () {
      const [
        pieceCountOfZones,
        requiredItemsForMinting,
        requiredItemAmount,
        startedAt, // TODO:
      ] = await _.playDuzzleInstance!.getDataBySeasonId(0);

      expect(pieceCountOfZones.map((e) => Number(e))).to.eql(
        firstSeasonData.initData.pieceCountOfZones
      );
      expect(requiredItemsForMinting).to.eql(
        firstSeasonData.requiredMaterialTokensForMinting
      );
      expect(requiredItemAmount.map((e) => e.map((e) => Number(e)))).to.eql(
        firstSeasonData.initData.requiredMaterialAmounts
      );
    });

    it("if season id does not existed, revert with 'season 404'", async function () {
      await expect(
        _.playDuzzleInstance!.getItemMintedCountsBySeasonId(10)
      ).to.be.revertedWithCustomError(
        _.playDuzzleInstance!,
        "SeasonIdNotFound"
      );

      await expect(
        _.playDuzzleInstance!.getPuzzlePieceMintedCountsBySeasonId(10)
      ).to.be.revertedWithCustomError(
        _.playDuzzleInstance!,
        "SeasonIdNotFound"
      );

      await expect(
        _.playDuzzleInstance!.getDataBySeasonId(10)
      ).to.be.revertedWithCustomError(
        _.playDuzzleInstance!,
        "SeasonIdNotFound"
      );
    });
  });
});

// TODO: owner 가 metadata baseUri 변경 테스트
