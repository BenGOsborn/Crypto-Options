const OptionsMarket = artifacts.require("OptionsMarket");

module.exports = function (deployer) {
    require("dotenv").config();
    deployer.deploy(OptionsMarket, process.env.STABLECOIN);
};
