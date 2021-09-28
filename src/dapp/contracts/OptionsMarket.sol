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
        uint256 tokenAmount;
        uint256 strikePrice;
        string optionType; // call, put
    }

    uint256 private optionId;
    mapping(uint256 => Option) private options;
    mapping(uint256 => address) private optionOwners;

    // Trade data
    struct Trade {
        address poster;
        uint256 optionId;
        uint256 premium;
        string status; // open, closed, cancelled
    }

    uint256 private tradeId;
    mapping(uint256 => Trade) private trades;
    address private immutable tradeCurrency;

    constructor(address currency) {
        // Set the owner as the deployer of the contract and set the currency of the trades
        owner = msg.sender;
        tradeCurrency = currency;
    }

    // Declare events for logging data
    event OptionWritten(uint256 optionId, address indexed writer);
    event OptionExercised(uint256 optionId, address indexed writer, address indexed exerciser);
    event TradeOpened(uint256 tradeId, address indexed poster);
    event TradeExecuted(uint256 tradeId, address indexed buyer);
    event TradeCancelled(uint256 tradeId);

    // ============= Util functions =============

    // Compare if two strings are equal
    function _compareStrings(string memory a, string memory b) private pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    // Get the trade currency of the token
    function getTradeCurrency() public view returns (address) {
        return tradeCurrency;
    }

    // ============= Option functions =============

    // Allow the address to create a new option
    function writeOption(string memory optionType, uint256 expiry, address tokenAddress, uint256 tokenAmount, uint256 strikePrice) public returns (uint256) {
        // Check that the option is valid
        require(_compareStrings(optionType, "call") || _compareStrings(optionType, "put"), "Option type may only be 'call' or 'put'");
        require(expiry > block.timestamp, "Expiry must be in the future");

        // Write a new option
        Option memory option = Option({
            expiry: expiry,
            status: "none",
            writer: msg.sender,
            tokenAddress: tokenAddress,
            tokenAmount: tokenAmount,
            strikePrice: strikePrice,
            optionType: optionType
        });

        // If this is a call then transfer the amount of the token to the contract,
        // otherwise if a put then transfer the trade currency to the contract
        if (_compareStrings(optionType, "call")) {
            IERC20(tokenAddress).transferFrom(msg.sender, address(this), tokenAmount); 
        } else {
            IERC20(tradeCurrency).transferFrom(msg.sender, address(this), strikePrice * tokenAmount);
        }

        // Save the option
        options[optionId] = option;
        optionOwners[optionId] = msg.sender;
        optionId++;

        // Emit an event and return the id of the option
        emit OptionWritten(optionId - 1, msg.sender);
        return optionId - 1;
    }

    // Get the data of an option
    function getOption(uint256 _optionId) public view returns (uint256, string memory, address, address, uint256, uint256, string memory) {
        Option memory option = options[_optionId];
        return (option.expiry, option.status, option.writer, option.tokenAddress, option.tokenAmount, option.strikePrice, option.optionType);
    }

    // Get the owner of an option
    function getOptionOwner(uint256 _optionId) public view returns (address) {
        return optionOwners[_optionId];
    }

    // Allow a option holder to exercise their option
    function exerciseOption(uint256 _optionId) public {
        // Get the data of the option
        Option memory option = options[_optionId];

        // Check that the option may be exercised
        require(option.expiry >= block.timestamp, "Option has expired");
        require(_compareStrings(option.status, "none"), "Option has already been exercised");
        require(optionOwners[_optionId] == msg.sender, "Only the owner of the option may exercise it");

        // If the option is a call, then charge the strike price to receive the tokens,
        // else if the option is a put, transfer their tokens
        if (_compareStrings(option.optionType, "call")) {
            IERC20(tradeCurrency).transferFrom(msg.sender, option.writer, option.strikePrice * option.tokenAmount);
            IERC20(option.tokenAddress).transfer(msg.sender, option.tokenAmount);
        } else {
            IERC20(option.tokenAddress).transferFrom(msg.sender, option.writer, option.tokenAmount);
            IERC20(tradeCurrency).transfer(msg.sender, option.tokenAmount * option.strikePrice);
        }

        // Update the status of the option and emit event
        options[_optionId].status = "exercised";
        emit OptionExercised(_optionId, option.writer, msg.sender);
    }

    // Allow a writer to collect an expired contract
    function collectExpired(uint256 _optionId) public {
        // Get the data of the option
        Option memory option = options[_optionId];

        // Check that the option may be collected
        require(option.expiry < block.timestamp, "Option has not expired yet");
        require(_compareStrings(option.status, "none"), "Option has already been exercised or collected");
        require(option.writer == msg.sender, "Only the writer may collect an expired option");

        // If the option is a call then transfer the tokens back to the writer,
        // otherwise transfer the price back to the writer
        if (_compareStrings(option.optionType, "call")) {
            IERC20(option.tokenAddress).transfer(msg.sender, option.tokenAmount);
        } else {
            IERC20(tradeCurrency).transfer(msg.sender, option.tokenAmount * option.strikePrice);
        }

        // Update the status of the option
        options[_optionId].status = "collected";
    }

    // ============= Marketplace functions =============

    // Open a new trade for selling an option
    function openTrade(uint256 _optionId, uint256 premium) public returns (uint256) {
        // Check that the trade may be opened
        require(optionOwners[_optionId] == msg.sender, "Only the owner of the option may open a trade for it");
        require(_compareStrings(options[_optionId].status, "none"), "Cannot list a used option");

        // Create a new trade
        Trade memory trade = Trade({
            poster: msg.sender,
            optionId: _optionId,
            premium: premium,
            status: "open"
        });

        // Store the new trade
        trades[tradeId] = trade;
        tradeId++;

        // Transfer the option to the contract
        optionOwners[_optionId] = address(this);

        // Emit an event and return the trade id
        emit TradeOpened(tradeId - 1, msg.sender);
        return tradeId - 1;
    }

    // Execute a trade for buying an option
    function executeTrade(uint256 _tradeId) public {
        // Get the trade
        Trade memory trade = trades[_tradeId];

        // Verify that the trade may be executed
        require(_compareStrings(trade.status, "open"), "Only open trades may be executed");
        require(msg.sender != trade.poster, "Trade poster may not execute their own trade, use 'cancelTrade' instead");

        // Transfer the option
        optionOwners[trade.optionId] = msg.sender;

        // Charge the recipient and pay a fee to the owner
        uint256 fee = trade.premium * 3 / 100; 
        uint256 payout = trade.premium - fee;
        IERC20(tradeCurrency).transferFrom(msg.sender, trade.poster, payout);
        IERC20(tradeCurrency).transferFrom(msg.sender, owner, fee);

        // Update the status of the trade
        trades[_tradeId].status = "closed";

        // Emit an event
        emit TradeExecuted(_tradeId, msg.sender);
    }

    // View a trade
    function getTrade(uint256 _tradeId) public view returns (address, uint256, uint256, string memory) {
        Trade memory trade = trades[_tradeId];
        return (trade.poster, trade.optionId, trade.premium, trade.status);
    }

    // Cancel a trade
    function cancelTrade(uint256 _tradeId) public {
        // Get the trade
        Trade memory trade = trades[_tradeId];

        // Check that the trade may be cancelled
        require(trade.poster == msg.sender, "Only the poster may cancel a trade");
        require(!_compareStrings(trade.status, "closed"), "Trade has already been closed");

        // Transfer the option back to the poster
        optionOwners[trade.optionId] = msg.sender;

        // Set status to cancelled
        trades[_tradeId].status = "cancelled";

        // Emit an event
        emit TradeCancelled(_tradeId);
    }
}