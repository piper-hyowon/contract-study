pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";

library Utils {
    struct Util {
        mapping(uint8 => bool) seen;
    }

    function hasDuplicateUint8(
        Util storage util,
        uint8[] calldata array
    ) internal returns (bool) {
        for (uint i = 0; i < array.length; i++) {
            unchecked {
                if (util.seen[array[i]]) {
                    return true;
                }
                util.seen[array[i]] = true;
            }
        }
        unchecked {
            return false;
        }
    }

    function hasDuplicateString(
        string[] calldata array
    ) public pure returns (bool) {
        for (uint256 i = 0; i < array.length - 1; i++) {
            for (uint256 j = i + 1; j < array.length; j++) {
                unchecked {
                    if (
                        keccak256(bytes(array[i])) == keccak256(bytes(array[j]))
                    ) {
                        return true;
                    }
                }
            }
        }
        unchecked {
            return false;
        }
    }
}
