require("dotenv").config();
const OptionsMarket = artifacts.require("OptionsMarket");

// Get stablecoin addresses
const STABLECOIN = process.env.STABLECOIN;
const STABLECOIN_WHALE = process.env.STABLECOIN_WHALE;

contract("OptionsMarket", (accounts) => {
    let optionsMarket;

    it("should deploy the contract", async () => {
        optionsMarket = await OptionsMarket.deployed();
    });
});
