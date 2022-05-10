// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;


import "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./OrderMixin.sol";
import "./OrderRFQMixin.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "./libraries/UniversalERC20.sol";

/// @title openocean Limit Order Protocol v2
contract LimitOrderProtocol is
EIP712Upgradeable,
OrderMixin,
OrderRFQMixin, KeeperCompatibleInterface
{
    using UniversalERC20 for IERC20Upgradeable;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address;

    function initialize() public initializer {
        __EIP712_init("openocean Limit Order Protocol", "2");
        __Ownable_init();
    }
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    struct Param{
        bool isETH;
        bool success;
        bytes result;
    }
    function swap(address from, address[] calldata path, uint[] calldata amounts, address fee,
        bytes calldata swapExtraData) public payable onlyOperator {
        require(path.length == 2 && amounts.length == 2, "invalid args");
        address ooSwap = getOOswap();
        require(ooSwap != address(0), "ooswap is zero");
        Param memory vars;
        vars.isETH = IERC20Upgradeable(path[0]).isETH();
        if (!vars.isETH) {
            IERC20Upgradeable(path[0]).safeTransferFrom(from, address(this), amounts[0]);
            IERC20Upgradeable(path[0]).safeIncreaseAllowance(ooSwap, amounts[0]);
        }
        (vars.success, vars.result) = ooSwap.call{value : msg.value}(swapExtraData);
        require(vars.success, "swap failed");
        if (!vars.isETH) {
            IERC20Upgradeable(path[0]).safeApprove(ooSwap, 0);
        }
        uint256 returnAmount = abi.decode(vars.result, (uint256));
        require(returnAmount >= amounts[1], "returnAmount is too low");
        IERC20Upgradeable(path[1]).universalTransfer(from, amounts[1]);
        uint delta = returnAmount - amounts[1];
        if (delta > 0) {
            address to = fee == address(0) ? owner() : fee;
            IERC20Upgradeable(path[1]).universalTransfer(to, delta);
        }
    }

    function checkUpkeep(bytes calldata checkData) override external returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = false;
        performData = new bytes(0);
    }

    function performUpkeep(bytes calldata performData) override external {
    }
}
