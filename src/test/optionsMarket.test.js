const OptionsMarket = artifacts.require("OptionsMarket");
const IERC20 = artifacts.require("IERC20");

contract("OptionsMarket", (accounts) => {
    // Load addresses
    require("dotenv").config();
    const STABLECOIN = process.env.STABLECOIN;
    const STABLECOIN_WHALE = process.env.STABLECOIN_WHALE;
    const TOKEN = process.env.TOKEN;
    const TOKEN_WHALE = process.env.TOKEN_WHALE;

    it("should get the balance of the whales and approve the contract as a spender", async () => {
        // Get the contract and tokens
        const optionsMarket = await OptionsMarket.deployed();
        const stableCoin = await IERC20.at(STABLECOIN);
        const token = await IERC20.at(TOKEN);

        // Get the balance of the whales
        const stableCoinBal = await stableCoin.balanceOf(STABLECOIN_WHALE);
        const tokenBal = await token.balanceOf(TOKEN_WHALE);

        // Approve the contract to use tokens
        await stableCoin.approve(optionsMarket.address, stableCoinBal, {
            from: STABLECOIN_WHALE,
        });
        await token.approve(optionsMarket.address, tokenBal, {
            from: TOKEN_WHALE,
        });

        // Check that the approval was successful
        const stableCoinAllowance = await stableCoin.allowance(
            STABLECOIN_WHALE,
            optionsMarket.address
        );
        assert.equal(
            stableCoinAllowance.toString(),
            stableCoinBal,
            "Failed to transfer correct amount of stablecoins"
        );
        const tokenAllowance = await token.allowance(
            TOKEN_WHALE,
            optionsMarket.address
        );
        assert.equal(
            tokenAllowance.toString(),
            tokenBal,
            "Failed to transfer correct amount of tokens"
        );
    });

    it("should write a new call option", async () => {
        // Get the contract and tokens
        const optionsMarket = await OptionsMarket.deployed();

        // Set the options expiry as one day
        const today = new Date();
        const expiry = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1
        ).getTime();

        // Write a new call option and verify it was successful
        const optionParams = ["call", expiry, TOKEN, 10, 20];
        const transaction = await optionsMarket.writeOption(...optionParams, {
            from: TOKEN_WHALE,
        });
        const optionId = transaction.logs[0].args[0].toString();
        const option = await optionsMarket.getOption(optionId);
        assert.equal(
            option[0].toString(),
            optionParams[1],
            "Expiry times do not match"
        );
        assert.equal(
            option[2].toLowerCase(),
            TOKEN_WHALE.toLowerCase(),
            "Option writers do not match"
        );
        assert.equal(
            option[3].toLowerCase(),
            optionParams[2].toLowerCase(),
            "Tokens do not match"
        );
        assert.equal(
            option[4].toString(),
            optionParams[3],
            "Option token amounts do not match"
        );
        assert.equal(
            option[5].toString(),
            optionParams[4],
            "Prices do not match"
        );
        assert.equal(option[6], optionParams[0], "Option types do not match");
    });

    it("should write a new put option", async () => {
        // Get the contract
        const optionsMarket = await OptionsMarket.deployed();

        // Set the options expiry as one day
        const today = new Date();
        const expiry = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1
        ).getTime();

        // Write a new put option and verify it was successful
        const optionParams = ["put", expiry, TOKEN, 10, 20];
        const transaction = await optionsMarket.writeOption(...optionParams, {
            from: STABLECOIN_WHALE,
        });
        const optionId = transaction.logs[0].args[0].toString();
        const option = await optionsMarket.getOption(optionId);
        assert.equal(
            option[0].toString(),
            optionParams[1],
            "Expiry times do not match"
        );
        assert.equal(
            option[2].toLowerCase(),
            STABLECOIN_WHALE.toLowerCase(),
            "Option writers do not match"
        );
        assert.equal(
            option[3].toLowerCase(),
            optionParams[2].toLowerCase(),
            "Tokens do not match"
        );
        assert.equal(
            option[4].toString(),
            optionParams[3],
            "Option token amounts do not match"
        );
        assert.equal(
            option[5].toString(),
            optionParams[4],
            "Prices do not match"
        );
        assert.equal(option[6], optionParams[0], "Option types do not match");
    });

    it("should open a trade and then cancel it", async () => {
        // Get the contract
        const optionsMarket = await OptionsMarket.deployed();

        // Open a new trade
        const tradeParams = [0, 200];
        const transaction = await optionsMarket.openTrade(...tradeParams, {
            from: TOKEN_WHALE,
        });
        const tradeId = transaction.logs[0].args[0].toString();
        const trade = await optionsMarket.getTrade(tradeId);
        assert.equal(
            trade[0].toLowerCase(),
            TOKEN_WHALE.toLowerCase(),
            "Trade poster is different"
        );
        assert.equal(
            trade[1].toString(),
            tradeParams[0],
            "OptionId is different"
        );
        assert.equal(
            trade[2].toString(),
            tradeParams[1],
            "Trade price is different"
        );
        assert.equal(trade[3].toString(), "open", "Failed to open trade");

        // Cancel the trade
        await optionsMarket.cancelTrade(tradeId, {
            from: TOKEN_WHALE,
        });
        const cancelledTrade = await optionsMarket.getTrade(tradeId);
        assert.equal(
            cancelledTrade[3].toString(),
            "cancelled",
            "Failed to cancel trade"
        );

        // Try and execute the cancelled trade
        let executed;
        try {
            await optionsMarket.executeTrade(tradeId, {
                from: STABLECOIN_WHALE,
            });
            executed = true;
        } catch {
            executed = false;
        }
        assert.equal(!executed, true, "Cancelled trade was executed");
    });

    it("should open a trade and execute it", async () => {});

    it("should exercise a call option", async () => {});
});
