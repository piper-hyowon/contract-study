// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract PuzzlePiece is AccessControl, ERC721, ERC721URIStorage {
    string private baseURI;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER");

    event Mint(address to, uint tokenId);
    event Burn(address from, uint tokenId);

    constructor(
        string memory metadataUri,
        address serviceContract, // play duzzle contract
        address admin
    ) ERC721("Duzzle Puzzle Pieces", "DZPZ") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(DEFAULT_ADMIN_ROLE, serviceContract);
        _grantRole(MINTER_ROLE, serviceContract);

        setBaseURI(metadataUri);
    }

    function getBaseURI() public view returns (string memory) {
        return _baseURI();
    }

    function setBaseURI(
        string memory baseURI_
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURI = baseURI_;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function mint(
        address _to,
        uint tokenId
    ) external onlyRole(MINTER_ROLE) returns (uint) {
        _mint(_to, tokenId);

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
        return super.tokenURI(tokenId);
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
        override(AccessControl, ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
