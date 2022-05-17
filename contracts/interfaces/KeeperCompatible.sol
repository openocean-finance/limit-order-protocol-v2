// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "./KeeperCompatibleInterface.sol";

abstract contract KeeperCompatible is KeeperBase, KeeperCompatibleInterface {}
