const OptionsMarket = artifacts.require("OptionsMarket");
const IERC20 = artifacts.require("IERC20");

contract("OptionsMarket", (accounts) => {
    // Load addresses
    require("dotenv").config();
    const STABLECOIN = process.env.STABLECOIN;
    const STABLECOIN_WHALE = process.env.STABLECOIN_WHALE;
    const TOKEN = process.env.TOKEN;
    const TOKEN_WHALE = process.env.TOKEN_WHALE;

    it("should get the balance of the whales and approve the contract as a spender", async () => {
        // Get the contract and tokens
        const optionsMarket = await OptionsMarket.deployed();
        const stableCoin = await IERC20.at(STABLECOIN);
        const token = await IERC20.at(TOKEN);

        // Get the balance of the whales
        const stableCoinBal = await stableCoin.balanceOf(STABLECOIN_WHALE);
        const tokenBal = await token.balanceOf(TOKEN_WHALE);
        console.log(`Stable coins: ${stableCoinBal}\nTokens: ${tokenBal}`);

        // Approve the contract to use tokens
        await stableCoin.approve(optionsMarket.address, stableCoinBal, {
            from: STABLECOIN_WHALE,
        });
        await token.approve(optionsMarket.address, tokenBal, {
            from: TOKEN_WHALE,
        });

        // Check that the approval was successful
        const stableCoinAllowance = await stableCoin.allowance(
            STABLECOIN_WHALE,
            optionsMarket.address
        );
        assert.equal(
            stableCoinAllowance.toString(),
            stableCoinBal,
            "Failed to transfer correct amount of stablecoins"
        );
        const tokenAllowance = await token.allowance(
            TOKEN_WHALE,
            optionsMarket.address
        );
        assert.equal(
            tokenAllowance.toString(),
            tokenBal,
            "Failed to transfer correct amount of tokens"
        );
    });

    it("Should write a new call option", async () => {
        // Get the contract and tokens
        const optionsMarket = await OptionsMarket.deployed();

        // Set the options expiry as one day
        const today = new Date();
        const expiry = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1
        ).getTime();

        // Write the new contract
        const optionId = await optionsMarket.writeOption(
            "call",
            expiry,
            TOKEN,
            10,
            20,
            { from: TOKEN_WHALE }
        );
        console.log(optionId);
        for (const log of optionId.logs) {
            if (log.event === "OptionWritten") {
                console.log(log.args[0].toString());
            }
        }
    });
});
