// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract OptionsMarket {
    // **** Have some events to be emmitted as well
    // **** How am I going to store the previous events on the blockchain

    // Admin access
    address private owner;

    // Option data
    struct Option {
        uint256 expiry;
        bool exercised;
        address writer;
        address tokenAddress;
        uint256 amount;
        string optionType;
    }

    uint256 private optionId;
    mapping(uint256 => Option) public Options;
    mapping(uint256 => address) public OptionOwners;

    // Trade data
    struct Trade {
        address poster;
        uint256 optionId;
        uint256 price;
        string status; // Open, closed, cancelled
    }

    uint256 private tradeId;
    mapping(uint256 => Trade) public Trades;

    constructor() {
        // Set the admin as the deployer of the contract
        owner = msg.sender;
    }

    // ============= Option functions =============
    function writeOption(string memory optionType, uint256 hoursToExpire, address tokenAddress, uint256 amount) public returns (uint256) {
        // Transfer the tokens from the writers account to the contract
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount); 

        // Write a new option
        Option memory option = Option({
            expiry: block.timestamp + hoursToExpire * 1 hours,
            exercised: false,
            writer: msg.sender,
            tokenAddress: tokenAddress,
            amount: amount,
            optionType: optionType
        });

        // Save the option
        Options[optionId] = option;
        OptionOwners[optionId] = msg.sender;
        optionId++;

        // Return the id of the option
        return optionId - 1;
    }

    function getOption(uint256 _optionId) public view returns (uint256, bool, address, uint256, string memory) {
        // Get the data for an existing option
        Option memory option = Options[_optionId];
        return (option.expiry, option.exercised, option.tokenAddress, option.amount, option.optionType);
    }

    function collectExpiredOption(uint256 _optionId) public {
        // Allow the writer of an option to collect the tokens from their expired option
    }

    // ============= Marketplace functions =============
    function executeTrade() public {
        // Execute a trade for buying an option
    }

    function openTrade() public {
        // Open a new trade for selling an option
    }

    function cancelTrade() public {
        // Cancel a trade
    }
}