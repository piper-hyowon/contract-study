pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Item is AccessControl, ERC721, IERC721Enumerable, Ownable {
    uint32[] public seasonId;
    mapping(uint32 => uint32) public itemId; // duzzle db

    bytes32 public constant MINTER_ROLE = keccak256("MINTER");
    bool public mintPaused;
    mapping(uint32 => uint256) public MAX_SUPPLY; // 시즌별 해당 아이템의 최대 발행 수

    using Counters for Counters.Counter;
    Counters.Counter private tokenIdCounter;
    mapping(uint32 => Counters.Counter) public mintedCountBySeason; // 시즌별 민팅된 수

    constructor(
        string memory name_,
        string memory symbol_,
        uint32 _seasonId,
        uint256 _maxSupply
    ) ERC721(name_, symbol_) {
        MAX_SUPPLY[_seasonId] = _maxSupply;
        seasonId = _seasonId;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // TODO: metadata 있어야하나?
    function safeMint(uint32 seasonId, address to) public onlyOwner {
        require(!mintPaused, "Mint is paused");
        require(
            mintedCountBySeason <= MAX_SUPPLY[seasonId],
            "I'm sorry we reached the cap"
        );
        uint256 tokenId = tokenIdCounter.current();
        tokenIdCounter.increment();
        mintedCountBySeason[seasonId].increment();
        _safeMint(to, tokenId);
    }

    function pauseMint(bool _paused) external onlyOwner {
        require(!mintPaused, "Contract paused.");
        mintPaused = _paused;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl, ERC721, IERC165) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function destroy() public onlyOwner {
        selfdestruct(owner);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl, ERC721) returns (bool) {}

    function totalSupply() external view override returns (uint256) {}

    function tokenOfOwnerByIndex(
        address owner,
        uint256 index
    ) external view override returns (uint256) {}

    function tokenByIndex(
        uint256 index
    ) external view override returns (uint256) {}
}
