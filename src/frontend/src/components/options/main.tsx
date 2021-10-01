import { useWeb3React } from "@web3-react/core";
import { useContext, useState } from "react";
import Web3 from "web3";
import { DISPLAY_DECIMALS, optionsMarketContext } from "../helpers";
import DisplayOptions from "./display";
import { Option, sellOptionContext } from "./helpers";
import WriteOption from "./write";

function Options() {
    // Store the web3 data
    const [optionsMarket, setOptionsMarket] = useContext(optionsMarketContext);
    const web3: Web3 = useWeb3React().library;
    const { account } = useWeb3React();

    // Store the option to sell
    const [sellOption, setSellOption] = useState<Option | null>(null);
    const [optionPremium, setOptionPremium] = useState<number>(0);

    return (
        <div className="Options">
            <div className="popup">
                {sellOption !== null ? (
                    <div className="bg-black bg-opacity-80 fixed inset-0 flex items-center justify-center">
                        <div className="mx-auto sm:w-2/5 w-4/5 min-w-min bg-white rounded-xl shadow-md p-6">
                            <h2 className="font-bold text-xl uppercase text-gray-900">Sell Option</h2>
                            {sellOption.type === "call" ? (
                                sellOption.writer === account ? (
                                    <p className="text-gray-500">
                                        When someone buys your <span className="text-gray-700 font-bold">call</span> option, they will have the right, but not the
                                        obligation to exercise that option for the strike price of{" "}
                                        <span className="text-gray-700 font-bold" title={`${DISPLAY_DECIMALS} d.p`}>
                                            {(
                                                web3.utils
                                                    .toBN(sellOption.strikePrice)
                                                    .mul(web3.utils.toBN(10 ** DISPLAY_DECIMALS))
                                                    .div(web3.utils.toBN(10).pow(web3.utils.toBN(optionsMarket?.tradeCurrencyDecimals as number)))
                                                    .toNumber() /
                                                10 ** DISPLAY_DECIMALS
                                            ).toString()}{" "}
                                            DAI
                                        </span>{" "}
                                        and you will receive{" "}
                                        <span className="text-gray-700 font-bold">
                                            {optionsMarket?.unitsPerOption} <span title={`${optionsMarket?.tokenAmountPerUnit} base tokens`}>units</span>
                                        </span>{" "}
                                        of{" "}
                                        <span className="text-gray-700 font-bold" title={sellOption.tokenAddress}>
                                            {sellOption.tokenAddress.slice(0, 8)}...
                                        </span>{" "}
                                        token. Note that we will also take a three percent transaction of the trade price when the trade is executed.
                                    </p>
                                ) : (
                                    <p className="text-gray-500">
                                        When someone buys your option, they will have the right to exercise that option for the strike price you set for the option. Note
                                        that we will also take a three percent transaction of the trade price when the trade is executed.
                                    </p>
                                )
                            ) : sellOption.writer === account ? (
                                <p className="text-gray-500">
                                    When someone buys your <span className="text-gray-700 font-bold">call</span> option, they will have the right, but not the obligation
                                    to exercise that option for the strike price of{" "}
                                    <span className="text-gray-700 font-bold" title={`${DISPLAY_DECIMALS} d.p`}>
                                        {(
                                            web3.utils
                                                .toBN(sellOption.strikePrice)
                                                .mul(web3.utils.toBN(10 ** DISPLAY_DECIMALS))
                                                .div(web3.utils.toBN(10).pow(web3.utils.toBN(optionsMarket?.tradeCurrencyDecimals as number)))
                                                .toNumber() /
                                            10 ** DISPLAY_DECIMALS
                                        ).toString()}{" "}
                                        DAI
                                    </span>{" "}
                                    and you will receive{" "}
                                    <span className="text-gray-700 font-bold">
                                        {optionsMarket?.unitsPerOption} <span title={`${optionsMarket?.tokenAmountPerUnit} base tokens`}>units</span>
                                    </span>{" "}
                                    of{" "}
                                    <span className="text-gray-700 font-bold" title={sellOption.tokenAddress}>
                                        {sellOption.tokenAddress.slice(0, 8)}...
                                    </span>{" "}
                                    token. Note that we will also take a three percent transaction of the trade price when the trade is executed.
                                </p>
                            ) : (
                                <p className="text-gray-500">
                                    When someone buys your option, they will have the right to exercise that option for the strike price you set for the option. Note that
                                    we will also take a three percent transaction of the trade price when the trade is executed.
                                </p>
                            )}
                            <form
                                onSubmit={async (e) => {
                                    // Prevent page from reloading
                                    e.preventDefault();
                                    // Open an order for the option
                                    await optionsMarket?.optionsMarket.methods
                                        .openTrade(
                                            sellOption.id,
                                            web3.utils
                                                .toBN(Math.floor(optionPremium * 10 ** DISPLAY_DECIMALS))
                                                .mul(web3.utils.toBN(10).pow(web3.utils.toBN(optionsMarket?.tradeCurrencyDecimals)))
                                                .div(web3.utils.toBN(10).pow(web3.utils.toBN(DISPLAY_DECIMALS)))
                                        )
                                        .send({ from: account });
                                    // Close the modal
                                    setSellOption(null);
                                }}
                            >
                                <fieldset className="flex flex-col my-5">
                                    <label className="text-gray-900 font-bold whitespace-nowrap" htmlFor="tokenPrice" title={`${DISPLAY_DECIMALS} d.p`}>
                                        Premium
                                    </label>
                                    <input
                                        type="number"
                                        name="tokenPrice"
                                        id="tokenPrice"
                                        placeholder="2.00"
                                        step="any"
                                        min={0}
                                        onChange={(e) => setOptionPremium(e.target.valueAsNumber)}
                                        required
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </fieldset>
                                <div className="flex flex-row justify-between items-stretch sm:flex-row flex-col sm:space-y-0 space-y-4 sm:space-x-4">
                                    <input
                                        className="transition duration-100 cursor-pointer bg-green-400 hover:bg-green-500 text-white font-bold rounded py-2 px-16"
                                        type="submit"
                                        value="Sell"
                                    />
                                    <button
                                        onClick={(e) => {
                                            setSellOption(null);
                                        }}
                                        className="transition duration-100 cursor-pointer bg-transparent border-gray-500 border hover:border-gray-700 text-gray-500 hover:text-gray-700 font-bold rounded py-2 px-8"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : null}
            </div>
            <optionsMarketContext.Provider value={[optionsMarket, setOptionsMarket]}>
                <WriteOption />
                <sellOptionContext.Provider value={[sellOption, setSellOption]}>
                    <DisplayOptions />
                </sellOptionContext.Provider>
            </optionsMarketContext.Provider>
        </div>
    );
}

export default Options;
