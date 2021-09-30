import { useWeb3React } from "@web3-react/core";
import { useEffect, useState, useContext } from "react";
import Web3 from "web3";
import {
    getOptionsMarketContract,
    getERC20Contract,
    checkTransfer,
} from "../helpers";
import { Option, sellOptionContext } from "./helpers";

interface SearchFilter {
    optionType: "call" | "put" | "any";
    tokenAddress: string;
    showUnavailable: boolean;
    writtenByUser: "true" | "false" | "any";
    expiryDateStart: number;
    expiryDateEnd: number;
}

function DisplayOptions() {
    // Store the web3 data
    const [optionsMarket, setOptionsMarket] = useState<any | null>(null);
    const { active, account } = useWeb3React();
    const web3: Web3 = useWeb3React().library;

    // Store the existing written options by the account
    const [options, setOptions] = useState<Option[]>([]);

    // Used for filtering
    const [searchFilter, setSearchFilter] = useState<SearchFilter>({
        optionType: "any",
        showUnavailable: false,
        tokenAddress: "",
        writtenByUser: "any",
        expiryDateStart: 0,
        expiryDateEnd: Date.now() + 3.154e12,
    });

    // Option to sell
    const [sellOption, setSellOption] = useContext(sellOptionContext);

    useEffect(() => {
        if (active) {
            // Store the options market contract and listen for events
            getOptionsMarketContract(web3)
                .then((contract) => {
                    // Store the contract in the state
                    setOptionsMarket(contract);

                    // Add event listener for options written by the user
                    contract.events
                        .OptionWritten({
                            fromBlock: 0,
                            filter: {
                                writer: account,
                            },
                        })
                        .on("data", async (event: any) => {
                            // Get the option and add it to the list
                            const optionId = event.returnValues.optionId;
                            const option = await contract.methods
                                .getOption(optionId)
                                .call();
                            const owner = await contract.methods
                                .getOptionOwner(optionId)
                                .call();

                            const newOption: Option = {
                                id: optionId,
                                expiry: option[0] * 1000,
                                status: option[1],
                                writer: option[2],
                                owner,
                                tokenAddress: option[3],
                                strikePrice: option[4],
                                type: option[5],
                            };
                            setOptions((prev) => [...prev, newOption]);
                        });

                    // Add events for options traded that belong to the user
                    contract.events
                        .TradeExecuted({
                            fromBlock: 0,
                            filter: {
                                buyer: account,
                            },
                        })
                        .on("data", async (event: any) => {
                            // Get the option and add it to the list
                            const optionId = event.returnValues.optionId;
                            const option = await contract.methods
                                .getOption(optionId)
                                .call();
                            const owner = await contract.methods
                                .getOptionOwner(optionId)
                                .call();

                            // Only add the option if it is owned and the id is not within the list
                            if (owner === account) {
                                let contains = false;
                                for (const opt of options) {
                                    if (opt.id === optionId) {
                                        contains = true;
                                        break;
                                    }
                                }
                                if (!contains) {
                                    const newOption: Option = {
                                        id: optionId,
                                        expiry: option[0] * 1000,
                                        status: option[1],
                                        writer: option[2],
                                        owner,
                                        tokenAddress: option[3],
                                        strikePrice: option[4],
                                        type: option[5],
                                    };
                                    setOptions((prev) => [...prev, newOption]);
                                }
                            }
                        });
                })
                .catch((err: any) => console.error(err));
        }
    }, [active]);

    return (
        <div className="overflow-x-auto sm:w-3/5 w-11/12 mx-auto mt-16 rounded-xl shadow-md p-6">
            <form
                className="pb-6 mb-6 flex flex-wrap min-w-min justify-evenly lg:items-start items-center space-x-4 border-b-4 border-gray-100"
                style={{ minWidth: 500 }}
            >
                <fieldset className="flex flex-col space-x-1 space-y-2 justify-center items-center">
                    <label htmlFor="type" className="text-gray-900 font-bold">
                        Option Type
                    </label>
                    <select
                        id="type"
                        className="bg-green-500 text-white font-bold rounded py-2 px-3"
                        onChange={(e) =>
                            setSearchFilter((prev) => {
                                const newPrev = { ...prev };
                                newPrev.optionType = e.target.value as any;
                                return newPrev;
                            })
                        }
                    >
                        <option value="any">Any</option>
                        <option value="call">Call</option>
                        <option value="put">Put</option>
                    </select>
                </fieldset>
                <fieldset className="flex flex-col space-x-1 space-y-2 justify-center items-center">
                    <label htmlFor="type" className="text-gray-900 font-bold">
                        Written By You
                    </label>
                    <select
                        id="type"
                        className="bg-green-500 text-white font-bold rounded py-2 px-3"
                        onChange={(e) =>
                            setSearchFilter((prev) => {
                                const newPrev = { ...prev };
                                newPrev.writtenByUser = e.target.value as any;
                                return newPrev;
                            })
                        }
                    >
                        <option value="any">Any</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                </fieldset>
                <fieldset className="flex flex-col space-x-1 space-y-2 justify-center items-center">
                    <label htmlFor="type" className="text-gray-900 font-bold">
                        Expiry Range
                    </label>
                    <input
                        type="datetime-local"
                        onChange={(e) => {
                            setSearchFilter((prev) => {
                                const newPrev = { ...prev };
                                newPrev.expiryDateStart = new Date(
                                    e.target.value
                                ).getTime();
                                return newPrev;
                            });
                        }}
                    />
                    <input
                        type="datetime-local"
                        onChange={(e) => {
                            setSearchFilter((prev) => {
                                const newPrev = { ...prev };
                                newPrev.expiryDateEnd = new Date(
                                    e.target.value
                                ).getTime();
                                return newPrev;
                            });
                        }}
                    />
                </fieldset>
                <fieldset className="flex flex-col space-x-1 space-y-2 justify-center items-center">
                    <label
                        htmlFor="tokenAddress"
                        className="text-gray-900 font-bold"
                    >
                        Token Address
                    </label>
                    <input
                        type="text"
                        id="tokenAddress"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
                        onChange={(e) => {
                            setSearchFilter((prev) => {
                                const newPrev = { ...prev };
                                newPrev.tokenAddress = e.target.value;
                                return newPrev;
                            });
                        }}
                    />
                </fieldset>
                <fieldset className="flex flex-col space-x-1 space-y-2 justify-center items-center">
                    <label
                        htmlFor="available"
                        className="text-gray-900 font-bold"
                    >
                        Show Unavailable
                    </label>
                    <input
                        type="checkbox"
                        id="available"
                        name="available"
                        onChange={(e) => {
                            setSearchFilter((prev) => {
                                const newPrev = { ...prev };
                                newPrev.showUnavailable = e.target.checked;
                                return newPrev;
                            });
                        }}
                    />
                </fieldset>
            </form>
            <table className="mx-auto table-fixed min-w-min">
                <thead>
                    <tr className="font-bold text-gray-900">
                        <th className="px-3 py-2 break-words w-1/12">Sell</th>
                        <th className="px-3 py-2 break-words w-1/12">Expiry</th>
                        <th className="px-3 py-2 break-words w-1/12">Status</th>
                        <th className="px-3 py-2 break-words w-1/12">
                            Token Address
                        </th>
                        <th className="px-3 py-2 break-words w-1/12">
                            Strike Price (DAI)
                        </th>
                        <th className="px-3 py-2 break-words w-1/12">Option</th>
                    </tr>
                </thead>
                <tbody>
                    {options
                        .filter((option) => {
                            // Filter out option type
                            if (
                                searchFilter.optionType !== "any" &&
                                option.type !== searchFilter.optionType
                            ) {
                                return false;
                            }

                            // Filter token address
                            if (
                                !option.tokenAddress
                                    .toLowerCase()
                                    .startsWith(
                                        searchFilter.tokenAddress.toLowerCase()
                                    )
                            )
                                return false;

                            // Filter unavailable options
                            if (!searchFilter.showUnavailable) {
                                if (option.status !== "none") return false;

                                if (
                                    option.owner !== account &&
                                    option.writer !== account
                                )
                                    return false;
                            }

                            // Filter out of range expiry options
                            if (
                                !(
                                    searchFilter.expiryDateStart <=
                                        option.expiry &&
                                    option.expiry <= searchFilter.expiryDateEnd
                                )
                            )
                                return false;

                            // Filter options written by user
                            if (searchFilter.writtenByUser !== "any") {
                                if (
                                    searchFilter.writtenByUser === "true" &&
                                    option.writer !== account
                                )
                                    return false;

                                if (
                                    searchFilter.writtenByUser === "false" &&
                                    option.writer === account
                                )
                                    return false;
                            }

                            return true;
                        })
                        .map((option, index) => (
                            <tr
                                key={index}
                                className={`${
                                    index < options.length - 1
                                        ? "border-b-2 border-gray-100"
                                        : ""
                                }`}
                            >
                                <td className="px-3 py-4 text-center">
                                    {option.owner === account &&
                                    option.expiry >= Date.now() &&
                                    option.status === "none" ? (
                                        <button
                                            className="transition duration-100 cursor-pointer bg-green-400 hover:bg-green-500 text-white font-bold rounded py-2 px-4"
                                            onClick={(e) => {
                                                setSellOption(option);
                                            }}
                                        >
                                            Sell
                                        </button>
                                    ) : (
                                        <span className="text-gray-600">
                                            Unavailable
                                        </span>
                                    )}
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={new Date(option.expiry).toString()}
                                >
                                    {new Date(
                                        option.expiry
                                    ).toLocaleDateString()}
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={option.status.toString()}
                                >
                                    {option.status}
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={option.tokenAddress.toString()}
                                >
                                    {option.tokenAddress.slice(0, 8)}...
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={(
                                        option.strikePrice /
                                        10 **
                                            optionsMarket?.tradeCurrencyDecimals
                                    ).toString()}
                                >
                                    {option.strikePrice /
                                        10 **
                                            optionsMarket?.tradeCurrencyDecimals}
                                </td>
                                <td className="px-3 py-4 text-center">
                                    {option.owner === account ? (
                                        option.status === "none" ? (
                                            option.expiry >= Date.now() ? (
                                                <button
                                                    className="transition duration-100 cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold rounded py-2 px-4"
                                                    onClick={async (e) => {
                                                        // Get contract address
                                                        const optionsMarketAddress =
                                                            optionsMarket._address;

                                                        // Check the ERC20 allowances
                                                        if (
                                                            option.type ===
                                                            "call"
                                                        ) {
                                                            // Check that funds are allocated to contract and if not allocate them
                                                            await checkTransfer(
                                                                web3,
                                                                optionsMarketAddress,
                                                                account as string,
                                                                option.strikePrice * 10 ** optionsMarket?.tradeCurrencyDecimals * optionsMarket?.unitsPerOption,
                                                                optionsMarket?.tradeCurrency
                                                            );
                                                        } else {
                                                            // Get the contract of the token
                                                            const token =
                                                                await getERC20Contract(
                                                                    web3,
                                                                    option.tokenAddress
                                                                );

                                                            // Check that funds are allocated to contract and if not allocate them
                                                            await checkTransfer(
                                                                web3,
                                                                optionsMarketAddress,
                                                                account as string,
                                                                optionsMarket?.tokenAmountPerUnit * optionsMarket?.unitsPerOption,
                                                                token
                                                            );
                                                        }

                                                        // Attempt to exercise the option
                                                        await optionsMarket.methods
                                                            .exerciseOption(
                                                                option.id
                                                            )
                                                            .send({
                                                                from: account,
                                                            });
                                                    }}
                                                >
                                                    Exercise
                                                </button>
                                            ) : option.writer === account ? (
                                                <button
                                                    className="transition duration-100 cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded py-2 px-4"
                                                    onClick={async (e) => {
                                                        // Collect the tokens / funds stored in the option
                                                        await optionsMarket.methods
                                                            .collectExpired(
                                                                option.id
                                                            )
                                                            .send({
                                                                from: account,
                                                            });
                                                    }}
                                                >
                                                    Collect
                                                </button>
                                            ) : (
                                                <span className="text-gray-600">
                                                    Unavailable
                                                </span>
                                            )
                                        ) : (
                                            <span className="text-gray-600">
                                                Unavailable
                                            </span>
                                        )
                                    ) : (
                                        <span className="text-gray-600">
                                            Unavailable
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
}

export default DisplayOptions;
