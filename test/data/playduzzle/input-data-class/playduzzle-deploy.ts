import { Dal } from "../../../../typechain-types/contracts/erc-20/Dal";
import { BlueprintItem } from "../../../../typechain-types/contracts/erc-721/BlueprintItem";
import { PuzzlePiece } from "../../../../typechain-types/contracts/erc-721/PuzzlePiece";
import { PlayDuzzle } from "../../../../typechain-types/contracts/service/PlayDuzzle";

export type PlayDuzzleDeployParameters = [number, string, string];

/**
 * PlayDuzzle 컨트랙트 배포
 * 배포후 생성된 PlayDuzzle instance, Dal instance, BlueprintItem, PuzzlePiece instance 관리
 */
export class PlayDuzzleContractData {
  // PlayDuzzle contract 생성자 파라미터
  public deployParameters!: PlayDuzzleDeployParameters;
  public playDuzzleInstance!: PlayDuzzle;
  public dalInstance!: Dal;
  public bluepirntInstance: BlueprintItem | undefined;
  public puzzlePieceInstance: PuzzlePiece | undefined;

  constructor(
    maxTotalSupplyOfDal: number,
    blueprintBaseUri: string,
    puzzlePieceBaseUri: string
  ) {
    this.deployParameters = [
      maxTotalSupplyOfDal,
      blueprintBaseUri,
      puzzlePieceBaseUri,
    ];
  }

  setInstance(
    playDuzzleInstance: PlayDuzzle,
    dalInstance: Dal,
    bluepirntInstance?: BlueprintItem,
    puzzlePieceInstance?: PuzzlePiece
  ) {
    this.playDuzzleInstance = playDuzzleInstance;
    this.dalInstance = dalInstance;
    this.bluepirntInstance = bluepirntInstance;
    this.puzzlePieceInstance = puzzlePieceInstance;
  }
}
