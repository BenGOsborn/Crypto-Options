const OptionsMarket = artifacts.require("OptionsMarket");
const { STABLECOIN } = require("../loadEnv");

// Declare stablecoin
const STABLECOIN = process.env.STABLECOIN;

module.exports = function (deployer) {
    deployer.deploy(OptionsMarket, STABLECOIN);
};
