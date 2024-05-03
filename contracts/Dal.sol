pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Dal is ERC20 {
    address public minter;
    mapping(address => uint) public balances;

    constructor(
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {
        minter = msg.sender;
    }
}
