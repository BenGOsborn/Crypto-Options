// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Options {
    // Have some events to be emmitted as well

    // Admin access
    address private owner;

    // Option object
    struct Option {
        uint256 expiry;
        bool exercised;
        address writer;
        address tokenAddress;
        uint256 price;
        string optionType;
    }

    // Store options
    uint256 private optionId;
    mapping(address => uint256) private options;

    constructor() {
        // Set the admin as the deployer of the contract
        owner = msg.sender;
    }

    function writeOption(string memory optionType, uint256 amount, uint256 expiry) public {

    }

    function getOption(uint256 optionId) public view returns (uint256, bool, address, uint256, string memory) {

    }
}