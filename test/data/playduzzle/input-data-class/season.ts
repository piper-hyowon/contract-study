import { MaterialItem } from "../../../../typechain-types/contracts/erc-721/MaterialItem";
import { DefaultDuzzleData } from "./constants";

export type StartSeasonParameters = [
  string[],
  string[],
  string[],
  string[],
  number[],
  number
];

/** 몇 번째 zone /  zone의 조각 수 / 잠금해제 필요한 재료 컨트랙트 주소[] / 각 재료 개수[] */
export type SetZoneDataParameters = [number, number, string[], number[]];

export interface SeasonDataInit {
  existedItemCollections: string[];
  newItemNames: string[];
  newItemSymbols: string[];
  newItemBaseUris: string[];
  maxSupplys: number[];
  pieceCountOfZones: number[];
  requiredMaterialIndexesForMinting: number[][]; // [...기존 재료, 신규 재료] 에서의 인덱스
  requiredMaterialAmounts: number[][]; // requiredMaterialIndexesForMinting 의 개수
}

export class SeasonData {
  public initData: SeasonDataInit;
  public materialItemTokens: string[] = []; // addresses
  public materialItemInstances: MaterialItem[] = [];

  public startSeasonParameters: StartSeasonParameters;
  public requiredMaterialTokensForMinting: string[][] | undefined;
  public setZoneDataParametersArr: SetZoneDataParameters[] | undefined; // arr.length = zone 수만큼

  constructor(initData: SeasonDataInit) {
    const {
      existedItemCollections,
      newItemNames,
      newItemSymbols,
      newItemBaseUris,
      maxSupplys,
      pieceCountOfZones,
      requiredMaterialIndexesForMinting,
      requiredMaterialAmounts,
    } = initData;
    if (
      newItemNames.length !== newItemSymbols.length ||
      newItemSymbols.length !== newItemBaseUris.length ||
      newItemNames.length + existedItemCollections.length !==
        maxSupplys.length ||
      requiredMaterialIndexesForMinting.length !==
        DefaultDuzzleData.ZoneCount ||
      requiredMaterialAmounts.length !== DefaultDuzzleData.ZoneCount ||
      !requiredMaterialIndexesForMinting.every(
        (e, i) => e.length === requiredMaterialAmounts[i].length
      )
    ) {
      throw new Error("Invalid Season Data Input");
    }

    this.initData = initData;

    const totalPieceCount: number = pieceCountOfZones.reduce(function (a, b) {
      return a + b;
    });

    // PlayDuzzle contract startSeason() 메서드 파라미터
    this.startSeasonParameters = [
      existedItemCollections,
      newItemNames,
      newItemSymbols,
      newItemBaseUris,
      maxSupplys,
      totalPieceCount,
    ];
  }

  makeZoneDataParameters(materialItemTokenAddresses: string[]) {
    const { requiredMaterialIndexesForMinting, requiredMaterialAmounts } =
      this.initData;

    this.materialItemTokens = materialItemTokenAddresses;
    // console.log("make zone paraeters 로 넘어가는: ", materialItemTokenAddresses);
    this.requiredMaterialTokensForMinting =
      requiredMaterialIndexesForMinting.map((materialIndexes: number[]) =>
        materialIndexes.map((i) => this.materialItemTokens![i])
      );

    this.setZoneDataParametersArr = new Array(DefaultDuzzleData.ZoneCount)
      .fill(null)
      .map((_, zone) => [
        zone,
        this.initData.pieceCountOfZones[zone],
        this.requiredMaterialTokensForMinting![zone],
        requiredMaterialAmounts[zone],
      ]);
  }
}
