import { useWeb3React } from "@web3-react/core";
import { useContext, useState } from "react";
import Web3 from "web3";
import { DISPLAY_DECIMALS, optionsMarketContext } from "../helpers";
import DisplayOptions from "./display";
import { Option, optionsContext, sellOptionContext } from "./helpers";
import WriteOption from "./write";

function Options() {
    // Store the web3 data
    const [optionsMarket, setOptionsMarket] = useContext(optionsMarketContext);
    const web3: Web3 = useWeb3React().library;
    const { account } = useWeb3React();

    // Store the existing written options by the account
    const [options, setOptions] = useState<Option[]>([]);

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

                            {sellOption.writer === account ? (
                                sellOption.type === "call" ? (
                                    <p className="text-gray-500">
                                        When someone buys your <span className="text-gray-700 font-bold">{sellOption.type}</span> option, they will have the right but not
                                        the obligation to take your {optionsMarket?.unitsPerOption} staked units of {sellOption.tokenAddress} in the option in exchange
                                        for the strike price of DAI per unit in the option.
                                    </p>
                                ) : (
                                    <p className="text-gray-500">
                                        When someone buys your <span className="text-gray-700 font-bold">{sellOption.type}</span> option, they will have the right but not
                                        the obligation to take your{" "}
                                        <span className="text-gray-700 font-bold" title={`${DISPLAY_DECIMALS} d.p`}>
                                            {web3.utils
                                                .toBN(sellOption.strikePrice)
                                                .mul(web3.utils.toBN(10 ** DISPLAY_DECIMALS))
                                                .div(web3.utils.toBN(10).pow(web3.utils.toBN(optionsMarket?.tradeCurrencyDecimals as number)))
                                                .toNumber() /
                                                10 ** DISPLAY_DECIMALS}{" "}
                                            per unit
                                        </span>{" "}
                                        exchanged staked DAI in exchange for{" "}
                                        <span className="text-gray-700 font-bold" title={`1 unit = ${optionsMarket?.tokenAmountPerUnit} base units of token`}>
                                            {optionsMarket?.unitsPerOption} units
                                        </span>{" "}
                                        of{" "}
                                        <span className="text-gray-700 font-bold" title={sellOption.tokenAddress}>
                                            {sellOption.tokenAddress.slice(0, 8)}...
                                        </span>{" "}
                                        token.
                                    </p>
                                )
                            ) : (
                                <p className="text-gray-500">
                                    When someone buys your {sellOption.type} option, you will no longer have the right to exercise this option.
                                </p>
                            )}
                            <p className="text-gray-500 mt-5">Note that we will also take a three percent transaction of the trade price when the trade is executed.</p>
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

                                    // Update the state of the option
                                    setOptions((prev) => prev.filter((opt) => opt.writer === account || opt.id !== sellOption.id));

                                    // Close the modal
                                    setSellOption(null);
                                }}
                            >
                                <fieldset className="flex flex-col my-5">
                                    <label className="text-gray-900 font-bold whitespace-nowrap" htmlFor="tokenPrice" title={`${DISPLAY_DECIMALS} d.p`}>
                                        Premium
                                    </label>
                                    <label className="text-gray-500 text-sm italic" htmlFor="tokenPrice">
                                        This will be the price that the buyer will pay for each unit of the option. Note that each option contains{" "}
                                        <span className="text-gray-700 font-bold">{optionsMarket?.unitsPerOption}</span> units.
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
                <optionsContext.Provider value={[options, setOptions]}>
                    <sellOptionContext.Provider value={[sellOption, setSellOption]}>
                        <DisplayOptions />
                    </sellOptionContext.Provider>
                </optionsContext.Provider>
            </optionsMarketContext.Provider>
        </div>
    );
}

export default Options;
