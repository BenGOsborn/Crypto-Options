require("dotenv").config();
const optionsMarket = artifacts.require("OptionsMarket");

// Store DAI address
const STABLECOIN = process.env.STABLECOIN;
const STABLECOIN_WHALE = process.env.STABLECOIN_WHALE;

contract("OptionsMarket", (accounts) => {});
