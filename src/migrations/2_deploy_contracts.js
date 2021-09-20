require("dotenv").config();
const OptionsMarket = artifacts.require("OptionsMarket");

module.exports = function (deployer) {
    deployer.deploy(OptionsMarket, process.env.STABLECOIN);
};
