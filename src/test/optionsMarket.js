const OptionsMarket = artifacts.require("OptionsMarket");
const IERC20 = artifacts.require("IERC20");

contract("OptionsMarket", (accounts) => {
    // Load addresses
    require("dotenv").config();
    const STABLECOIN = process.env.STABLECOIN;
    const STABLECOIN_WHALE = process.env.STABLECOIN;
    const TOKEN = process.env.STABLECOIN;
    const TOKEN_WHALE = process.env.STABLECOIN;

    it("should get the balance of the stablecoin and token whales and approve the contract to spend all their tokens", async () => {
        // Get the stable coin, token, and optionsmarket
        const stableCoin = await IERC20.at(STABLECOIN);
        // const token = await IERC20.at(TOKEN);
        const optionsMarket = await OptionsMarket.deployed();

        // Get the balance of the whales
        const stableCoinBal = await stableCoin.balanceOf(STABLECOIN_WHALE);
        // const tokenBal = await token.balanceOf(TOKEN_WHALE);

        // Approve the contract to spend the whales tokens
        await stableCoin.approve(optionsMarket.address, stableCoinBal, {
            from: TOKEN_WHALE,
        });
        // await token.approve(optionsMarket.address, tokenBal, {
        //     from: TOKEN_WHALE,
        // });

        // Check that the allowance matches what was allocated
        const stableCoinAllowance = await stableCoin.allowance(
            STABLECOIN_WHALE,
            optionsMarket.address
        );
        assert.equal(
            stableCoinAllowance.toString(),
            stableCoinBal,
            "Did not transfer correct amount of stable coin"
        );
        // const tokenAllowance = await token.allowance(
        //     TOKEN_WHALE,
        //     optionsMarket.address
        // );
        // assert.equal(
        //     tokenAllowance.toString(),
        //     tokenBal,
        //     "Did not transfer correct amount of token"
        // );
    });

    // it("should write a new option to expire tommorow", async () => {
    //     // Get the expiry date
    //     const today = new Date();
    //     const expiry = new Date(
    //         today.getFullYear(),
    //         today.getMonth(),
    //         today.getDate() + 1
    //     ).getTime();

    //     // Allow the contract to work

    //     // Write the contract
    //     const optionId = await optionsMarket.writeOption.call(
    //         "call",
    //         expiry,
    //         TOKEN,
    //         3,
    //         10
    //     );
    //     console.log(optionId);
    // });
});
