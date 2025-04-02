// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiPartyCryptoVault {
    struct Transaction {
        address payable to;
        uint256 amount;
        uint256 approvals;
        uint256 unlockTime;
        bool executed;
    }

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public requiredApprovals;

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public hasApproved;

    event Deposit(address indexed sender, uint256 amount);
    event TransactionCreated(uint256 indexed txIndex, address indexed to, uint256 amount, uint256 unlockTime);
    event Approved(address indexed owner, uint256 indexed txIndex);
    event Executed(uint256 indexed txIndex);
    event KeyShardsStored(address indexed owner, bytes shard);
    event KeyRecovered(address indexed owner);

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    constructor(address[] memory _owners, uint256 _requiredApprovals) {
        require(_owners.length > 0, "Owners required");
        require(_requiredApprovals > 0 && _requiredApprovals <= _owners.length, "Invalid approvals count");

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");
            
            isOwner[owner] = true;
            owners.push(owner);
        }
        requiredApprovals = _requiredApprovals;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function createTransaction(address payable _to, uint256 _amount, uint256 _timeLock) external onlyOwner {
        require(address(this).balance >= _amount, "Insufficient balance");
        
        transactions.push(Transaction({
            to: _to,
            amount: _amount,
            approvals: 0,
            unlockTime: block.timestamp + _timeLock,
            executed: false
        }));

        emit TransactionCreated(transactions.length - 1, _to, _amount, block.timestamp + _timeLock);
    }

    function approveTransaction(uint256 _txIndex) external onlyOwner {
        require(_txIndex < transactions.length, "Invalid transaction index");
        Transaction storage transaction = transactions[_txIndex];
        require(!transaction.executed, "Transaction already executed");
        require(!hasApproved[_txIndex][msg.sender], "Already approved");

        transaction.approvals++;
        hasApproved[_txIndex][msg.sender] = true;

        emit Approved(msg.sender, _txIndex);
        
        if (transaction.approvals >= requiredApprovals && block.timestamp >= transaction.unlockTime) {
            executeTransaction(_txIndex);
        }
    }

    function executeTransaction(uint256 _txIndex) internal {
        Transaction storage transaction = transactions[_txIndex];
        require(transaction.approvals >= requiredApprovals, "Not enough approvals");
        require(!transaction.executed, "Transaction already executed");
        require(block.timestamp >= transaction.unlockTime, "Transaction is time-locked");

        transaction.executed = true;
        transaction.to.transfer(transaction.amount);
        
        emit Executed(_txIndex);
    }

    function storeKeyShard(bytes memory shard) external onlyOwner {
        emit KeyShardsStored(msg.sender, shard);
    }

    function recoverKeys() external onlyOwner {
        emit KeyRecovered(msg.sender);
    }
}
