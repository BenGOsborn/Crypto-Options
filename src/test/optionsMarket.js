const OptionsMarket = artifacts.require("OptionsMarket");
const IERC20 = artifacts.require("IERC20");
const {
    STABLECOIN,
    STABLECOIN_WHALE,
    TOKEN,
    TOKEN_WHALE,
} = require("../loadEnv");

contract("OptionsMarket", (accounts) => {
    let optionsMarket;
    let stableCoin;
    let token;

    it("should verify the contract deployed", async () => {
        optionsMarket = await OptionsMarket.deployed();
        stableCoin = await IERC20.at(STABLECOIN);
        token = await IERC20.at(TOKEN);
    });

    it("should write a new option to expire tommorow", async () => {
        // Get the expiry date
        const today = new Date();
        const expiry = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1
        ).getTime();

        // Allow the contract to work

        // Write the contract
        const optionId = await optionsMarket.writeOption.call(
            "call",
            expiry,
            TOKEN,
            3,
            10
        );
        console.log(optionId);
    });
});
