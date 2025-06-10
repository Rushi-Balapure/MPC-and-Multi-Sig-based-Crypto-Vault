// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SecureVault {
    address public owner;

    event Deposited(address indexed sender, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(address payable _to, uint256 _amount) public onlyOwner {
        require(_to != address(0), "Invalid address");
        require(_amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= _amount, "Insufficient balance");

        _to.transfer(_amount);
        emit Withdrawn(_to, _amount);
    }

    function getVaultBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
