const OptionsMarket = artifacts.require("OptionsMarket");
const { STABLECOIN } = require("../loadEnv");

module.exports = function (deployer) {
    deployer.deploy(OptionsMarket, STABLECOIN);
};
