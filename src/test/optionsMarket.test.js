const OptionsMarket = artifacts.require("OptionsMarket");
const IERC20 = artifacts.require("IERC20");
const { BN } = require("@openzeppelin/test-helpers");

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
            stableCoinBal.toString(),
            "Failed to transfer correct amount of stablecoins"
        );
        const tokenAllowance = await token.allowance(
            TOKEN_WHALE,
            optionsMarket.address
        );
        assert.equal(
            tokenAllowance.toString(),
            tokenBal.toString(),
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
        assert.equal(
            option[0].toString(),
            optionParams[1].toString(),
            "Expiry times do not match"
        );
        assert.equal(
            option[2].toString().toLowerCase(),
            TOKEN_WHALE.toString().toLowerCase(),
            "Option writers do not match"
        );
        assert.equal(
            option[3].toString().toLowerCase(),
            optionParams[2].toString().toLowerCase(),
            "Tokens do not match"
        );
        assert.equal(
            option[4].toString(),
            optionParams[3].toString(),
            "Option token amounts do not match"
        );
        assert.equal(
            option[5].toString(),
            optionParams[4].toString(),
            "Prices do not match"
        );
        assert.equal(
            option[6].toString(),
            optionParams[0].toString(),
            "Option types do not match"
        );
    });

    it("should write a new put option", async () => {
        // Get the contract
        const optionsMarket = await OptionsMarket.deployed();

        // Set the options expiry as one day
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
            option[2].toString().toLowerCase(),
            STABLECOIN_WHALE.toString().toLowerCase(),
            "Option writers do not match"
        );
        assert.equal(
            option[3].toString().toLowerCase(),
            optionParams[2].toString().toLowerCase(),
            "Tokens do not match"
        );
        assert.equal(
            option[4].toString(),
            optionParams[3].toString(),
            "Option token amounts do not match"
        );
        assert.equal(
            option[5].toString(),
            optionParams[4].toString(),
            "Prices do not match"
        );
        assert.equal(
            option[6].toString(),
            optionParams[0].toString(),
            "Option types do not match"
        );
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
            trade[0].toString().toLowerCase(),
            TOKEN_WHALE.toString().toLowerCase(),
            "Trade poster is different"
        );
        assert.equal(
            trade[1].toString(),
            tradeParams[0].toString(),
            "OptionId is different"
        );
        assert.equal(
            trade[2].toString(),
            tradeParams[1].toString(),
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
            optionOwner.toString().toLowerCase(),
            STABLECOIN_WHALE.toString().toLowerCase(),
            "Failed to transfer option to buyer"
        );
        assert.equal(
            (await stableCoin.balanceOf(STABLECOIN_WHALE)).toString(),
            stableCoinSC.sub(new BN(tradeParams[1])).toString(),
            "Failed to update buyers funds"
        );
        assert.equal(
            (await stableCoin.balanceOf(TOKEN_WHALE)).toString(),
            tokenSC
                .add(new BN(tradeParams[1]))
                .sub(new BN(Math.floor((tradeParams[1] * 3) / 100)))
                .toString(),
            "Failed to update posters funds"
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
        let tokenSC = await stableCoin.balanceOf(TOKEN_WHALE);
        let tokenT = await token.balanceOf(TOKEN_WHALE);
        let stableCoinSC = await stableCoin.balanceOf(STABLECOIN_WHALE);
        let stableCoinT = await token.balanceOf(STABLECOIN_WHALE);

        // Exercise the call option
        await optionsMarket.exerciseOption(callOptionId, {
            from: STABLECOIN_WHALE,
        });
        assert.equal(
            (await stableCoin.balanceOf(STABLECOIN_WHALE)).toString(),
            stableCoinSC.sub(callOption[5]).toString(),
            "Failed to remove funds from exerciser when call option exercised"
        );
        assert.equal(
            (await stableCoin.balanceOf(TOKEN_WHALE)).toString(),
            tokenSC.add(callOption[5]).toString(),
            "Failed to add funds to writer when call option exercised"
        );
        assert.equal(
            (await token.balanceOf(STABLECOIN_WHALE)).toString(),
            stableCoinT.add(callOption[4]).toString(),
            "Failed to move tokens to exerciser when call option exercised"
        );

        // Update the balances of the accounts
        tokenSC = await stableCoin.balanceOf(TOKEN_WHALE);
        tokenT = await token.balanceOf(TOKEN_WHALE);
        stableCoinSC = await stableCoin.balanceOf(STABLECOIN_WHALE);
        stableCoinT = await token.balanceOf(STABLECOIN_WHALE);

        await optionsMarket.exerciseOption(putOptionId, { from: TOKEN_WHALE });
        assert.equal(
            (await token.balanceOf(TOKEN_WHALE)).toString(),
            tokenT.sub(putOption[4]).toString(),
            "Failed to remove tokens from exerciser when put option exercised"
        );
        assert.equal(
            (await token.balanceOf(STABLECOIN_WHALE)).toString(),
            stableCoinT.add(putOption[4]).toString(),
            "Failed to move tokens to writer when put option exercised"
        );
        assert.equal(
            (await stableCoin.balanceOf(TOKEN_WHALE)).toString(),
            tokenSC.add(putOption[5]).toString(),
            "Failed to add funds to exerciser when put option exercised"
        );

        // Check that the options may not be exercised again
        let exercised;
        try {
            await optionsMarket.exerciseOption(callOptionId, {
                from: STABLECOIN_WHALE,
            });
            exercised = true;
        } catch {
            exercised = false;
        }
        assert.equal(!exercised, true, "Exercised exercised call option");
        try {
            await optionsMarket.exerciseOption(putOptionId, {
                from: TOKEN_WHALE,
            });
            exercised = true;
        } catch {
            exercised = false;
        }
        assert.equal(!exercised, true, "Exercised exercised put option");
    });

    it("should collect the expired options", async () => {
        // Get the contract and tokens
        const optionsMarket = await OptionsMarket.deployed();
        const stableCoin = await IERC20.at(STABLECOIN);
        const token = await IERC20.at(TOKEN);

        // Write a new call option
        let expiry = Math.floor((Date.now() + 5000) / 1000); // Has to be seconds for block.timestamp
        const callOptionParams = ["call", expiry, TOKEN, 10, 20];
        const callTransaction = await optionsMarket.writeOption(
            ...callOptionParams,
            {
                from: TOKEN_WHALE,
            }
        );
        const callOptionId = callTransaction.logs[0].args[0];

        // Write a new put option
        expiry = Math.floor((Date.now() + 5000) / 1000); // Has to be seconds for block.timestamp
        const putOptionParams = ["put", expiry, TOKEN, 10, 20];
        const putTransaction = await optionsMarket.writeOption(
            ...putOptionParams,
            { from: STABLECOIN_WHALE }
        );
        const putOptionId = putTransaction.logs[0].args[0];

        // Get the balances of the whales before redemption
        const tokenT = await token.balanceOf(TOKEN_WHALE);
        const stableCoinSC = await stableCoin.balanceOf(STABLECOIN_WHALE);

        // Wait for the contracts to expire
        await new Promise((r) => setTimeout(r, 8000));

        // Collect the expired options
        await optionsMarket.collectOption(callOptionId, {
            from: TOKEN_WHALE,
        });
        assert.equal(
            (await token.balanceOf(TOKEN_WHALE)).toString(),
            tokenT.add(new BN(callOptionParams[3])),
            "Failed to collect tokens from call option"
        );

        await optionsMarket.collectOption(putOptionId, {
            from: STABLECOIN_WHALE,
        });
        assert.equal(
            await stableCoin.balanceOf(STABLECOIN_WHALE).toString(),
            stableCoinSC.add(new BN(putOptionParams[4])),
            "Failed to collect funds from put option"
        );
    });
});
