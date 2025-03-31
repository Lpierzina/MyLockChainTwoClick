// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract LockChainRegistry {
    mapping(bytes32 => address) public registeredBy;
    mapping(bytes32 => uint256) public timestamp;

    event DocumentRegistered(address indexed user, bytes32 hash, uint256 timestamp);

    function register(bytes32 documentHash) external {
        require(registeredBy[documentHash] == address(0), "Already registered");

        registeredBy[documentHash] = msg.sender;
        timestamp[documentHash] = block.timestamp;

        emit DocumentRegistered(msg.sender, documentHash, block.timestamp);
    }

    function isRegistered(bytes32 documentHash) external view returns (bool) {
        return registeredBy[documentHash] != address(0);
    }

    function getDetails(bytes32 documentHash) external view returns (address, uint256) {
        return (registeredBy[documentHash], timestamp[documentHash]);
    }
}
