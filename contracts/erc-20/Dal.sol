// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

contract Dal is ERC20, Ownable, ERC20Capped {
    event Mint(address to, uint value);
    event Burn(address from, uint value);
    address serviceContract;

    constructor(
        uint cap,
        address _serviceContract,
        address owner
    ) ERC20("Dal", "DAL") Ownable(owner) ERC20Capped(cap * (10 ** decimals())) {
        serviceContract = _serviceContract;
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

    function burn(address account, uint256 value) public {
        _burn(account, value);
        emit Burn(account, value);
    }
}
