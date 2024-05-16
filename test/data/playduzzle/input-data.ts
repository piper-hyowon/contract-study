import { DefaultDuzzleData } from "./input-data-class/constants";
import { SeasonDataInit } from "./input-data-class/season";

export const InputData1: {
  deployParameters: [number, string, string];
  seasonData1: SeasonDataInit;
  seasonData2: SeasonDataInit;
} = {
  deployParameters: [
    DefaultDuzzleData.MaxTotalSupplyOfDalToken,
    DefaultDuzzleData.BlueprintBaseUri,
    DefaultDuzzleData.PuzzlePieceBaesUri,
  ],

  seasonData1: {
    existedItemCollections: [],
    newItemNames: ["sand", "hammer"],
    newItemSymbols: ["SND", "HMR"],
    newItemBaseUris: ["localhost:8000/v1/sand", "localhost:8000/v1/hammer"],
    maxSupplys: [65, 50],
    pieceCountOfZones: [
      4, 5, 3, 7, 2, 10, 3, 7, 7, 9, 11, 3, 4, 4, 6, 12, 3, 8, 5, 2,
    ],
    requiredMaterialIndexesForMinting: [
      [0, 1], // zone0 필요한 재료: 재료0, 재료1
      [0], // zone1 필요한 재료: 재료0
      [1], // zone2 필요한 재료: 재료1
      [1], // zone3 필요한 재료: 재료1
      [0, 1], // zone4 필요한 재료: 재료0, 재료1
      [0, 1], // zone5 필요한 재료: 재료0, 재료1
      [0], // zone6 필요한 재료: 재료0
      [0], // zone7 필요한 재료: 재료0
      [0], // zone8 필요한 재료: 재료0
      [0], // zone9 필요한 재료: 재료0
      [0], // zone10 필요한 재료: 재료0
      [0], // zone11 필요한 재료: 재료0
      [0], // zone12 필요한 재료: 재료0
      [0], // zone13 필요한 재료: 재료0
      [0], // zone14 필요한 재료: 재료0
      [0], // zone15 필요한 재료: 재료0
      [0], // zone16 필요한 재료: 재료0
      [0], // zone17 필요한 재료: 재료0
      [0], // zone18 필요한 재료: 재료0
      [0], // zone19 필요한 재료: 재료0
    ],
    requiredMaterialAmounts: [
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
    ],
  },

  // 시즌1 에서 생성된 hammer 사용할 예정
  // test code 에서 동적으로 추가
  seasonData2: {
    existedItemCollections: ["season1hammer_tokenaddress"],
    newItemNames: ["red brick", "glass"],
    newItemSymbols: ["RBRK", "GLS"],
    newItemBaseUris: ["localhost:8000/v1/redbrick", "localhost:8000/v1/glass"],
    maxSupplys: [30, 40, 20],
    pieceCountOfZones: [
      1, 2, 1, 2, 2, 6, 3, 10, 7, 9, 11, 3, 4, 4, 7, 12, 3, 10, 9, 3,
    ],
    requiredMaterialIndexesForMinting: [
      [0, 1, 2], // zone0 필요한 재료: 재료0, 재료1, 재료2
      [0, 2], // zone1 필요한 재료: 재료0, 재료2
      [1], // zone2 필요한 재료: 재료1
      [1], // zone3 필요한 재료: 재료1
      [0, 1], // zone4 필요한 재료: 재료0, 재료1
      [0, 1], // zone5 필요한 재료: 재료0, 재료1
      [0], // zone6 필요한 재료: 재료0
      [0, 1, 2], // zone7 필요한 재료: 재료0, 재료1 재료2
      [0], // zone8 필요한 재료: 재료0
      [0], // zone9 필요한 재료: 재료0
      [0], // zone10 필요한 재료: 재료0
      [0], // zone11 필요한 재료: 재료0
      [0, 2], // zone12 필요한 재료: 재료0, 재료2
      [0], // zone13 필요한 재료: 재료0
      [0, 1], // zone14 필요한 재료: 재료0, 재료1
      [0], // zone15 필요한 재료: 재료0
      [0], // zone16 필요한 재료: 재료0
      [0], // zone17 필요한 재료: 재료0
      [0], // zone18 필요한 재료: 재료0
      [0], // zone19 필요한 재료: 재료0
    ],
    requiredMaterialAmounts: [
      [1, 1, 2], // zone0: 재료x 1개, 재료y 1개, 재료z 2개 필요
      [2, 1], // zone1: 재료x 2개 재료y 개
      [2], // zone2: 재료x 2개
      [1], // zone3: 재료x 1개
      [3, 4], // zone4: 재료x 3개 재료y 4개
      [2, 2], // zone5: 재료x 3개 재료y 4개
      [1], // zone6: 재료x 1개
      [1, 1, 1], // zone7: 재료x 1개
      [1], // zone8: 재료x 1개
      [1], // zone9: 재료x 1개
      [1], // zone10: 재료x 1개
      [1], // zone11: 재료x 1개
      [1, 1], // zone12: 재료x 1개 재료y 2개
      [1], // zone13: 재료x 1개
      [1, 3], // zone14: 재료x 1개 재료y 3개
      [1], // zone15: 재료x 1개
      [1], // zone16: 재료x 1개
      [1], // zone17: 재료x 1개
      [1], // zone18: 재료x 1개
      [1], // zone19: 재료x 1개
    ],
  },
};
