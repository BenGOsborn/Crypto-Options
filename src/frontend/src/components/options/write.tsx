import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import Web3 from "web3";
import { getOptionsMarketContract } from "../helpers";

function WriteOption() {
    // Store the web3 data
    const [optionsMarket, setOptionsMarket] = useState<any | null>(null);
    const { active, account } = useWeb3React();
    const web3: Web3 = useWeb3React().library;

    useEffect(() => {
        if (active) {
            getOptionsMarketContract(web3)
                .then((contract) => {
                    // Store the contract in the state
                    setOptionsMarket(contract);
                })
                .catch((e) => console.error(e));
        }
    }, [active]);

    return (
        <div className="mx-auto w-1/4 min-w-min rounded-xl shadow-md p-6">
            <form
                className="flex flex-col space-y-6"
                onSubmit={async (e) => {
                    // Prevent the page from reloading
                    e.preventDefault();

                    // Get contract address
                    const optionsMarketAddress = optionsMarket._address;

                    // Get the amount of option tokens
                    // const;

                    // Check the ERC20 allowances
                    if (optionType === "put") {
                        // Check the trade currency and allocate funds
                        const tradeCurrencyAddress = await optionsMarket.methods
                            .getTradeCurrency()
                            .call();
                        const tradeCurrency = await getERC20Contract(
                            web3,
                            tradeCurrencyAddress
                        );

                        // Check that funds are allocated to contract and if not allocate them
                        await safeTransfer(
                            web3,
                            optionsMarketAddress,
                            account as string,
                            tokenPrice,
                            tradeCurrency
                        );
                    } else {
                        // Get the contract of the token
                        const token = await getERC20Contract(
                            web3,
                            tokenAddress
                        );

                        // Check that tokens are allocated to contract and if not allocate them
                        await safeTransfer(
                            web3,
                            optionsMarketAddress,
                            account as string,
                            tokenAmount,
                            token
                        );
                    }

                    // Create the new option
                    await optionsMarket.methods
                        .writeOption(
                            optionType,
                            expiry,
                            tokenAddress,
                            tokenAmount,
                            tokenPrice
                        )
                        .send({ from: account });

                    // @ts-ignore
                    e.target.reset();
                }}
            >
                <div className="flex space-x-3 justify-between items-center">
                    <fieldset className="flex flex-col space-y-1">
                        <label
                            className="text-gray-900 font-bold"
                            htmlFor="type"
                        >
                            Option Type
                        </label>
                        <div>
                            <select
                                id="type"
                                className="bg-green-500 text-white font-bold rounded py-2 px-3"
                                onChange={(e) => setOptionType(e.target.value)}
                            >
                                <option value="call">Call</option>
                                <option value="put">Put</option>
                            </select>
                        </div>
                    </fieldset>
                    <fieldset className="flex flex-col">
                        <label
                            className="text-gray-900 font-bold"
                            htmlFor="expiry"
                        >
                            Expiry
                        </label>
                        <input
                            type="datetime-local"
                            id="expiry"
                            onChange={(e) => {
                                setExpiry(
                                    new Date(e.target.value).getTime() / 1000
                                );
                            }}
                            required
                        />
                    </fieldset>
                </div>

                <fieldset className="flex flex-col">
                    <label
                        className="text-gray-900 font-bold"
                        htmlFor="tokenAddress"
                    >
                        Token Address
                    </label>
                    <input
                        type="text"
                        name="tokenAddress"
                        id="tokenAddress"
                        placeholder="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
                        required
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        onChange={(e) => setTokenAddress(e.target.value)}
                    />
                    <label
                        className="text-gray-500 text-sm italic mt-2"
                        htmlFor="tokenAddress"
                    >
                        It is recommended you pre-approve the tokens you wish to
                        use to save gas fees
                    </label>
                </fieldset>

                <fieldset className="flex flex-col">
                    <label
                        className="text-gray-900 font-bold whitespace-nowrap"
                        htmlFor="tokenPrice"
                    >
                        Token Price (DAI)
                    </label>
                    <input
                        type="number"
                        name="tokenPrice"
                        id="tokenPrice"
                        placeholder="100"
                        min={0}
                        onChange={(e) => setTokenPrice(e.target.valueAsNumber)}
                        required
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </fieldset>
                <div className="flex flex-row justify-between">
                    <input
                        className="transition duration-100 cursor-pointer bg-green-400 hover:bg-green-500 text-white font-bold rounded py-2 px-8"
                        type="submit"
                        value="Write"
                    />
                    <input
                        className="transition duration-100 cursor-pointer bg-transparent border-gray-500 border hover:border-gray-700 text-gray-500 hover:text-gray-700 font-bold rounded py-2 px-8"
                        type="reset"
                        value="Reset"
                    />
                </div>
            </form>
        </div>
    );
}

export default WriteOption;
