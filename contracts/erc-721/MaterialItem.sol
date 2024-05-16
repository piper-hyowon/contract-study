// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// 재료 아이템 NFT 의 메타데이터는 전부 동일
contract MaterialItem is
    AccessControl,
    ERC721,
    ERC721URIStorage,
    ERC721Enumerable
{
    string private baseURI;
    uint private nextTokenId;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER");

    event Mint(address to, uint tokenId);
    event Burn(address from, uint tokenId);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory metadataUri,
        address minter
    ) ERC721(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, minter);

        setBaseURI(metadataUri);
    }

    function getBaseURI() public view returns (string memory) {
        return baseURI;
    }

    function setBaseURI(
        string memory _baseURI
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURI = _baseURI;
    }

    function mint(address _to) external onlyRole(MINTER_ROLE) returns (uint) {
        uint tokenId = nextTokenId;
        _mint(_to, tokenId);
        nextTokenId++;

        emit Mint(_to, tokenId);

        return tokenId;
    }

    function grantMinterRole(
        address minter
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MINTER_ROLE, minter);
    }

    function revokeMinterRole(
        address minter
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, minter);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return ERC721URIStorage.tokenURI(tokenId);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override(ERC721, ERC721Enumerable) returns (address) {
        address previousOwner = super._update(to, tokenId, auth);
        return previousOwner;
    }

    function _increaseBalance(
        address account,
        uint128 amount
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, amount);
    }

    function burn(address from, uint256 tokenId) external {
        emit Burn(from, tokenId);

        super._burn(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(AccessControl, ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokensOfOwner(address _owner) public view returns (uint[] memory) {
        uint tokenCount = balanceOf(_owner);
        uint[] memory tokensId = new uint256[](tokenCount);

        for (uint i = 0; i < tokenCount; i++) {
            tokensId[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokensId;
    }
}
