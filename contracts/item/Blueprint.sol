pragma solidity ^0.8.0;

import "./Item.sol";

contract Blueprint is Item {
    // uint32[] areas;
    constructor(
        string memory name_,
        string memory symbol_,
        uint32 _seasonId,
        uint256 _maxSupply,
        string[] memory areas
    ) Item(name_, symbol_, _seasonId, _maxSupply) {}
}
