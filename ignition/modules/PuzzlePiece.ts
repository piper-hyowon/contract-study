import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// TODO:
const PuzzlePieceModule = buildModule("PuzzlePieceModule", (m) => {
  const puzzlePiece = m.contract("PuzzlePiece", [
    "Duzzle Puzzle Piece",
    "DPP",
    "haha/hoho",
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  ]);

  return { puzzlePiece };
});

export default PuzzlePieceModule;
