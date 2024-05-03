pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../item/Item.sol";
import "./Utils.sol";

library DuzzleLibrary {
    struct ItemType {
        bytes32 name;
        Item itemContract;
    }

    struct RequiredItem {
        ItemType[] itemType;
        uint8 amount;
    }

    struct Area {
        uint32 id;
        RequiredItem[] requiredItems; // 구역별 잠금해제시 필요한 아이템
        string nameKr; // 구역명
        string nameEn; // 구역명
    }

    struct Season {
        int32 id;
        bytes32 name;
        Area[] areas;
        uint startedAt;
        ItemType[] items;
    }
}
