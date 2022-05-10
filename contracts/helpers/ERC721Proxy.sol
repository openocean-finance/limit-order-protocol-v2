// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;
pragma abicoder v1;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "./ImmutableOwner.sol";


/* solhint-disable func-name-mixedcase */

contract ERC721Proxy is ImmutableOwner {
    constructor(address _immutableOwner) ImmutableOwner(_immutableOwner) {
        require(ERC721Proxy.func_60iHVgK.selector == IERC20.transferFrom.selector, "ERC721Proxy: bad selector");
    }

    /// @notice Proxy transfer method for `IERC721.transferFrom`. Selector must match `IERC20.transferFrom`.
    /// Note that `amount` is unused for security reasons to prevent unintended ERC-721 token sale via partial fill
    // keccak256("func_60iHVgK(address,address,uint256,uint256,address)") == 0x23b872dd (IERC20.transferFrom)
    function func_60iHVgK(address from, address to, uint256 /* amount */, uint256 tokenId, IERC721 token) external onlyImmutableOwner {
        token.transferFrom(from, to, tokenId);
    }
}

/* solhint-enable func-name-mixedcase */
