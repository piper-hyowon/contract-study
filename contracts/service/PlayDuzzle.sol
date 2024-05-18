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
    uint8[] private seasonIds; // 지금까지의 시즌 id array
    mapping(uint8 => DuzzleLibrary.Season) public seasons; // 시즌별 정보
    Dal public dalToken;
    BlueprintItem public blueprintItemToken;
    PuzzlePiece public puzzlePieceToken;

    uint public offset;

    event StartSeason(MaterialItem[] itemAddresses);
    event SetZoneData(
        uint8 zoneId,
        uint8 pieceCountOfZones,
        address[] requiredItemsForMinting,
        uint8[] requiredItemAmount
    );
    event UnlockPuzzlePiece(uint8 zoneId, uint tokenId, address to);

    error NotEnoughBalanceOfBlueprintItem();
    error NotEnoughBalanceOfMaterialItem();
    error SeasonIdNotFound();
    error SoldOutItems();

    constructor(
        uint capOfDalToken,
        string memory bluePrintBaseUri,
        string memory puzzlePieceBaseUri
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        thisSeasonId = 0;
        dalToken = new Dal(capOfDalToken, address(this), msg.sender);
        blueprintItemToken = new BlueprintItem(
            bluePrintBaseUri,
            address(this),
            msg.sender
        );
        puzzlePieceToken = new PuzzlePiece(
            puzzlePieceBaseUri,
            address(this),
            msg.sender
        );

        offset = 0; // start
    }

    function startSeason(
        address[] memory existedItemCollections, // 기존 재료아이템 (토큰 주소)
        string[] calldata newItemNames, // 새로운 재료 아이템 이름
        string[] memory newItemSymbols, // 새로운 재료 아이템 심볼
        string[] memory newItemBaseUris,
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
        MaterialItem[] memory materialItemTokens = new MaterialItem[](
            materialItemCount
        );
        uint256 j = 0;
        for (uint256 i = 0; i < materialItemCount; i++) {
            if (
                existedItemCollections.length > 0 &&
                i < existedItemCollections.length
            ) {
                MaterialItem instance = MaterialItem(existedItemCollections[i]);
                materialItemTokens[i] = instance; // contract instance
            } else {
                j = i - existedItemCollections.length;
                MaterialItem instance = new MaterialItem(
                    newItemNames[j],
                    newItemSymbols[j],
                    newItemBaseUris[j],
                    address(this),
                    msg.sender
                );

                materialItemTokens[i] = instance;
            }
            seasons[thisSeasonId].itemMaxSupplys[
                address(materialItemTokens[i])
            ] = maxSupplys[i];

            seasons[thisSeasonId].itemMinted[
                address(materialItemTokens[i])
            ] = 0;
        }

        seasons[thisSeasonId].materialItemTokens = materialItemTokens;

        emit StartSeason(materialItemTokens);
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
        // 2 DAL 차감
        dalToken.burn(msg.sender, 2 * (10 ** dalToken.decimals()));

        // 랜덤 아이템 뽑기
        // 1. 설계도면 vs 재료
        uint256 materialItemCount = seasons[thisSeasonId]
            .materialItemTokens
            .length;
        // 총 경우의 수 = n+1 (설계도면 1 + 재료아이템 materialItemCount(n))
        // 0 ~ (n-1) 중 0 인 경우에만 설계도면 (1/n 확률)
        bool isMaterial = Utils.getRandomNumber(0, materialItemCount + 1) > 0;
        if (isMaterial) {
            // 재료 당첨
            // 재료 있는지 확인 후 mint
            uint8[] memory availableMaterialItemIdxs;
            uint availableMaterialIdxCount;
            (
                availableMaterialItemIdxs,
                availableMaterialIdxCount
            ) = getMintableMaterialIds();

            if (availableMaterialIdxCount > 0) {
                uint256 availableMaterialIndex = Utils.getRandomNumber(
                    0,
                    availableMaterialIdxCount
                );
                MaterialItem instance = seasons[thisSeasonId]
                    .materialItemTokens[
                        availableMaterialItemIdxs[availableMaterialIndex]
                    ];

                instance.mint(msg.sender);

                seasons[thisSeasonId].itemMinted[address(instance)] =
                    seasons[thisSeasonId].itemMinted[address(instance)] +
                    1;
            } else {
                // 발행 가능한 재료 아이템 없을 경우 설계도면 발행
                uint24[] memory remainedBlueprintIndexes;
                uint24 mintableCount;
                (
                    remainedBlueprintIndexes,
                    mintableCount
                ) = getMintableBlueprintIds();

                if (mintableCount < 1) {
                    // 설계도면도 없을 경우
                    revert SoldOutItems();
                } else {
                    uint256 randomNumber = Utils.getRandomNumber(
                        0,
                        mintableCount
                    );
                    uint256 blueprintIdx = remainedBlueprintIndexes[
                        randomNumber
                    ];

                    seasons[thisSeasonId].mintedBlueprint[blueprintIdx] = true;
                    uint256 blueprintTokenId = blueprintIdx + 1;
                    blueprintItemToken.mint(
                        msg.sender,
                        blueprintTokenId + offset
                    );
                }
            }
        } else {
            // 설계도면 당첨
            // 설계도면 있는지 확인 후 mint
            uint24[] memory remainedBlueprintIndexes;
            uint24 mintableCount;
            (
                remainedBlueprintIndexes,
                mintableCount
            ) = getMintableBlueprintIds();

            if (mintableCount > 0) {
                uint256 randomNumber = Utils.getRandomNumber(0, mintableCount);
                uint256 blueprintIdx = remainedBlueprintIndexes[randomNumber];

                seasons[thisSeasonId].mintedBlueprint[blueprintIdx] = true;
                uint256 blueprintTokenId = blueprintIdx + 1;
                blueprintItemToken.mint(msg.sender, blueprintTokenId + offset);
            } else {
                // 발행 가능한 설계도면 아이템 없을 경우 재료 발행
                uint8[] memory availableMaterialItemIdxs;
                uint availableMaterialIdxCount;
                (
                    availableMaterialItemIdxs,
                    availableMaterialIdxCount
                ) = getMintableMaterialIds();

                if (availableMaterialIdxCount > 0) {
                    uint256 availableMaterialIndex = Utils.getRandomNumber(
                        0,
                        availableMaterialIdxCount
                    );
                    MaterialItem instance = seasons[thisSeasonId]
                        .materialItemTokens[
                            availableMaterialItemIdxs[availableMaterialIndex]
                        ];
                    instance.mint(msg.sender);
                    seasons[thisSeasonId].itemMinted[address(instance)] =
                        seasons[thisSeasonId].itemMinted[address(instance)] +
                        1;
                } else {
                    // 재료도 없을 경우
                    revert SoldOutItems();
                }
            }
        }
    }

    // 재료 아이템 토큰 maxSupply 고려
    function getMintableMaterialIds()
        internal
        view
        returns (
            uint8[] memory _availableMaterialItemIdxs,
            uint256 _materialItemCount
        )
    {
        uint256 materialItemCount = seasons[thisSeasonId]
            .materialItemTokens
            .length;
        uint8[] memory availableMaterialItemIdxs = new uint8[](
            materialItemCount
        );
        uint availableMaterialCount = 0;

        for (uint8 i = 0; i < materialItemCount; i++) {
            uint minted = seasons[thisSeasonId].itemMinted[
                address(seasons[thisSeasonId].materialItemTokens[i])
            ];
            uint maxSupplys = seasons[thisSeasonId].itemMaxSupplys[
                address(seasons[thisSeasonId].materialItemTokens[i])
            ];

            // 최대 발행량까지 아직이면
            if (minted < maxSupplys) {
                availableMaterialItemIdxs[availableMaterialCount] = i;
                availableMaterialCount++;
            }
        }

        return (availableMaterialItemIdxs, availableMaterialCount);
    }

    function getMintableBlueprintIds()
        internal
        view
        returns (uint24[] memory, uint24 mintableCount)
    {
        uint24 totalPieceCount = seasons[thisSeasonId].totalPieceCount;
        uint24[] memory _remainedBlueprintIndexes = new uint24[](
            totalPieceCount
        );
        uint24 remainedBlueprintCount = 0;
        for (uint24 i = 0; i < totalPieceCount; i++) {
            if (!seasons[thisSeasonId].mintedBlueprint[i]) {
                _remainedBlueprintIndexes[remainedBlueprintCount] = i;
                remainedBlueprintCount++;
            }
        }

        return (_remainedBlueprintIndexes, remainedBlueprintCount);
    }

    /**
     *
     * @param pieceId 0 ~ totalPieceCount
     */
    function unlockPuzzlePiece(uint pieceId) public {
        // pieceId 가 해당하는 zone 파악
        // zone 별로 필요한 재료 아이템 다름
        uint8 zoneId = 0;
        uint24 zoneStart = 1;
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
            uint[] memory tokens = instance.tokensOfOwner(msg.sender);

            if (tokens.length < itemAmount) {
                revert NotEnoughBalanceOfMaterialItem();
            }

            for (uint j = 0; j < itemAmount; j++) {
                instance.burn(msg.sender, tokens[j]);
            }
        }
        // 2. 설계도면 아이템 확인
        // 유저가 가지고 있는 blueprintItem token id 가.
        // zoneStart ~ zoneEnd 안에 있는지 (?)
        // 아아 아니면 zoneStart~zoneEnd 까지 의 설계도면 주에 하나를 유저가 가지고 있는지!! 글고 그중하나 민트.
        uint[] memory bluprintsOfUser = blueprintItemToken.tokensOfOwner(
            msg.sender
        );

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
        if (!hasBlueprint) {
            revert NotEnoughBalanceOfBlueprintItem();
        }
        blueprintItemToken.burn(msg.sender, blueprintId);

        // tokenId 얻기
        // tokenId = (지난 시즌의 마지막 PuzzlePiece 토큰아이디= offset)  + (pieceId)
        puzzlePieceToken.mint(msg.sender, pieceId + offset);
        seasons[thisSeasonId].mintedCount++;
    }

    function getAllSeasonIds()
        public
        view
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (uint8[] memory _seasonIds)
    {
        return (seasonIds);
    }

    function getItemMintedCountsBySeasonId(
        uint8 id
    )
        public
        view
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (
            MaterialItem[] memory materialItemTokens,
            uint16[] memory itemMaxSupplys,
            uint16[] memory itemMinted,
            bool[] memory mintedBlueprint
        )
    {
        if (id > thisSeasonId) {
            revert SeasonIdNotFound();
        }
        uint itemCount = seasons[id].materialItemTokens.length;
        uint16[] memory _itemMaxSupplys = new uint16[](itemCount);
        uint16[] memory _itemMinted = new uint16[](itemCount);

        for (uint8 i = 0; i < itemCount; i++) {
            _itemMaxSupplys[i] = seasons[id].itemMaxSupplys[
                address(seasons[id].materialItemTokens[i])
            ];
            _itemMinted[i] = seasons[id].itemMinted[
                address(seasons[id].materialItemTokens[i])
            ];
        }

        return (
            seasons[id].materialItemTokens,
            _itemMaxSupplys,
            _itemMinted,
            seasons[id].mintedBlueprint
        );
    }

    function getPuzzlePieceMintedCountsBySeasonId(
        uint8 id
    )
        public
        view
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (uint24 totalPieceCount, uint24 mintedCount)
    {
        if (id > thisSeasonId) {
            revert SeasonIdNotFound();
        }

        return (seasons[id].totalPieceCount, seasons[id].mintedCount);
    }

    function getDataBySeasonId(
        uint8 id
    )
        public
        view
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (
            uint8[20] memory pieceCountOfZones,
            address[][] memory requiredItemsForMinting,
            uint8[][] memory requiredItemAmount,
            uint startedAt
        )
    {
        if (id > thisSeasonId) {
            revert SeasonIdNotFound();
        }

        address[][] memory _requiredItemsForMinting = new address[][](20);
        uint8[][] memory _requiredItemAmount = new uint8[][](20);

        for (uint8 i = 0; i < 20; i++) {
            _requiredItemsForMinting[i] = seasons[id].requiredItemsForMinting[
                i
            ];

            _requiredItemAmount[i] = seasons[id].requiredItemAmount[i];
        }

        return (
            seasons[id].pieceCountOfZones,
            _requiredItemsForMinting,
            _requiredItemAmount,
            seasons[id].startedAt
        );
    }
}
