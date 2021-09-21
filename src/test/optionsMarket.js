const OptionsMarket = artifacts.require("OptionsMarket");
const IERC20 = artifacts.require("IERC20");

contract("OptionsMarket", (accounts) => {
    // Load addresses
    require("dotenv").config();
    const STABLECOIN = process.env.STABLECOIN;
    const STABLECOIN_WHALE = process.env.STABLECOIN_WHALE;

    it("should get the balance of the stablecoin and token whales and approve the contract to spend all their tokens", async () => {
        console.log(STABLECOIN, STABLECOIN_WHALE);

        const coin = await IERC20.at(STABLECOIN);
        const bal = await coin.balanceOf(STABLECOIN_WHALE);

        await coin.transfer(accounts[0], bal, {
            from: STABLECOIN_WHALE,
        });
    });
});
