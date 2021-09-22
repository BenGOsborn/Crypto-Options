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
            stableCoinAllowance,
            stableCoinBal,
            "Failed to transfer correct amount of stablecoins"
        );
        const tokenAllowance = await token.allowance(
            TOKEN_WHALE,
            optionsMarket.address
        );
        assert.equal(
            tokenAllowance,
            tokenBal,
            "Failed to transfer correct amount of tokens"
        );
    });

    it("should write a new call option", async () => {
        // Get the contract and tokens
        const optionsMarket = await OptionsMarket.deployed();

        // Set the options expiry as one day
        const expiry = Math.floor((Date.now() + 86400000) / 1000); // Has to be seconds for block.timestamp

        // Write a new call option and verify it was successful
        const optionParams = ["call", expiry, TOKEN, 10, 20];
        const transaction = await optionsMarket.writeOption(...optionParams, {
            from: TOKEN_WHALE,
        });
        const optionId = transaction.logs[0].args[0];
        const option = await optionsMarket.getOption(optionId);
        assert.equal(option[0], optionParams[1], "Expiry times do not match");
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
            option[4],
            optionParams[3],
            "Option token amounts do not match"
        );
        assert.equal(option[5], optionParams[4], "Prices do not match");
        assert.equal(option[6], optionParams[0], "Option types do not match");
    });

    it("should write a new put option", async () => {
        // Get the contract
        const optionsMarket = await OptionsMarket.deployed();

        // Set the options expiry as one day
        const today = new Date();
        const expiry = Math.floor((Date.now() + 86400000) / 1000); // Has to be seconds for block.timestamp

        // Write a new put option and verify it was successful
        const optionParams = ["put", expiry, TOKEN, 10, 20];
        const transaction = await optionsMarket.writeOption(...optionParams, {
            from: STABLECOIN_WHALE,
        });
        const optionId = transaction.logs[0].args[0];
        const option = await optionsMarket.getOption(optionId);
        assert.equal(option[0], optionParams[1], "Expiry times do not match");
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
            option[4],
            optionParams[3],
            "Option token amounts do not match"
        );
        assert.equal(option[5], optionParams[4], "Prices do not match");
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
        const tradeId = transaction.logs[0].args[0];
        const trade = await optionsMarket.getTrade(tradeId);
        assert.equal(
            trade[0].toLowerCase(),
            TOKEN_WHALE.toLowerCase(),
            "Trade poster is different"
        );
        assert.equal(trade[1], tradeParams[0], "OptionId is different");
        assert.equal(trade[2], tradeParams[1], "Trade price is different");
        assert.equal(trade[3], "open", "Failed to open trade");

        // Cancel the trade
        await optionsMarket.cancelTrade(tradeId, {
            from: TOKEN_WHALE,
        });
        const cancelledTrade = await optionsMarket.getTrade(tradeId);
        assert.equal(cancelledTrade[3], "cancelled", "Failed to cancel trade");

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

    it("should open a trade and execute it", async () => {
        // Get the contract and tokens
        const optionsMarket = await OptionsMarket.deployed();
        const stableCoin = await IERC20.at(STABLECOIN);

        // Get the balance of the whales
        const stableCoinSC = await stableCoin.balanceOf(STABLECOIN_WHALE);
        const tokenSC = await stableCoin.balanceOf(TOKEN_WHALE);

        // Open a new trade for the call option
        const tradeParams = [0, 200];
        const transaction = await optionsMarket.openTrade(...tradeParams, {
            from: TOKEN_WHALE,
        });
        const tradeId = transaction.logs[0].args[0];

        // Execute the trade
        await optionsMarket.executeTrade(tradeId, { from: STABLECOIN_WHALE });
        const optionOwner = await optionsMarket.getOptionOwner(tradeParams[0]);
        assert.equal(
            optionOwner.toLowerCase(),
            STABLECOIN_WHALE.toLowerCase(),
            "Failed to transfer option to buyer"
        );
        assert.equal(
            await stableCoin.balanceOf(STABLECOIN_WHALE),
            stableCoinSC.sub(tradeParams[0]),
            "Failed to update buyers tokens"
        );
        assert.equal(
            await stableCoin.balanceOf(TOKEN_WHALE),
            tokenSC
                .add(tradeParams[1])
                .sub(Math.floor((tradeParams[1] * 3) / 100))
        );

        // Try and execute the closed trade
        let executed;
        try {
            await optionsMarket.executeTrade(tradeId, {
                from: STABLECOIN_WHALE,
            });
            executed = true;
        } catch {
            executed = false;
        }
        assert.equal(!executed, true, "Closed trade was executed");
    });

    it("should exercise the options", async () => {
        // Get the contract and tokens
        const optionsMarket = await OptionsMarket.deployed();
        const stableCoin = await IERC20.at(STABLECOIN);
        const token = await IERC20.at(TOKEN);

        // Open a new trade for the put option
        const tradeParams = [1, 200];
        const transaction = await optionsMarket.openTrade(...tradeParams, {
            from: STABLECOIN_WHALE,
        });
        const tradeId = transaction.logs[0].args[0];

        // Transfer stable coins to token whale, allow the contract to spend, and close the trade
        await stableCoin.transfer(TOKEN_WHALE, tradeParams[1], {
            from: STABLECOIN_WHALE,
        });
        await stableCoin.approve(optionsMarket.address, tradeParams[1], {
            from: TOKEN_WHALE,
        });
        await optionsMarket.executeTrade(tradeId, { from: TOKEN_WHALE });

        // Get the call option
        const callOptionId = 0;
        const putOptionId = 1;
        const callOption = await optionsMarket.getOption(callOptionId);
        const putOption = await optionsMarket.getOption(putOptionId);

        // Get the balances of the accounts
        const tokenSC = await stableCoin.balanceOf(TOKEN_WHALE);
        const tokenT = await token.balanceOf(TOKEN_WHALE);
        const stableCoinSC = await stableCoin.balanceOf(STABLECOIN_WHALE);
        const stableCoinT = await token.balanceOf(STABLECOIN_WHALE);

        // Exercise the call option
        await optionsMarket.exerciseOption(callOptionId, {
            from: STABLECOIN_WHALE,
        });
        assert.equal(
            await stableCoin.balanceOf(STABLECOIN_WHALE),
            stableCoinSC.sub(callOption[5]),
            "Failed to remove funds from exerciser when call option exercised"
        );
        assert.equal(
            await stableCoin.balanceOf(TOKEN_WHALE),
            tokenSC.add(callOption[5]),
            "Failed to add funds to writer when call option exercised"
        );
        assert.equal(
            await token.balanceOf(STABLECOIN_WHALE),
            stableCoinT.add(callOption[4]),
            "Failed to move tokens to exerciser when call option exercised"
        );

        await optionsMarket.exerciseOption(putOptionId, { from: TOKEN_WHALE });
        assert.equal(
            await token.balanceOf(TOKEN_WHALE),
            tokenT.sub(putOption[4]),
            "Failed to remove tokens from exerciser when put option exercised"
        );
        assert.equal(
            await token.balanceOf(STABLECOIN_WHALE),
            stableCoinT.add(putOption[4]),
            "Failed to move tokens to writer when put option exercised"
        );
        asset.equal(
            await stableCoin.balanceOf(TOKEN_WHALE),
            stableCoinSC.add(putOption[5]),
            "Failed to add funds to exerciser when put option exercised"
        );

        // Check that the options may not be exercised again
    });
});
