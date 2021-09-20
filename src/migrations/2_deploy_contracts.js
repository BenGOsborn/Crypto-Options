require("dotenv").config();
const OptionsMarket = artifacts.require("OptionsMarket");

// Declare stablecoin
const STABLECOIN = process.env.STABLECOIN;

module.exports = function (deployer) {
    deployer.deploy(OptionsMarket, STABLECOIN);
};
