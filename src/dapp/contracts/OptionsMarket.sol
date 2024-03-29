// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract OptionsMarket {
    // Declare events for logging data
    event OptionWritten(uint256 optionId, address indexed writer);
    event OptionExercised(uint256 optionId, address indexed writer, address indexed exerciser);
    event TradeOpened(uint256 tradeId, address indexed poster);
    event TradeExecuted(uint256 tradeId, address indexed buyer);
    event TradeCancelled(uint256 tradeId);

    // Admin access
    address private owner;
    bool private enabled;

    // Option data
    struct Option {
        uint256 expiry;
        string status; // none, exercised, collected
        address writer;
        address tokenAddress;
        uint256 strikePrice;
        string optionType; // call, put
    }

    uint256 private constant TOKEN_AMOUNT_PER_UNIT = 1e18;
    uint8 private constant UNITS_PER_OPTION = 100;

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
        // Set the owner as the deployer of the contract, set the currency of the trades, and set enabled to true
        owner = msg.sender;
        tradeCurrency = currency;
        enabled = true;
    }

    // ============= Admin functions =============

    // Enable/disable the ability to write or trade options (use when migrating to new contract)
    function ownerSetContractEnabled(bool _enabled) external {
        require(msg.sender == owner, "Only the owner may enable/disable the contract");
        enabled = _enabled;
    }

    // Transfer ownership of the contract to another owner
    function ownerTransferOwnership() external {
        require(msg.sender == owner, "Only the owner may transfer ownership of the contract"); 
        owner = msg.sender;
    }

    // ============= Util functions =============

    // Compare if two strings are equal
    function _compareStrings(string memory a, string memory b) private pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    // Get the trade currency of the token
    function getTradeCurrency() external view returns (address) {
        return tradeCurrency;
    }

    // Get the number of base units per unit for each token
    function getTokenAmountPerUnit() external pure returns (uint256) {
        return TOKEN_AMOUNT_PER_UNIT;
    }

    // Get the number of units contained in each option
    function getUnitsPerOption() external pure returns (uint8) {
        return UNITS_PER_OPTION;
    }

    // Check the state of the contract
    function contractEnabled() external view returns (bool) {
        return enabled;
    }

    // ============= Option functions =============

    // Allow the address to create a new option
    function writeOption(string calldata optionType, uint256 expiry, address tokenAddress, uint256 strikePrice) external returns (uint256) {
        // Make the expiry weekly every friday
        uint256 expiryTemp = expiry / (7 days);
        uint256 optionExpiry = expiryTemp * (7 days) + 2 days;
        
        // Check that the option is valid
        require(enabled, "Contract is currently disabled");
        require(_compareStrings(optionType, "call") || _compareStrings(optionType, "put"), "Option type may only be 'call' or 'put'");
        require(optionExpiry > block.timestamp, "Expiry must be in the future");

        // Write a new option
        Option memory option = Option({
            expiry: optionExpiry,
            status: "none",
            writer: msg.sender,
            tokenAddress: tokenAddress,
            strikePrice: strikePrice,
            optionType: optionType
        });

        // If this is a call then transfer the amount of the token to the contract,
        // otherwise transfer the trade currency x strike price to the contract
        if (_compareStrings(optionType, "call")) {
            IERC20(tokenAddress).transferFrom(msg.sender, address(this), TOKEN_AMOUNT_PER_UNIT * UNITS_PER_OPTION); 
        } else {
            IERC20(tradeCurrency).transferFrom(msg.sender, address(this), strikePrice * UNITS_PER_OPTION);
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
    function getOption(uint256 _optionId) external view returns (uint256, string memory, address, address, uint256, string memory) {
        Option memory option = options[_optionId];
        return (option.expiry, option.status, option.writer, option.tokenAddress, option.strikePrice, option.optionType);
    }

    // Get the owner of an option
    function getOptionOwner(uint256 _optionId) external view returns (address) {
        return optionOwners[_optionId];
    }

    // Allow a option holder to exercise their option
    function exerciseOption(uint256 _optionId) external {
        // Get the data of the option
        Option memory option = options[_optionId];

        // Check that the option may be exercised
        require(option.expiry >= block.timestamp, "Option has expired");
        require(_compareStrings(option.status, "none"), "Option has already been exercised");
        require(optionOwners[_optionId] == msg.sender, "Only the owner of the option may exercise it");

        // If the option is a call, then charge the strike price x num tokens to receive the tokens,
        // else if the option is a put, transfer their tokens
        if (_compareStrings(option.optionType, "call")) {
            IERC20(tradeCurrency).transferFrom(msg.sender, option.writer, option.strikePrice * UNITS_PER_OPTION);
            IERC20(option.tokenAddress).transfer(msg.sender, UNITS_PER_OPTION * TOKEN_AMOUNT_PER_UNIT);
        } else {
            IERC20(option.tokenAddress).transferFrom(msg.sender, option.writer, UNITS_PER_OPTION * TOKEN_AMOUNT_PER_UNIT);
            IERC20(tradeCurrency).transfer(msg.sender, option.strikePrice * UNITS_PER_OPTION);
        }

        // Update the status of the option and emit event
        options[_optionId].status = "exercised";
        emit OptionExercised(_optionId, option.writer, msg.sender);
    }

    // Allow a writer to collect an expired contract
    function collectExpired(uint256 _optionId) external {
        // Get the data of the option
        Option memory option = options[_optionId];

        // Check that the option may be collected
        require(option.expiry < block.timestamp, "Option has not expired yet");
        require(_compareStrings(option.status, "none"), "Option has already been exercised or collected");
        require(option.writer == msg.sender, "Only the writer may collect an expired option");

        // If the option is a call then transfer the tokens back to the writer,
        // otherwise transfer the strike price x num tokens back to the writer
        if (_compareStrings(option.optionType, "call")) {
            IERC20(option.tokenAddress).transfer(msg.sender, UNITS_PER_OPTION * TOKEN_AMOUNT_PER_UNIT);
        } else {
            IERC20(tradeCurrency).transfer(msg.sender, option.strikePrice * UNITS_PER_OPTION);
        }

        // Update the status of the option
        options[_optionId].status = "collected";
    }

    // ============= Marketplace functions =============

    // Open a new trade for selling an option
    function openTrade(uint256 _optionId, uint256 premium) external returns (uint256) {
        // Check that the trade may be opened
        require(enabled, "Contract is currently disabled");
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
    function executeTrade(uint256 _tradeId) external {
        // Get the trade
        Trade memory trade = trades[_tradeId];

        // Verify that the trade may be executed
        require(enabled, "Contract is currently disabled");
        require(_compareStrings(trade.status, "open"), "Only open trades may be executed");
        require(msg.sender != trade.poster, "Trade poster may not execute their own trade, use 'cancelTrade' instead");

        // Charge the recipient and pay a fee to the owner
        uint256 fee = trade.premium * UNITS_PER_OPTION * 3 / 100; 
        uint256 payout = trade.premium * UNITS_PER_OPTION - fee;
        IERC20(tradeCurrency).transferFrom(msg.sender, trade.poster, payout);
        IERC20(tradeCurrency).transferFrom(msg.sender, owner, fee);

        // Transfer the option
        optionOwners[trade.optionId] = msg.sender;

        // Update the status of the trade
        trades[_tradeId].status = "closed";

        // Emit an event
        emit TradeExecuted(_tradeId, msg.sender);
    }

    // View a trade
    function getTrade(uint256 _tradeId) external view returns (address, uint256, uint256, string memory) {
        Trade memory trade = trades[_tradeId];
        return (trade.poster, trade.optionId, trade.premium, trade.status);
    }

    // Cancel a trade
    function cancelTrade(uint256 _tradeId) external {
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