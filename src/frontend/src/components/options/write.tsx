import { useWeb3React } from "@web3-react/core";
import { useContext, useState } from "react";
import Web3 from "web3";
import { checkTransfer, DISPLAY_DECIMALS, getERC20Contract } from "../helpers";
import { optionsMarketContext } from "../helpers";

function WriteOption() {
    // Store the web3 data
    const [optionsMarket, setOptionsMarket] = useContext(optionsMarketContext);
    const { account } = useWeb3React();
    const web3: Web3 = useWeb3React().library;

    // Store the write option state
    const [optionType, setOptionType] = useState<string>("call");
    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [expiry, setExpiry] = useState<number>(0);
    const [strikePrice, setStrikePrice] = useState<number>(0);

    return (
        <div className="mx-auto w-1/4 min-w-min rounded-xl shadow-md p-6">
            <form
                className="flex flex-col space-y-6"
                onSubmit={async (e) => {
                    // Prevent the page from reloading and make sure this function may be called
                    e.preventDefault();
                    if (optionsMarket === null) return;

                    // Check the ERC20 allowances
                    if (optionType === "put") {
                        // Check that funds are allocated to contract and if not allocate them
                        await checkTransfer(
                            web3,
                            optionsMarket?.address,
                            account as string,
                            web3.utils
                                .toBN(Math.floor(strikePrice * 10 ** DISPLAY_DECIMALS))
                                .mul(web3.utils.toBN(optionsMarket?.unitsPerOption))
                                .mul(web3.utils.toBN(10).pow(web3.utils.toBN(optionsMarket?.tradeCurrencyDecimals)))
                                .div(web3.utils.toBN(10).pow(web3.utils.toBN(DISPLAY_DECIMALS)))
                                .toString(),
                            optionsMarket?.tradeCurrency
                        );
                    } else {
                        // Get the contract of the token
                        const token = await getERC20Contract(web3, tokenAddress);

                        // Check that tokens are allocated to contract and if not allocate them
                        await checkTransfer(
                            web3,
                            optionsMarket?.address,
                            account as string,
                            web3.utils.toBN(optionsMarket?.tokenAmountPerUnit).mul(web3.utils.toBN(optionsMarket?.unitsPerOption)).toString(),
                            token
                        );
                    }

                    // Create the new option
                    const parsedExpiry = (new Date(expiry).getTime() + 5 * 8.64e7) / 1000;
                    await optionsMarket?.optionsMarket.methods
                        .writeOption(
                            optionType,
                            parsedExpiry,
                            tokenAddress,
                            web3.utils.toBN(Math.floor(strikePrice * 10 ** optionsMarket?.tradeCurrencyDecimals)).toString()
                        )
                        .send({ from: account });

                    // @ts-ignore
                    e.target.reset();
                }}
            >
                <div className="flex space-x-3 justify-between items-center">
                    <fieldset className="flex flex-col space-y-1">
                        <label className="text-gray-900 font-bold" htmlFor="type">
                            Option Type
                        </label>
                        <div>
                            <select id="type" className="bg-green-500 text-white font-bold rounded py-2 px-3" onChange={(e) => setOptionType(e.target.value)}>
                                <option value="call">Call</option>
                                <option value="put">Put</option>
                            </select>
                        </div>
                    </fieldset>
                    <fieldset className="flex flex-col">
                        <label className="text-gray-900 font-bold" htmlFor="expiry">
                            Expiry
                        </label>
                        <input
                            type="week"
                            id="expiry"
                            onChange={(e) => {
                                setExpiry((e.target.valueAsDate as Date).getTime());
                            }}
                            required
                        />
                    </fieldset>
                </div>

                <fieldset className="flex flex-col">
                    <label className="text-gray-900 font-bold" htmlFor="tokenAddress">
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
                    <label className="text-gray-500 text-sm italic mt-2" htmlFor="tokenAddress">
                        It is recommended you pre-approve the tokens you wish to use to save gas fees
                    </label>
                </fieldset>

                <fieldset className="flex flex-col">
                    <label className="text-gray-900 font-bold whitespace-nowrap" htmlFor="tokenPrice" title={`${DISPLAY_DECIMALS} d.p`}>
                        Strike Price (DAI)
                    </label>
                    <input
                        type="number"
                        name="tokenPrice"
                        id="tokenPrice"
                        placeholder="2.00"
                        step="any"
                        min={0}
                        onChange={(e) => setStrikePrice(e.target.valueAsNumber)}
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
