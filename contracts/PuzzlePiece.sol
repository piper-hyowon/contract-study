// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";

contract PuzzlePiece is AccessControl, ERC721, ERC721URIStorage {
    string baseURI;
    using Counters for Counters.Counter;
    Counters.Counter private tokenIdCounter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER");

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address minter
    ) ERC721(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, minter);

        setBaseURI(baseURI_);
    }

    function getBaseURI() public view returns (string memory) {
        // console.log('getBaseURI call good!!', baseURI);
        return baseURI;
    }

    function setBaseURI(
        string memory _baseURI
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURI = _baseURI;
    }

    function mint(
        address _to,
        string memory _tokenURI
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        tokenIdCounter.increment();
        uint256 tokenId = tokenIdCounter.current();
        _mint(_to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
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
        return super.tokenURI(tokenId);
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(AccessControl, ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
