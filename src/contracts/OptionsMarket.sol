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
    mapping(uint256 => Option) private Options;
    mapping(uint256 => address) private OptionOwners;

    // Trade data
    struct Trade {
        address poster;
        uint256 optionId;
        uint256 price;
        string status; // open, closed, cancelled
    }

    uint256 private tradeId;
    mapping(uint256 => Trade) private Trades;
    address private immutable tradeCurrency;

    constructor(address currency) {
        // Set the owner as the deployer of the contract and set the currency of the trades
        owner = msg.sender;
        tradeCurrency = currency;
    }

    // Declare events
    // **** Yikes, what am I going to do about this ?
    event OptionWritten(string indexed optionType, uint256 indexed hoursToExpire, uint256 indexed amount, uint256 indexed price);
    event OptionExercised(uint256 indexed optionId);
    event TradeOpened(uint256 indexed );
    event TradeExecuted();
    event TradeCancelled();

    // ============= Util functions =============

    // Compare if two strings are equal
    function _compareStrings(string memory a, string memory b) private pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    // ============= Option functions =============

    // Allow the address to create a new option
    function writeOption(string memory optionType, uint256 hoursToExpire, address tokenAddress, uint256 amount, uint256 price) public returns (uint256) {
        // Check that the option is valid
        require(_compareStrings(optionType, "call") || _compareStrings(optionType, "put"), "Option type may only be 'call' or 'put'");
        require(hoursToExpire > 0, "Hours to expire must be greater than 0");

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

    // Get the data of an option
    function getOption(uint256 _optionId) public view returns (uint256, string memory, address, uint256, uint256, string memory) {
        Option memory option = Options[_optionId];
        return (option.expiry, option.status, option.tokenAddress, option.amount, option.price, option.optionType);
    }

    // Allow a option holder to exercise their option
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

        // Update the status of the option
        Options[_optionId].status = "exercised";
    }

    // Allow a writer to collect an expired contract
    function collectExpired(uint256 _optionId) public {
        // Get the data of the option
        Option memory option = Options[_optionId];

        // Check that the option may be collected
        require(option.expiry > block.timestamp, "Option has not expired yet");
        require(_compareStrings(option.status, "none"), "Option has already been exercised or collected");
        require(option.writer == msg.sender, "Only the writer may collect an expired option");

        // If the option is a call then transfer the tokens back to the writer,
        // otherwise transfer the price back to the writer
        if (_compareStrings(option.optionType, "call")) {
            IERC20(option.tokenAddress).transfer(msg.sender, option.amount);
        } else {
            IERC20(tradeCurrency).transfer(msg.sender, option.price);
        }

        // Update the status of the option
        Options[_optionId].status = "collected";
    }

    // ============= Marketplace functions =============

    // Open a new trade for selling an option
    function openTrade(uint256 _optionId, uint256 price) public returns (uint256) {
        // Check that the trade may be opened
        require(OptionOwners[_optionId] == msg.sender, "Only the owner of the option may open a trade for it");

        // Create a new trade
        Trade memory trade = Trade({
            poster: msg.sender,
            optionId: _optionId,
            price: price,
            status: "open"
        });

        // Store the new trade
        Trades[tradeId] = trade;
        tradeId++;

        // Return the trade id
        return tradeId - 1;
    }

    // Execute a trade for buying an option
    function executeTrade(uint256 _tradeId) public {
        // Get the trade
        Trade memory trade = Trades[_tradeId];

        // Transfer the option
        OptionOwners[_tradeId] = msg.sender;

        // Charge the recipient and pay a fee to the owner
        uint256 fee = trade.price * 3 / 100; 
        uint256 payout = trade.price - fee;
        IERC20(tradeCurrency).transferFrom(msg.sender, trade.poster, payout);
        IERC20(tradeCurrency).transferFrom(msg.sender, owner, fee);
    }

    // View a trade
    function viewTrade(uint256 _tradeId) public view returns(uint256, uint256, string memory) {
        Trade memory trade = Trades[_tradeId];
        return (trade.optionId, trade.price, trade.status);
    }

    // Cancel a trade
    function cancelTrade(uint256 _tradeId) public {
        // Get the trade
        Trade memory trade = Trades[_tradeId];

        // Check that the poster of the trade is the sender
        require(trade.poster == msg.sender, "Only the poster may cancel a trade");

        // Cancel the trade
        Trades[_tradeId].status = "cancelled";
    }
}