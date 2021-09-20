require("dotenv").config();
const optionsMarket = artifacts.require("OptionsMarket");

// Get stablecoin addresses
const STABLECOIN = process.env.STABLECOIN;
const STABLECOIN_WHALE = process.env.STABLECOIN_WHALE;

contract("OptionsMarket", (accounts) => {
    it("should deploy the contract");
});
