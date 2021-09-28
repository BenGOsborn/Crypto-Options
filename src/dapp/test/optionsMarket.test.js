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
});
