// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../erc-721/MaterialItem.sol";
import "./Utils.sol";

//   - 설계도면 array[](100) // 민트 여부 확인용

library DuzzleLibrary {
    struct Season {
        uint24 totalPieceCount; // 총 퍼즐 조각 수
        uint24 mintedCount; // 민트된 퍼즐 조각 수
        address[] materialItems; // 재료 아이템 목록 (address)
        MaterialItem[] materialItemTokens; // 재료 아이템 목록 (contract instance)
        mapping(address => uint16) itemMaxSupplys; // 재료 토큰의 최대 발행 개수 // 그 이상은 발행 불가
        mapping(address => uint16) itemMinted; // 재료 토큰의 현재 발행 개수 // 발행 할때마다 하나씩 증가
        uint8[20] pieceCountOfZones; // zone 별 퍼즐 조각 수
        mapping(uint8 => address[]) requiredItemsForMinting; // zone별 잠금해제에 필요한 재료 아이템 목록(MaterialItem 타입으로?)
        mapping(uint8 => uint8[]) requiredItemAmount; // 잠금해제에 필요한 아이템 수
        uint startedAt;
        bool[] mintedBlueprint; // 설계도면 민트 여부(length == totalPieceCount)
    }
}
