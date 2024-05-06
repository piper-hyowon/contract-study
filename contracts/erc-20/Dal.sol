// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

import "hardhat/console.sol";

contract Dal is ERC20, Ownable, ERC20Capped {
    address public minter;

    // mapping(address => uint) public balances;

    event Mint(address to, uint value);

    constructor(
        uint cap
    )
        ERC20("Dal", "DAL")
        Ownable(msg.sender)
        ERC20Capped(cap * (10 ** decimals()))
    {
        minter = msg.sender;
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override(ERC20, ERC20Capped) {
        super._update(from, to, value);
    }

    function mint(address account, uint256 value) public onlyOwner {
        _mint(account, value);
        emit Mint(account, value);
    }
}
