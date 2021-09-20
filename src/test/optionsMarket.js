const OptionsMarket = artifacts.require("OptionsMarket");

contract("OptionsMarket", (accounts) => {
    let optionsMarket;

    it("should deploy the contract", async () => {
        optionsMarket = await OptionsMarket.deployed();
    });
});
