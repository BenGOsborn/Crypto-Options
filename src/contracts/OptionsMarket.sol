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
        uint256 price;
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
    address private immutable tradeCurrency;

    constructor(address currency) {
        // Set the admin as the deployer of the contract and the currency of the trades
        owner = msg.sender;
        tradeCurrency = currency;
    }

    // ============= Util functions =============
    function _compareStrings(string memory a, string memory b) private pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    // ============= Option functions =============
    function writeOption(string memory optionType, uint256 hoursToExpire, address tokenAddress, uint256 amount, uint256 price) public returns (uint256) {
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
            price: price,
            optionType: optionType
        });

        // If this is a call then transfer the amount of the token to the contract,
        // otherwise if a put then transfer the trade currency to the contract
        if (_compareStrings(optionType, "call")) {
            IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount); 
        } else {
            IERC20(tradeCurrency).transferFrom(msg.sender, address(this), price); 
        }

        // Save the option
        Options[optionId] = option;
        OptionOwners[optionId] = msg.sender;
        optionId++;

        // Return the id of the option
        return optionId - 1;
    }

    function exerciseOption(uint256 _optionId) public {
        // Get the data of the option
        Option memory option = Options[_optionId];

        // Check that the option may be exercised
        require(option.expiry <= block.timestamp, "Option has expired");
        require(_compareStrings(option.status, "none"), "Option has already been exercised");
        require(OptionOwners[_optionId] == msg.sender, "Only the owner of the option may exercise it");

        // If the option is a call, then charge the user the premium to receive the tokens,
        // else if the option is a put, transfer their tokens
        if (_compareStrings(option.optionType, "call")) {
            IERC20(tradeCurrency).transferFrom(msg.sender, option.writer, option.price);
            IERC20(option.tokenAddress).transfer(msg.sender, option.amount);
        } else {
            IERC20(option.tokenAddress).transferFrom(msg.sender, option.writer, option.amount);
            IERC20(tradeCurrency).transfer(msg.sender, option.price);
        }

        // Update the option
        Options[_optionId].status = "exercised";
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