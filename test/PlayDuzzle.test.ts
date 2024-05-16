// import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
// import { expect } from "chai";
// import { ContractTransactionResponse, EventLog } from "ethers";
// import { ethers } from "hardhat";
// import { EventTopic } from "./enum/test";
// import { Dal } from "../typechain-types/contracts/erc-20/Dal";
// import { abi as DalAbi } from "../artifacts/contracts/erc-20/Dal.sol/Dal.json";
// import { PlayDuzzle } from "../typechain-types/contracts/service/PlayDuzzle";
// import { FactoryOptions } from "hardhat/types";
// import { MaterialItem } from "../typechain-types/contracts/erc-721/MaterialItem";
// import { abi as MaterialAbi } from "../artifacts/contracts/erc-721/MaterialItem.sol/MaterialItem.json";
// import { abi as BlueprintAbi } from "../artifacts/contracts/erc-721/BlueprintItem.sol/BlueprintItem.json";
// import { abi as PuzzlePieceAbi } from "../artifacts/contracts/erc-721/PuzzlePiece.sol/PuzzlePiece.json";

// import { BlueprintItem } from "./../typechain-types/contracts/erc-721/BlueprintItem";
// import { PuzzlePiece } from "../typechain-types/contracts/erc-721/PuzzlePiece";

// describe("PlayDuzzle", function () {
//   const DAL_TOKEN_CAP = 500_000;
//   const BLUEPRINT_BASE_URI = "localhost:8000/v1/blueprint";
//   const PUZZLEPIECE_BASE_URI = "localhost:8000/v1/puzzlepiece";

//   const seasonData1 = {
//     existedItemCollections: [],
//     newItemNames: ["sand", "hammer"],
//     newItemSymbols: ["SND", "HMR"],
//     maxSupplys: [65, 50],
//     pieceCountOfZones: [
//       4, 5, 3, 7, 2, 10, 3, 7, 7, 9, 11, 3, 4, 4, 6, 12, 3, 8, 5, 2,
//     ], // zone 0: 0~3 (4 pieces), zone1: 4~8(5 pieces) ... zone 19:
//   };
//   let season1_requiredItemsForMinting: string[][];
//   let season1_requiredItemAmount: number[][];

//   const getSeasonData2 = (
//     existedItemCollections: string[],
//     existedItemMaxSupplys: number[]
//   ) => {
//     return {
//       existedItemCollections,
//       newItemNames: ["red brick", "glass"],
//       newItemSymbols: ["RBRK", "GLS"],
//       maxSupplys: [...existedItemMaxSupplys, 50, 30],
//       pieceCountOfZones: [
//         1, 2, 1, 2, 2, 6, 3, 10, 7, 9, 11, 3, 4, 4, 7, 12, 3, 10, 9, 3,
//       ], // zone 0: 0~3 (4 pieces), zone1: 4~8(5 pieces) ... zone 19:
//     };
//   };

//   let playDuzzleInstance: PlayDuzzle;
//   let dalInstance: Dal;
//   let blueprintItemTokenAddress: string;
//   let bluePrintItemInstance: BlueprintItem;
//   let puzzlePieceTokenAddress: string;
//   let puzzlePieceInstance: PuzzlePiece;
//   let owner: HardhatEthersSigner;
//   let addr1: HardhatEthersSigner;
//   let addr2: HardhatEthersSigner;
//   let season1MaterialItemTokens: string[];
//   let season2MaterialItemTokens: string[];
//   let materialItemInstances: MaterialItem[];

//   // deploy play duzzle contract & set the first season data
//   this.beforeEach(async function () {
//     [owner, addr1, addr2] = await ethers.getSigners();
//     const DuzzleLibrary = await ethers.getContractFactory("DuzzleLibrary");
//     const duzzleLibrary = await DuzzleLibrary.deploy();
//     const duzzleLibraryAddress = await duzzleLibrary.getAddress();

//     const Utils = await ethers.getContractFactory("Utils");
//     const utils = await Utils.deploy();
//     const utilsAddress = await utils.getAddress();
//     const options: FactoryOptions = {
//       libraries: {
//         // DuzzleLibrary: duzzleLibraryAddress!,
//         // Utils: utilsAddress!,
//       },
//     };
//     const playDuzzleContract = await ethers.getContractFactory(
//       "PlayDuzzle",
//       options
//     );
//     playDuzzleInstance = (await playDuzzleContract.deploy(
//       // duzzleLibraryAddress,
//       // utilsAddress,
//       DAL_TOKEN_CAP,
//       BLUEPRINT_BASE_URI,
//       PUZZLEPIECE_BASE_URI
//     )) as unknown as PlayDuzzle;

//     const dalTokenAddress = await playDuzzleInstance.dalToken();
//     dalInstance = (await ethers.getContractAt(
//       DalAbi,
//       dalTokenAddress
//     )) as unknown as Dal;

//     blueprintItemTokenAddress = await playDuzzleInstance.blueprintItemToken();
//     bluePrintItemInstance = (await ethers.getContractAt(
//       BlueprintAbi,
//       blueprintItemTokenAddress
//     )) as unknown as BlueprintItem;

//     puzzlePieceTokenAddress =
//       await playDuzzleInstance.puzzlePieceTokenAddress();
//     puzzlePieceInstance = (await ethers.getContractAt(
//       PuzzlePieceAbi,
//       puzzlePieceTokenAddress
//     )) as unknown as PuzzlePiece;

//     const {
//       existedItemCollections,
//       newItemNames,
//       newItemSymbols,
//       maxSupplys,
//       pieceCountOfZones,
//     } = seasonData1;

//     const totalPieceCount = pieceCountOfZones.reduce(function (a, b) {
//       return a + b;
//     }); // 115

//     const receipt = await (
//       await playDuzzleInstance.startSeason(
//         existedItemCollections,
//         newItemNames,
//         newItemSymbols,
//         maxSupplys,
//         totalPieceCount
//       )
//     ).wait();

//     season1MaterialItemTokens = (
//       receipt?.logs.find(
//         (e) => e.topics[0] === EventTopic.StartSeason
//       ) as EventLog
//     ).args[0];

//     let _materialItemInstances: MaterialItem[] = [];
//     for (let i: number = 0; i < season1MaterialItemTokens.length; i++) {
//       _materialItemInstances.push(
//         (await ethers.getContractAt(
//           MaterialAbi,
//           season1MaterialItemTokens[i]
//         )) as unknown as MaterialItem
//       );
//     }
//     materialItemInstances = _materialItemInstances;

//     // 20 개의 구역 데이터 세팅(zone별 퍼즐 조각 수, zone별 필요한 재료)
//     const requiredItemsForMinting: string[][] = [
//       [season1MaterialItemTokens[0], season1MaterialItemTokens[1]], // zone0 필요한 재료: 재료0, 재료1
//       [season1MaterialItemTokens[0]], // zone1 필요한 재료: 재료0
//       [season1MaterialItemTokens[1]], // zone2 필요한 재료: 재료1
//       [season1MaterialItemTokens[1]], // zone3 필요한 재료: 재료1
//       [season1MaterialItemTokens[0], season1MaterialItemTokens[1]], // zone4 필요한 재료: 재료0, 재료1
//       [season1MaterialItemTokens[0], season1MaterialItemTokens[1]], // zone5 필요한 재료: 재료0, 재료1
//       [season1MaterialItemTokens[0]], // zone6 필요한 재료: 재료0
//       [season1MaterialItemTokens[0]], // zone7 필요한 재료: 재료0
//       [season1MaterialItemTokens[0]], // zone8 필요한 재료: 재료0
//       [season1MaterialItemTokens[0]], // zone9 필요한 재료: 재료0
//       [season1MaterialItemTokens[0]], // zone10 필요한 재료: 재료0
//       [season1MaterialItemTokens[0]], // zone11 필요한 재료: 재료0
//       [season1MaterialItemTokens[0]], // zone12 필요한 재료: 재료0
//       [season1MaterialItemTokens[0]], // zone13 필요한 재료: 재료0
//       [season1MaterialItemTokens[0]], // zone14 필요한 재료: 재료0
//       [season1MaterialItemTokens[0]], // zone15 필요한 재료: 재료0
//       [season1MaterialItemTokens[0]], // zone16 필요한 재료: 재료0
//       [season1MaterialItemTokens[0]], // zone17 필요한 재료: 재료0
//       [season1MaterialItemTokens[0]], // zone18 필요한 재료: 재료0
//       [season1MaterialItemTokens[0]], // zone19 필요한 재료: 재료0
//     ];
//     season1_requiredItemsForMinting = requiredItemsForMinting;

//     const requiredItemAmount: number[][] = [
//       [1, 1], // zone0: 재료x 1개, 재료y 1개씩 필요
//       [2], // zone1: 재료x 2개
//       [2], // zone2: 재료x 2개
//       [1], // zone3: 재료x 1개
//       [3, 4], // zone4: 재료x 3개 재료y 4개
//       [2, 2], // zone5: 재료x 3개 재료y 4개
//       [1], // zone6: 재료x 1개
//       [1], // zone7: 재료x 1개
//       [1], // zone8: 재료x 1개
//       [1], // zone9: 재료x 1개
//       [1], // zone10: 재료x 1개
//       [1], // zone11: 재료x 1개
//       [1], // zone12: 재료x 1개
//       [1], // zone13: 재료x 1개
//       [1], // zone14: 재료x 1개
//       [1], // zone15: 재료x 1개
//       [1], // zone16: 재료x 1개
//       [1], // zone17: 재료x 1개
//       [1], // zone18: 재료x 1개
//       [1], // zone19: 재료x 1개
//     ];
//     season1_requiredItemAmount = requiredItemAmount;

//     const setZoneDatas = new Array(20)
//       .fill(null)
//       .map((_, i) =>
//         playDuzzleInstance.setZoneData(
//           i,
//           pieceCountOfZones[i],
//           requiredItemsForMinting[i],
//           requiredItemAmount[i]
//         )
//       );
//     await Promise.allSettled(setZoneDatas);
//   });

//   it("Starting a Second Season with new item materials", async function () {
//     const {
//       existedItemCollections, // hammer
//       newItemNames, // red brick, glass
//       newItemSymbols,
//       maxSupplys,
//       pieceCountOfZones,
//     } = getSeasonData2([season1MaterialItemTokens[1]], [30]);

//     const totalPieceCount = pieceCountOfZones.reduce(function (a, b) {
//       return a + b;
//     }); // 115
//     const receipt = await (
//       await playDuzzleInstance.startSeason(
//         existedItemCollections,
//         newItemNames,
//         newItemSymbols,
//         maxSupplys,
//         totalPieceCount
//       )
//     ).wait();

//     season2MaterialItemTokens = (
//       receipt?.logs.find(
//         (e) => e.topics[0] === EventTopic.StartSeason
//       ) as EventLog
//     ).args[0];

//     expect(season2MaterialItemTokens.length).to.equal(maxSupplys.length);
//     expect(
//       season2MaterialItemTokens.slice(0, existedItemCollections.length)
//     ).to.eql(existedItemCollections); // 배열 비교, deep-eql
//     expect(
//       season2MaterialItemTokens.slice(existedItemCollections.length).length
//     ).to.equal(newItemNames.length);

//     // 20 개의 구역 데이터 세팅(zone별 퍼즐 조각 수, zone별 필요한 재료)
//     const requiredItemsForMinting: string[][] = [
//       [season2MaterialItemTokens[0], season2MaterialItemTokens[1]], // zone0 필요한 재료: 재료0, 재료1
//       [season2MaterialItemTokens[2]], // zone1 필요한 재료: 재료2
//       [season2MaterialItemTokens[1]], // zone2 필요한 재료: 재료1
//       [season2MaterialItemTokens[1]], // zone3 필요한 재료: 재료1
//       [season2MaterialItemTokens[0], season2MaterialItemTokens[1]], // zone4 필요한 재료: 재료0, 재료1
//       [season2MaterialItemTokens[0], season2MaterialItemTokens[2]], // zone5 필요한 재료: 재료0, 재료2
//       [season2MaterialItemTokens[0]], // zone6 필요한 재료: 재료0
//       [season2MaterialItemTokens[0]], // zone7 필요한 재료: 재료0
//       [season2MaterialItemTokens[1]], // zone8 필요한 재료: 재료1
//       [season2MaterialItemTokens[1]], // zone9 필요한 재료: 재료1
//       [season2MaterialItemTokens[0]], // zone10 필요한 재료: 재료0
//       [season2MaterialItemTokens[0]], // zone11 필요한 재료: 재료0
//       [season2MaterialItemTokens[0]], // zone12 필요한 재료: 재료0
//       [season2MaterialItemTokens[0]], // zone13 필요한 재료: 재료0
//       [season2MaterialItemTokens[1]], // zone14 필요한 재료: 재료1
//       [season2MaterialItemTokens[0]], // zone15 필요한 재료: 재료0
//       [season2MaterialItemTokens[0]], // zone16 필요한 재료: 재료0
//       [season2MaterialItemTokens[2]], // zone17 필요한 재료: 재료2
//       [season2MaterialItemTokens[0]], // zone18 필요한 재료: 재료0
//       [season2MaterialItemTokens[0]], // zone19 필요한 재료: 재료0
//     ];
//     const requiredItemAmount: number[][] = [
//       [1, 1], // zone0: 재료x 1개, 재료y 1개씩 필요
//       [2], // zone1: 재료x 2개
//       [2], // zone2: 재료x 2개
//       [1], // zone3: 재료x 1개
//       [3, 4], // zone4: 재료x 3개 재료y 4개
//       [2, 2], // zone5: 재료x 3개 재료y 4개
//       [1], // zone6: 재료x 1개
//       [1], // zone7: 재료x 1개
//       [1], // zone8: 재료x 1개
//       [1], // zone9: 재료x 1개
//       [1], // zone10: 재료x 1개
//       [1], // zone11: 재료x 1개
//       [1], // zone12: 재료x 1개
//       [1], // zone13: 재료x 1개
//       [1], // zone14: 재료x 1개
//       [1], // zone15: 재료x 1개
//       [1], // zone16: 재료x 1개
//       [1], // zone17: 재료x 1개
//       [1], // zone18: 재료x 1개
//       [1], // zone19: 재료x 1개
//     ];
//     expect(requiredItemsForMinting.length).to.equal(requiredItemAmount.length);

//     const setZoneDatas = new Array(20)
//       .fill(null)
//       .map((_, i) =>
//         playDuzzleInstance.setZoneData(
//           i,
//           pieceCountOfZones[i],
//           requiredItemsForMinting[i],
//           requiredItemAmount[i]
//         )
//       );
//     const result = await Promise.allSettled(setZoneDatas);
//     expect(result.every((e) => e.status === "fulfilled")).to.be.true;

//     for (let i: number = 0; i < 20; i++) {
//       let contractResponse: ContractTransactionResponse =
//         await playDuzzleInstance.setZoneData(
//           i,
//           pieceCountOfZones[i],
//           requiredItemsForMinting[i],
//           requiredItemAmount[i]
//         );
//       const args = (
//         (await contractResponse.wait())?.logs.find(
//           (e) => e.topics[0] === EventTopic.SetZoneData
//         ) as EventLog
//       ).args;
//       expect(i).to.equal(args.getValue("zoneId"));
//       expect(pieceCountOfZones[i]).to.equal(args.getValue("pieceCountOfZones"));
//       expect(requiredItemsForMinting[i]).to.eql(
//         args.getValue("requiredItemsForMinting")
//       );
//       expect(requiredItemAmount[i].map((e) => BigInt(e))).to.eql(
//         args.getValue("requiredItemAmount")
//       );
//     }
//   });

//   describe("Get A Random Item NFT", function () {
//     it("To get a random item NFT, need 2 DAL tokens.", async function () {
//       await expect(
//         playDuzzleInstance.connect(addr1).getRandomItem()
//       ).to.be.revertedWith("not enough balacnce");
//     });

//     it("Emits a Mint event for newly minted random item nft", async function () {
//       await dalInstance.mint(addr1.address, 2);
//       const txResponse = await playDuzzleInstance
//         .connect(addr1)
//         .getRandomItem();
//       const txReceipt = await txResponse.wait();
//       expect(txReceipt?.logs.some((e) => e.topics[0] === EventTopic.Mint)).to.be
//         .true;
//     });

//     it("get random item nft by 2 DAL", async function () {
//       await dalInstance.mint(addr1.address, 2);
//       const dalBalance = await dalInstance.balanceOf(addr1.address);

//       // 재료 아이템 발행
//       const txResponse = await playDuzzleInstance
//         .connect(addr1)
//         .getRandomItem();
//       const txReceipt = await txResponse.wait();
//       const mintEvent = txReceipt?.logs.find(
//         (e) => e.topics[0] === EventTopic.Mint
//       );

//       // 2DAL 차감 확인
//       const finalDalBalance = await dalInstance.balanceOf(addr1.address);
//       expect(dalBalance - BigInt(2)).to.equal(finalDalBalance);

//       // 발행된 NFT의 토큰 주소가 (재료 , 설계도면) 중에 하나인지 확인
//       const tokenAddress = mintEvent?.address;
//       expect([...season1MaterialItemTokens, blueprintItemTokenAddress]).include(
//         tokenAddress // 컨트랙트 주소
//       );

//       // addr1에게 발행되었는지
//       const iface = new ethers.Interface(MaterialAbi);
//       const decodedLog = iface.parseLog(mintEvent!);
//       const [to, tokenId] = decodedLog?.args!;
//       expect(to).to.equal(addr1.address);

//       // 발행된 아이템 종류에 따라 알맞은 토큰 컨트랙트의 balance 조회
//       if (tokenAddress === blueprintItemTokenAddress) {
//         const balance = await bluePrintItemInstance.balanceOf(addr1.address);
//         expect(balance).to.equal(1);
//         expect(await bluePrintItemInstance.ownerOf(tokenId)).to.equal(
//           addr1.address
//         );
//       } else {
//         for (let i: number = 0; i < materialItemInstances.length; i++) {
//           if (tokenAddress === season1MaterialItemTokens[i]) {
//             const balance = await materialItemInstances[i].balanceOf(
//               addr1.address
//             );
//             expect(balance).to.equal(1);
//             expect(await materialItemInstances[i].ownerOf(tokenId)).to.equal(
//               addr1.address
//             );
//           }
//         }
//       }
//     });

//     // 각 재료 아이템이 total supply 만큼만 발행되는지. // TODO: 흠.. item 개수 최소로 해서 해보쟈. 그 아이템 하나라고 하고!!
//     it("if supply amount exceed total max supply, cannot mint item nft", async function () {
//       // 설계도면 수(=전체퍼즐조각수) + 필요한 모든 재료 수
//       let totalItemMaxSupplys: number = seasonData1.pieceCountOfZones.reduce(
//         (acc, cur, idx) => {
//           const piecesOfZone =
//             season1_requiredItemAmount[idx].reduce((acc, cur) => acc + cur) *
//             cur;
//           return acc + piecesOfZone;
//         }
//       );
//       const blueprintsCount = seasonData1.pieceCountOfZones.reduce(
//         (acc, cur) => acc + cur,
//         0
//       ); // 115 (설계도면수)
//       totalItemMaxSupplys += blueprintsCount;

//       await dalInstance.mint(addr1, (totalItemMaxSupplys + 1) * 2);
//       // for (let i: number = 0; i < totalItemMaxSupplys; i++) {
//       //   await playDuzzleInstance.connect(addr1).getRandomItem();
//       // }

//       // console.log(totalItemMaxSupplys);
//       for (let i: number = 0; i < 10; i++) {
//         await playDuzzleInstance.connect(addr1).getRandomItem();
//       }

//       // expect(
//       //   await playDuzzleInstance.connect(addr1).getRandomItem()
//       // ).to.be.revertedWith("item nft sold out");
//     });
//   });

//   describe("Get A Puzzle Piece NFT", function () {
//     it("get puzzle piece nft burning required items", async function () {
//       // await dalInstance.mint(addr1, 115 * 2);
//       // console.log(season1MaterialItemTokens);

//       await dalInstance.mint(addr1, 115 * 2);
//       let mintedItems: {
//         tokenAddress: string;
//         tokenIds: string[];
//         name?: string;
//       }[] = [];
//       for (let i: number = 0; i < 115; i++) {
//         let txResponse = await playDuzzleInstance
//           .connect(addr1)
//           .getRandomItem();
//         let mintEvent = (await txResponse.wait())?.logs.find(
//           (e) => e.topics[0] === EventTopic.Mint
//         );
//         if (mintEvent?.address! === blueprintItemTokenAddress) {
//           const iface = new ethers.Interface(BlueprintAbi);
//           const decodedLog = iface.parseLog(mintEvent!);
//           const [to, tokenId] = decodedLog?.args!;

//           let e = mintedItems.find(
//             (e) => e.tokenAddress === mintEvent?.address
//           );
//           if (e) {
//             e.tokenIds.push(tokenId);
//           } else {
//             mintedItems.push({
//               tokenAddress: blueprintItemTokenAddress,
//               tokenIds: [tokenId],
//               name: "blueprint",
//             });
//           }
//         } else {
//           let iface = new ethers.Interface(MaterialAbi);
//           let decodedLog = iface.parseLog(mintEvent!);
//           let [to, tokenId] = decodedLog?.args!;
//           let e = mintedItems.find(
//             (e) => e.tokenAddress === mintEvent?.address
//           );
//           if (e) {
//             e.tokenIds.push(tokenId);
//           } else {
//             mintedItems.push({
//               tokenAddress: mintEvent?.address!,
//               tokenIds: [tokenId],
//             });
//           }
//         }
//       }
//       // console.log("얻은 재료들", mintedItems);

//       // console.log("유저 보유 아이템 - before");
//       for (let i: number = 0; i < materialItemInstances.length; i++) {
//         let balance = await materialItemInstances[i].balanceOf(addr1.address);
//         // console.log(await materialItemInstances[i].getAddress());
//         // console.log(`${season1MaterialItemTokens[i]}: ${balance}개`);
//       }
//       // console.log(
//       //   `blueprint nfts: ${await bluePrintItemInstance.balanceOf(
//       //     addr1.address
//       //   )}개
//       //   `
//       // );

//       // pieceCountOfZones: [
//       //   4, 5, 3, 7, 2, 10, 3, 7, 7, 9, 11, 3, 4, 4, 6, 12, 3, 8, 5, 2,
//       // ], // zone 0: 0~3 (4 pieces), zone1: 4~8(5 pieces) ... zone 19:
//       // await playDuzzleInstance.connect(addr1).unlockPuzzlePiece(3); // zone 0 -> 재료[0] 1개, 재료[1] 1개
//       // console.log("유저 보유 아이템 - after");
//       for (let i: number = 0; i < materialItemInstances.length; i++) {
//         let balance = await materialItemInstances[i].balanceOf(addr1.address);
//         // console.log(await materialItemInstances[i].getAddress());

//         // console.log(`${season1MaterialItemTokens[i]}: ${balance}개`);
//       }
//       // console.log(
//       //   `blueprint nfts: ${await bluePrintItemInstance.balanceOf(
//       //     addr1.address
//       //   )}`
//       // );
//       await playDuzzleInstance.connect(addr1).unlockPuzzlePiece(4); // zone 1 -> 재료[0] 2개
//       // await playDuzzleInstance.connect(addr1).unlockPuzzlePiece(11); // zone 2 -> 재료[1] 2개
//       // await playDuzzleInstance.connect(addr1).unlockPuzzlePiece(12); // zone 3 -> 재료[1] 1개
//       // await playDuzzleInstance.connect(addr1).unlockPuzzlePiece(21); // zone 5(21~30) -> 재료[0] 2개, 재료[1] 2개
//       // // await playDuzzleInstance.connect(addr1).unlockPuzzlePiece(48); // zone 9(48~56) -> 재료[0] 1개

//       // expect(await puzzlePieceInstance.ownerOf(4)).to.equal(addr1.address);
//       // expect(await puzzlePieceInstance.ownerOf(11)).to.equal(addr1.address);
//       // expect(await puzzlePieceInstance.ownerOf(12)).to.equal(addr1.address);
//       // expect(await puzzlePieceInstance.ownerOf(21)).to.equal(addr1.address);
//       // expect(await puzzlePieceInstance.ownerOf(48)).to.equal(addr1.address);
//     });

//     it("Unable to mint the puzzle piece nft without specific materials and blueprint nft", async function () {
//       // 랜덤 아이템 get 해서 딱 그맞는거에. 가능한 zone 뽑아서 그 zone mint . -> 잘되는거 확인
//       // 다른 zone mint => 안되는거 확인ㄴ. TOOD:
//     });
//   });

//   describe("Get Season Data", function () {
//     // it("get this season data", async function () {
//     //   const seaonsData = await playDuzzleInstance.getThisSeasonData();
//     //   const [
//     //     totalPieceCount,
//     //     mintedCount,
//     //     materialItemTokenAddresses,
//     //     itemMaxSupplys,
//     //     itemMinted,
//     //     pieceCountOfZones,
//     //     requiredItemsForMinting,
//     //     requiredItemAmount,
//     //     startedAt,
//     //     mintedBlueprint,
//     //   ] = seaonsData;

//     //   console.log(seaonsData);
//     // });

//     // it("get all season ids", async function () {
//     //   console.log(await playDuzzleInstance.getAllSeasonIds());
//     // });

//     // it("get a past season data by id", async function () {
//     //   const seaonsData = await playDuzzleInstance.getSeasonDataById(0);
//     //   const [
//     //     totalPieceCount,
//     //     mintedCount,
//     //     materialItemTokenAddresses,
//     //     itemMaxSupplys,
//     //     itemMinted,
//     //     pieceCountOfZones,
//     //     requiredItemsForMinting,
//     //     requiredItemAmount,
//     //     startedAt,
//     //     mintedBlueprint,
//     //   ] = seaonsData;

//     //   console.log(seaonsData);
//     // });

//     // it("if season id does not existed, revert with 'season 404'", async function () {
//     //   await expect(playDuzzleInstance.getSeasonDataById(1)).to.be.revertedWith(
//     //     "season 404"
//     //   );
//     // });
//   });
// });
