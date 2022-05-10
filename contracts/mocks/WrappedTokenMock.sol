// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;
pragma abicoder v1;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "../interfaces/IWithdrawable.sol";

/// @title Generic token for testing purposes with deposit/withdraw capabilities
contract WrappedTokenMock is ERC20Permit, Ownable, IWithdrawable {
    event Deposit(address indexed dst, uint wad);
    event Withdrawal(address indexed src, uint wad);

    // solhint-disable-next-line no-empty-blocks
    constructor(string memory name, string memory symbol) ERC20(name, symbol) ERC20Permit(name) {}

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external onlyOwner {
        _burn(account, amount);
    }

    function getChainId() external view returns (uint256) {
        return block.chainid;
    }

    function deposit() public payable {
        _mint(msg.sender, msg.value);
        // balanceOf[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint wad) public {
        require(balanceOf(msg.sender) >= wad, "WTM: not enough balance");
        _burn(msg.sender, wad);
        payable(msg.sender).transfer(wad);
        emit Withdrawal(msg.sender, wad);
    }
}
