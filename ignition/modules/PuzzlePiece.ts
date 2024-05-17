import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
require("dotenv").config({ path: "../.env" });

const PUZZLE_PIECE_BASE_URI = `${process.env.DEV_BASE_URI}/pp/`;

// TODO:
const PuzzlePieceModule = buildModule("PuzzlePieceModule", (m) => {
  const puzzlePiece = m.contract("PuzzlePiece", [
    PUZZLE_PIECE_BASE_URI,
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  ]);

  return { puzzlePiece };
});

export default PuzzlePieceModule;
