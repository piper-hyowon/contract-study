// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "../library/DuzzleLibrary.sol";
import "../library/Utils.sol";

import "../erc-721/MaterialItem.sol";
import "../erc-20/Dal.sol";
import "../erc-721/BlueprintItem.sol";
import "../erc-721/PuzzlePiece.sol";

using Utils for uint256;

contract PlayDuzzle is AccessControl {
    uint8 public thisSeasonId; // 현재 시즌 id
    uint8[] public seasonIds; // 지금까지의 시즌 id array
    mapping(uint8 => DuzzleLibrary.Season) public seasons; // 시즌별 정보
    Dal public dalToken;
    BlueprintItem public blueprintItemToken;
    PuzzlePiece puzzlePieceToken;
    uint public offset;

    event StartSeason(address[] itemAddresses);
    event SetZoneData(
        uint8 zoneId,
        uint8 pieceCountOfZones,
        address[] requiredItemsForMinting,
        uint8[] requiredItemAmount
    );
    event UnlockPuzzlePiece(uint8 zoneId, uint tokenId, address to);

    constructor(address dal, address blueprint, address puzzlepiece) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        thisSeasonId = 0;

        dalToken = Dal(dal);
        blueprintItemToken = BlueprintItem(blueprint);
        puzzlePieceToken = PuzzlePiece(puzzlepiece);

        offset = 0; // start
    }

    function startSeason(
        address[] calldata existedItemCollections, // 기존 재료아이템 (토큰 주소)
        string[] calldata newItemNames, // 새로운 재료 아이템 이름
        string[] calldata newItemSymbols, // 새로운 재료 아이템 심볼
        string[] calldata newItemBaseUris,
        uint16[] calldata maxSupplys, //  재료 아이템 발행 제한 개수
        uint24 _totalPieceCount // 총 퍼즐피스 수
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        offset = offset + seasons[thisSeasonId].totalPieceCount;

        // 두 번째 시즌부터 +1
        if (seasonIds.length > 0) {
            ++thisSeasonId;
        }
        seasonIds.push(thisSeasonId);

        seasons[thisSeasonId].totalPieceCount = _totalPieceCount;
        seasons[thisSeasonId].mintedCount = 0;
        seasons[thisSeasonId].mintedBlueprint = new bool[](_totalPieceCount); // default value: false

        seasons[thisSeasonId].startedAt = block.timestamp;

        uint256 materialItemCount = existedItemCollections.length +
            newItemNames.length;
        // address[] memory materialItems = new address[](materialItemCount);
        // MaterialItem[] memory materialItemTokens = new MaterialItem[](
        //     materialItemCount
        // );
        for (uint256 i = 0; i < materialItemCount; i++) {
            if (
                existedItemCollections.length > 0 &&
                i < existedItemCollections.length
            ) {
                MaterialItem instance = MaterialItem(existedItemCollections[i]);
                // materialItems[i] = address(instance); // address
                seasons[thisSeasonId].materialItemTokens[i] = instance; // contract instance
            } else {
                uint256 j = i - existedItemCollections.length;
                MaterialItem instance = new MaterialItem(
                    newItemNames[j],
                    newItemSymbols[j],
                    newItemBaseUris[i],
                    address(this)
                );
                // materialItems[i] = address(instance);
                seasons[thisSeasonId].materialItemTokens[i] = instance;
            }
            seasons[thisSeasonId].itemMaxSupplys[
                address(seasons[thisSeasonId].materialItemTokens[i])
            ] = maxSupplys[i];

            seasons[thisSeasonId].itemMinted[
                address(seasons[thisSeasonId].materialItemTokens[i])
            ] = 0;
        }

        // seasons[thisSeasonId].materialItemTokens = materialItemTokens;

        // emit StartSeason(materialItems);
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

    function getRandomItem() public {
        // 각 아이템별 total supply 다 되면.. 안된다.! // TODO: 밑에서 어떤 아이템줄건지 확정디ㅗㄴ다음에. 발행 제한 확인해보고..
        // total supply 는 playduzzle 이 가지고 이씀..
        // 컨트랙트에 있는 .. 아니 material item 에 enurable 왜 했드라

        // 2 DAL 차감
        require(dalToken.balanceOf(msg.sender) >= 2, "not enough balacnce");
        dalToken.burn(msg.sender, 2);

        // 랜덤 아이템 뽑기
        // max supply 고려해서 ..

        // 1. 설계도면 vs 재료
        uint256 materialItemCount = seasons[thisSeasonId]
            .materialItemTokens
            .length;
        uint8[] memory availableMaterialItemIdxs = new uint8[](
            materialItemCount
        );
        uint availableMaterialCount = 0;
        for (
            uint8 i = 0;
            i < seasons[thisSeasonId].materialItemTokens.length;
            i++
        ) {
            // 최대 발행량까지 아직이면
            if (
                seasons[thisSeasonId].itemMinted[
                    address(seasons[thisSeasonId].materialItemTokens[i])
                ] <
                seasons[thisSeasonId].itemMaxSupplys[
                    address(seasons[thisSeasonId].materialItemTokens[i])
                ]
            ) {
                availableMaterialItemIdxs[i] = i;
                availableMaterialCount++;
            }
        }

        // 총 경우의 수 n+1 = 설계도면 1 + 이용가능한 재료아이템 materialItemCount(n)
        // 0 ~ (n-1) 중 0 인 경우에만 설계도면
        bool isMaterial = Utils.getRandomNumber(0, availableMaterialCount + 1) >
            0;
        // isMaterial 인데 material 이 아예 없을 경우 isMaterial 그냥 false로!
        // 반대로 blueprint 나왔는데  blueprint 없지만 앞에 avaiableMaterialCount 있으면...material 로 바꿔줘.
        // blueprint 뽑으러 왔는데. blueprint 없고. 앞에 availableMaterialCount 이것도 0이면 재료다뽑았다 revert.

        uint24 totalPieceCount = seasons[thisSeasonId].totalPieceCount;
        uint24[] memory remainedBlueprintIndexes = new uint24[](
            totalPieceCount
        );
        uint24 mintedBlueprintCount = 0;

        if (isMaterial && availableMaterialCount == 0) {
            isMaterial = false;
        } else if (!isMaterial) {
            for (uint24 i = 0; i < totalPieceCount; i++) {
                if (!seasons[thisSeasonId].mintedBlueprint[i]) {
                    remainedBlueprintIndexes[mintedBlueprintCount] = i;
                    mintedBlueprintCount++;
                }
            }

            // 설계도면이 전부 발행되었을 경우
            if (mintedBlueprintCount < 1) {
                if (availableMaterialCount > 0) {
                    isMaterial = true;
                } else {
                    revert("item nft sold out");
                }
            }
        }

        if (isMaterial) {
            // 재료
            uint256 availableMaterialIndex = Utils.getRandomNumber(
                0,
                availableMaterialCount
            );

            MaterialItem instance = seasons[thisSeasonId].materialItemTokens[
                availableMaterialItemIdxs[availableMaterialIndex]
            ];
            instance.mint(msg.sender);
            seasons[thisSeasonId].itemMinted[address(instance)] =
                seasons[thisSeasonId].itemMinted[address(instance)] +
                1;
        } else {
            // 설계도면

            uint256 bluePrintItemIndex = Utils.getRandomNumber(
                0,
                mintedBlueprintCount
            );
            uint256 blueprintTokenId = remainedBlueprintIndexes[
                bluePrintItemIndex
            ];
            seasons[thisSeasonId].mintedBlueprint[blueprintTokenId] = true;
            // console.log("random blueprint idx: ", blueprintTokenId);

            blueprintItemToken.mint(msg.sender, blueprintTokenId + offset);
        }
    }

    /**
     *
     * @param pieceId 0 ~ totalPieceCount
     */
    function unlockPuzzlePiece(uint pieceId) public {
        // console.log("minted: ", seasons[thisSeasonId].mintedCount);

        // pieceId 가 해당하는 zone 파악
        // zone 별로 필요한 재료 아이템 다름
        uint8 zoneId = 0;
        uint24 zoneStart = 0;
        uint24 zoneEnd = 0;
        while (true) {
            zoneEnd = zoneEnd + seasons[thisSeasonId].pieceCountOfZones[zoneId];
            if (pieceId >= zoneStart && pieceId < zoneEnd) {
                break;
            }

            zoneStart =
                zoneStart +
                seasons[thisSeasonId].pieceCountOfZones[zoneId];
            zoneId++;
        }

        // 필요한 아이템 있는지 확인
        uint requireditemTotalCount = seasons[thisSeasonId]
            .requiredItemsForMinting[zoneId]
            .length;

        // // 1. 재료 아이템 확인
        for (uint8 i = 0; i < requireditemTotalCount; i++) {
            MaterialItem instance = MaterialItem(
                seasons[thisSeasonId].requiredItemsForMinting[zoneId][i]
            );

            uint8 itemAmount = seasons[thisSeasonId].requiredItemAmount[zoneId][
                i
            ];
            // console.log("itemAmount", itemAmount);
            uint[] memory tokens = instance.tokensOfOwner(msg.sender);

            require(
                tokens.length >= itemAmount,
                "not enough balacnce(material)"
            );
            for (uint j = 0; j < itemAmount; j++) {
                instance.burn(msg.sender, tokens[j]);
            }
        }
        // 2. 설계도면 아이템 확인
        // 유저가 가지고 있는 blueprintItem token id 가.
        // zoneStart ~ zoneEnd 안에 있는지 (?)
        // 아아 아니면 zoneStart~zoneEnd 까지 의 설계도면 주에 하나를 유저가 가지고 있는지!! 글고 그중하나 민트.
        // 근데 blueprint token id 가 .. 딱 zoneStart~ zoneEnd는 아니자나..
        // 시즌마다 증가... ?흠..
        uint[] memory bluprintsOfUser = blueprintItemToken.tokensOfOwner(
            msg.sender
        );
        // console.log("zoneStart: ", zoneStart);
        // console.log("zoneEnd: ", zoneEnd);

        uint blueprintId;
        bool hasBlueprint;
        for (uint i = 0; i < bluprintsOfUser.length; i++) {
            if (
                bluprintsOfUser[i] >= offset + zoneStart &&
                bluprintsOfUser[i] < offset + zoneEnd
            ) {
                hasBlueprint = true;
                blueprintId = bluprintsOfUser[i];
                i = i + bluprintsOfUser.length; // if 문 종료
            }
        }
        // console.log("hasBlueprint: ", hasBlueprint);
        // console.log("blueprintId: ", blueprintId);

        require(hasBlueprint, "not enough balance(blueprint)");
        blueprintItemToken.burn(msg.sender, blueprintId);

        // tokenId 얻기
        // tokenId = (지난 시즌의 마지막 PuzzlePiece 토큰아이디= offset)  + (pieceId)
        puzzlePieceToken.mint(msg.sender, pieceId + offset);
        seasons[thisSeasonId].mintedCount++;
    }

    // function getAllSeasonIds()
    //     public
    //     view
    //     onlyRole(DEFAULT_ADMIN_ROLE)
    //     returns (uint8[] memory _seasonIds)
    // {
    //     return (seasonIds);
    // }

    // function getSeasonDataById(
    //     uint8 id
    // )
    //     public
    //     view
    //     onlyRole(DEFAULT_ADMIN_ROLE)
    //     returns (
    //         uint24 totalPieceCount,
    //         uint24 mintedCount,
    //         MaterialItem[] memory materialItemTokens,
    //         uint16[] memory itemMaxSupplys,
    //         uint16[] memory itemMinted,
    //         uint8[20] memory pieceCountOfZones
    //     )
    // // address[][] memory requiredItemsForMinting,
    // // uint8[][] memory requiredItemAmount
    // // uint startedAt,
    // // bool[] memory mintedBlueprint
    // {
    //     require(id <= thisSeasonId, "season 404");
    //     uint itemCount = seasons[id].materialItemTokens.length;
    //     uint16[] memory _itemMaxSupplys = new uint16[](itemCount);
    //     uint16[] memory _itemMinted = new uint16[](itemCount);

    //     for (uint8 i = 0; i < itemCount; i++) {
    //         _itemMaxSupplys[i] = seasons[id].itemMaxSupplys[
    //             address(seasons[id].materialItemTokens[i])
    //         ];
    //         _itemMinted[i] = seasons[id].itemMinted[
    //             address(seasons[id].materialItemTokens[i])
    //         ];
    //     }

    //     address[][] memory _requiredItemsForMinting = new address[][](20);
    //     uint8[][] memory _requiredItemAmount = new uint8[][](20);

    //     for (uint8 i = 0; i < 20; i++) {
    //         _requiredItemsForMinting[i] = seasons[id].requiredItemsForMinting[
    //             i
    //         ];

    //         _requiredItemAmount[i] = seasons[id].requiredItemAmount[i];
    //     }

    //     return (
    //         seasons[id].totalPieceCount,
    //         seasons[id].mintedCount,
    //         seasons[id].materialItemTokens,
    //         _itemMaxSupplys,
    //         _itemMinted,
    //         seasons[id].pieceCountOfZones
    //         // _requiredItemsForMinting,
    //         // _requiredItemAmount
    //         // seasons[id].startedAt,
    //         // seasons[id].mintedBlueprint
    //     );
    // }
}
