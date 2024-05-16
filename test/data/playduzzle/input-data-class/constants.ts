export class DefaultDuzzleData {
  static get ZoneCount(): number {
    return 20;
  }

  static get MaxTotalSupplyOfDalToken(): number {
    return 500_000;
  }

  static get BlueprintBaseUri(): string {
    return "localhost:8000/v1/blueprint";
  }

  static get PuzzlePieceBaesUri(): string {
    return "localhost:8000/v1/puzzlepiece";
  }
}
