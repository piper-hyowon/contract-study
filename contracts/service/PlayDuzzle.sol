// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../library/DuzzleLibrary.sol";
import "../erc-721/MaterialItem.sol";

// using DuzzleLibrary for DuzzleLibrary.Season;
// using Utils for Utils.Util;

contract PlayDuzzle is AccessControl {
    uint8 public thisSeasonId; // 현재 시즌 id
    uint8[] public seasonIds; // 지금까지의 시즌 id array
    mapping(uint8 => DuzzleLibrary.Season) private seasons; // 시즌별 정보

    event StartSeason(address[] itemAddresses);
    event SetZoneData(
        uint8 zoneId,
        uint8 pieceCountOfZones,
        address[] requiredItemsForMinting,
        uint8[] requiredItemAmount
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        thisSeasonId = 0;
    }

    function startSeason(
        address[] calldata existedItemCollections, // 기존 재료아이템 (토큰 주소)
        string[] calldata newItemNames, // 새로운 재료 아이템 이름
        string[] calldata newItemSymbols, // 새로운 재료 아이템 심볼
        uint16[] calldata maxSupplys, //  재료 아이템 발행 제한 개수
        uint24 _totalPieceCount // 총 퍼즐피스 수
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        // 두 번째 시즌부터 +1
        if (seasonIds.length > 0) {
            ++thisSeasonId;
        }
        seasonIds.push(thisSeasonId);

        seasons[thisSeasonId].totalPieceCount = _totalPieceCount;
        seasons[thisSeasonId].mintedCount = 0;
        seasons[thisSeasonId].startedAt = block.timestamp;

        uint256 materialItemCount = existedItemCollections.length +
            newItemNames.length;
        address[] memory materialItems = new address[](materialItemCount);
        MaterialItem[] memory materialItemTokens = new MaterialItem[](
            materialItemCount
        );
        for (uint256 i = 0; i < materialItemCount; i++) {
            if (
                existedItemCollections.length > 0 &&
                i < existedItemCollections.length
            ) {
                MaterialItem instance = MaterialItem(existedItemCollections[i]);
                materialItems[i] = address(instance); // address
                materialItemTokens[i] = instance; // contract instance
            } else {
                uint256 j = i - existedItemCollections.length;
                MaterialItem instance = new MaterialItem(
                    newItemNames[j],
                    newItemSymbols[j],
                    "metadataUri",
                    msg.sender
                ); // TODO: metadataUri는 setBaseUri()로 바꾸면 됨
                materialItems[i] = address(instance);
                materialItemTokens[i] = instance;
            }
            seasons[thisSeasonId].itemMaxSupplys[materialItems[i]] = maxSupplys[
                i
            ];

            seasons[thisSeasonId].itemMinted[materialItems[i]] = 0;
        }

        seasons[thisSeasonId].materialItems = materialItems;
        seasons[thisSeasonId].materialItemTokens = materialItemTokens;
        emit StartSeason(materialItems);
    }

    // zone 개수만큼 호출 필요(20번)
    /**
     *
     * @param zoneId 0 ~ 19
     * @param pieceCount zone 별 퍼즐 피스 수
     * @param requiredItemsForMinting  잠금해제에 필요한 아이템 토큰 주소
     * @param requiredItemAmount  잠금해제에 필요한 아이템 수
     * requiredItemsForMinting.length == requiredItemAmount.length
     */
    function setZoneData(
        uint8 zoneId,
        uint8 pieceCount,
        address[] calldata requiredItemsForMinting,
        uint8[] calldata requiredItemAmount
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        seasons[thisSeasonId].pieceCountOfZones[zoneId] = pieceCount;
        seasons[thisSeasonId].requiredItemsForMinting[
                zoneId
            ] = requiredItemsForMinting;
        seasons[thisSeasonId].requiredItemAmount[zoneId] = requiredItemAmount;

        emit SetZoneData(
            zoneId,
            seasons[thisSeasonId].pieceCountOfZones[zoneId],
            seasons[thisSeasonId].requiredItemsForMinting[zoneId],
            seasons[thisSeasonId].requiredItemAmount[zoneId]
        );
    }

    // TODO: 시즌 데이터 조회(getThisSeasonData, getAllSeasonsData, getSeasonDataById)
    function getThisSeasonData()
        public
        view
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (uint24 seasonId)
    {
        return (thisSeasonId);
    }

    function getAllSeasonsData()
        public
        view
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (uint8[] memory _seasonIds)
    {
        return (seasonIds);
    }

    function getSeasonDataById(
        uint8 seasonId
    ) public view onlyRole(DEFAULT_ADMIN_ROLE) {}
}
