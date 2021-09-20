// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract OptionsMarket {
    // Admin access
    address private owner;

    // Option data
    struct Option {
        uint256 expiry;
        string status; // none, exercised, collected
        address writer;
        address tokenAddress;
        uint256 amount;
        string optionType; // call, put
    }

    uint256 private optionId;
    mapping(uint256 => Option) public Options;
    mapping(uint256 => address) public OptionOwners;

    // Trade data
    struct Trade {
        address poster;
        uint256 optionId;
        uint256 price;
        string status; // open, closed, cancelled
    }

    uint256 private tradeId;
    mapping(uint256 => Trade) public Trades;

    constructor() {
        // Set the admin as the deployer of the contract
        owner = msg.sender;
    }

    // ============= Util functions =============
    function _compareStrings(string memory a, string memory b) private pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    // ============= Option functions =============
    function writeOption(string memory optionType, uint256 hoursToExpire, address tokenAddress, uint256 amount) public returns (uint256) {
        // Transfer the tokens from the writers account to the contract
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount); 

        // Verify the option type is valid, the time to live is valid, and the amount of tokens is more than 0
        require(_compareStrings(optionType, "call") || _compareStrings(optionType, "put"), "Option type may only be 'call' or 'put'");
        require(hoursToExpire > 0, "Hours to expire must be greater than 0");
        require(amount > 0, "Amount of tokens must be greater than 0");

        // Write a new option
        Option memory option = Option({
            expiry: block.timestamp + hoursToExpire * 1 hours,
            status: "none",
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

    function getOption(uint256 _optionId) public view returns (uint256, string memory, address, uint256, string memory) {
        // Get the data for an existing option
        Option memory option = Options[_optionId];
        return (option.expiry, option.status, option.tokenAddress, option.amount, option.optionType);
    }

    function exerciseOption(uint256 _optionId) public {
        // Get the data of the option
        Option memory option = Options[_optionId];

        // Check that the option may be exercised
        require(option.expiry <= block.timestamp, "Option has expired");
        require(_compareStrings(option.status, "none"), "Option has already been exercised");
    }

    function collectExpired(uint256 _optionId) public {
        // Allow a writer to collect an expired contract
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