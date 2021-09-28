const OptionsMarket = artifacts.require("OptionsMarket");
const IERC20 = artifacts.require("IERC20");
const Web3 = require("web3");
const BN = Web3.utils.BN;

contract("OptionsMarket", (accounts) => {
    // Load addresses
    require("dotenv").config();
    const STABLECOIN = process.env.STABLECOIN;
    const STABLECOIN_WHALE = process.env.STABLECOIN_WHALE;
    const TOKEN = process.env.TOKEN;
    const TOKEN_WHALE = process.env.TOKEN_WHALE;

    it("should get the trade currency of the contract", async () => {
        // Get the contract
        const optionsMarket = await OptionsMarket.deployed();

        // Get the trade currency and compare it to the stable coin
        const tradeCurrency = await optionsMarket.getTradeCurrency();
        assert.equal(
            STABLECOIN.toLowerCase(),
            tradeCurrency.toLowerCase().toString(),
            "Trade currency does not natch stablecoin"
        );
    });

    it("should get the balance of the whales and approve the contract as a spender", async () => {
        // Get the contract and tokens
        const optionsMarket = await OptionsMarket.deployed();
        const stableCoin = await IERC20.at(STABLECOIN);
        const token = await IERC20.at(TOKEN);

        // Get the balance of the whales
        const stableCoinSC = await stableCoin.balanceOf(STABLECOIN_WHALE);
        const tokenT = await token.balanceOf(TOKEN_WHALE);

        // Approve the contract to use tokens
        await stableCoin.approve(optionsMarket.address, stableCoinSC, {
            from: STABLECOIN_WHALE,
        });
        await token.approve(optionsMarket.address, tokenT, {
            from: TOKEN_WHALE,
        });

        // Check that the approval was successful
        const stableCoinAllowance = await stableCoin.allowance(
            STABLECOIN_WHALE,
            optionsMarket.address
        );
        assert.equal(
            stableCoinAllowance.toString(),
            stableCoinSC.toString(),
            "Failed to transfer correct amount of stablecoins"
        );

        const tokenAllowance = await token.allowance(
            TOKEN_WHALE,
            optionsMarket.address
        );
        assert.equal(
            tokenAllowance.toString(),
            tokenT.toString(),
            "Failed to transfer correct amount of tokens"
        );
    });
});
