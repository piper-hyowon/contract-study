pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./item/Item.sol";
import "./library/DuzzleLibrary.sol";
import "./library/Utils.sol";

contract PlayDuzzle is AccessControl {
    uint8[] public seasonIds;
    uint8 public seasonLength;
    using DuzzleLibrary for DuzzleLibrary.Season;
    mapping(uint8 => DuzzleLibrary.Season) private seasons;

    using Utils for Utils.Util;
    Utils.Util private utils;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function startSeason(
        bytes32 name, // season name
        string[] calldata items, // 시즌에서 사용하는 아이템들 각 name
        string[] calldata itemSymbols, // 시즌에서 사용하는 아이템들 각 symbol
        int256[] calldata itemMaxSupplys, // 시즌에서 사용하는 아이템들 각 최대 발행수
        int256 totalPieces, // 해당 시즌 퍼즐 조각 총 개수
        string calldata areasCsvString // 구역 데이터 csv string
    )
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (string[] memory itemAddresses)
    {
        // paramter validating
        require(
            items.length == itemSymbols.length &&
                itemSymbols.length == itemMaxSupplys.length,
            "invalid parameter"
        );


        for (uint8 i = 0; i < seasonLength; i++) {
            require(name != seasons[i].name, "duplicate season name");
        }

        // season id
        uint8 id = seasonIds[seasonIds.length - 1] + 1;
        // Season memory thisSeason = Season(id, name, areas, now);
        // seasons[id].name = name;

        address[] memory result;
        // for (uint8 i = 0; i < items.length; i++) {
        //     bool isExistItem;
        //     for (uint8 j = 0; j < itemsBySeason[id].length; j++) {
        //         if (itemsBySeason[id]. == items[i]) {
        //             isExistItem = true;
        //         }
        //     }
        //     // 새로운 아이템일 경우에만 컨트랙트 추가(기존 아이템은 동일 컨트랙트 사용) - 시즌별 max supply 로만 관리
        //     if (!isExistItem) {
        //         Item itemInstance = new Item(
        //             items[i],
        //             itemSymbols[i],
        //             id,
        //             itemMaxSupplys[i]
        //         );

        //         result.push(itemInstance.address);
        //     }
        // }
        // return result;
        // return;
        //
    }

    function pauseSeason() public {}

    function restartSeason() public {}

    function endSeason() public {}
}
