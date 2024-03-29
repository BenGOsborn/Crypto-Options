import { useWeb3React } from "@web3-react/core";
import { useEffect, useState, useContext } from "react";
import Web3 from "web3";
import { getERC20Contract, checkTransfer, optionsMarketContext, DISPLAY_DECIMALS, SearchFilter } from "../helpers";
import { Option, optionsContext, sellOptionContext } from "./helpers";

function DisplayOptions() {
    // Store the web3 data
    const [optionsMarket, setOptionsMarket] = useContext(optionsMarketContext);
    const { active, account } = useWeb3React();
    const web3: Web3 = useWeb3React().library;

    // Store the existing written options by the account
    const [options, setOptions] = useContext(optionsContext);

    // Used for filtering
    const [searchFilter, setSearchFilter] = useState<SearchFilter>({
        optionType: "call",
        tokenAddress: "",
        optionStatus: "any",
        writtenByUser: "any",
        expiryDateStart: 0,
        expiryDateEnd: Date.now() + 3.154e12,
    });

    // Option to sell
    const [sellOption, setSellOption] = useContext(sellOptionContext);

    useEffect(() => {
        if (optionsMarket !== null) {
            // Add event listener for options written by the user
            optionsMarket?.optionsMarket.events
                .OptionWritten({
                    fromBlock: 0,
                    filter: {
                        writer: account,
                    },
                })
                .on("data", async (event: any) => {
                    // Get the option and add it to the list
                    const optionId = event.returnValues.optionId;
                    const option = await optionsMarket?.optionsMarket.methods.getOption(optionId).call();
                    const owner = await optionsMarket?.optionsMarket.methods.getOptionOwner(optionId).call();

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
                    setOptions((prev) => {
                        let contains = false;
                        for (const option of prev) {
                            if (option.id === newOption.id) {
                                contains = true;
                                break;
                            }
                        }
                        if (contains) {
                            return prev;
                        }
                        return [newOption, ...prev];
                    });
                });

            // Add events for options traded that belong to the user
            optionsMarket?.optionsMarket.events
                .TradeExecuted({
                    fromBlock: 0,
                    filter: {
                        buyer: account,
                    },
                })
                .on("data", async (event: any) => {
                    // Get the option and add it to the list
                    const tradeId = event.returnValues.tradeId;
                    const trade = await optionsMarket?.optionsMarket.methods.getTrade(tradeId).call();
                    const option = await optionsMarket?.optionsMarket.methods.getOption(trade[1]).call();
                    const owner = await optionsMarket?.optionsMarket.methods.getOptionOwner(trade[1]).call();

                    // Only add the option if it is owned and the id is not within the list
                    if (owner === account) {
                        const newOption: Option = {
                            id: trade[1],
                            expiry: option[0] * 1000,
                            status: option[1],
                            writer: option[2],
                            owner,
                            tokenAddress: option[3],
                            strikePrice: option[4],
                            type: option[5],
                        };
                        setOptions((prev) => {
                            let contains = false;
                            for (const option of prev) {
                                if (option.id === newOption.id) {
                                    contains = true;
                                    break;
                                }
                            }
                            if (contains) {
                                return prev;
                            }
                            return [newOption, ...prev];
                        });
                    }
                });
        }
    }, [optionsMarket]);

    return (
        <div className="overflow-x-auto sm:w-3/5 w-11/12 mx-auto mt-16 rounded-xl shadow-md p-6">
            <h2 className="px-8 pt-4 text-3xl font-extrabold text-gray-900">Your Options</h2>
            <h3 className="px-8 mb-1 text-lg text-gray-500 pb-6">
                View, filter, and interact with all of your written or owned options below. You may sell an option by clicking the{" "}
                <span className="text-green-500 font-bold">sell</span> button, exercise the option by clicking the{" "}
                <span className="text-red-600 font-bold">exercise</span> button, and you may collect your staked tokens out of an expired option by clicking the{" "}
                <span className="text-yellow-500 font-bold">collect</span> button.
            </h3>
            <form
                className="pb-6 mb-6 flex flex-wrap min-w-min justify-evenly lg:items-start items-center space-x-4 border-b-4 border-gray-100"
                style={{
                    minWidth: 500,
                }}
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
                                const newPrev = {
                                    ...prev,
                                };
                                newPrev.optionType = e.target.value as any;
                                return newPrev;
                            })
                        }
                    >
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
                                const newPrev = {
                                    ...prev,
                                };
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
                        type="week"
                        onChange={(e) => {
                            setSearchFilter((prev) => {
                                const newPrev = {
                                    ...prev,
                                };
                                newPrev.expiryDateStart = (e.target.valueAsDate as Date).getTime();
                                return newPrev;
                            });
                        }}
                    />
                    <input
                        type="week"
                        onChange={(e) => {
                            setSearchFilter((prev) => {
                                const newPrev = {
                                    ...prev,
                                };
                                newPrev.expiryDateEnd = (e.target.valueAsDate as Date).getTime();
                                return newPrev;
                            });
                        }}
                    />
                </fieldset>
                <fieldset className="flex flex-col space-x-1 space-y-2 justify-center items-center">
                    <label htmlFor="tokenAddress" className="text-gray-900 font-bold">
                        Token Address
                    </label>
                    <input
                        type="text"
                        id="tokenAddress"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
                        onChange={(e) => {
                            setSearchFilter((prev) => {
                                const newPrev = {
                                    ...prev,
                                };
                                newPrev.tokenAddress = e.target.value;
                                return newPrev;
                            });
                        }}
                    />
                </fieldset>
                <fieldset className="flex flex-col space-x-1 space-y-2 justify-center items-center">
                    <label htmlFor="available" className="text-gray-900 font-bold">
                        Option Status
                    </label>
                    <select
                        id="type"
                        className="bg-green-500 text-white font-bold rounded py-2 px-3"
                        onChange={(e) =>
                            setSearchFilter((prev) => {
                                const newPrev = {
                                    ...prev,
                                };
                                newPrev.optionStatus = e.target.value as any;
                                return newPrev;
                            })
                        }
                    >
                        <option value="any">Any</option>
                        <option value="none">None</option>
                        <option value="collected">Collected</option>
                        <option value="exercised">Excercised</option>
                    </select>
                </fieldset>
            </form>
            <table className="mx-auto table-fixed min-w-min">
                <thead>
                    <tr className="font-bold text-gray-900">
                        <th className="px-3 py-2 break-words w-1/12">Sell</th>
                        <th className="px-3 py-2 break-words w-1/12">Expiry</th>
                        <th className="px-3 py-2 break-words w-1/12">Status</th>
                        <th className="px-3 py-2 break-words w-1/12">Token Address</th>
                        <th className="px-3 py-2 break-words w-1/12" title={`${DISPLAY_DECIMALS} d.p`}>
                            Strike Price (DAI)
                        </th>
                        <th className="px-3 py-2 break-words w-1/12">Option</th>
                    </tr>
                </thead>
                <tbody>
                    {options
                        .filter((option) => {
                            // Filter out option type
                            if (option.type !== searchFilter.optionType) {
                                return false;
                            }

                            // Filter token address
                            if (!option.tokenAddress.toLowerCase().startsWith(searchFilter.tokenAddress?.toLowerCase() as string)) return false;

                            // Filter by option status
                            if (searchFilter.optionStatus !== "any" && searchFilter.optionStatus !== option.status) return false;

                            // Filter out of range expiry options
                            if (!((searchFilter.expiryDateStart as number) <= option.expiry && option.expiry <= (searchFilter.expiryDateEnd as number))) return false;

                            // Filter options written by user
                            if (searchFilter.writtenByUser !== "any") {
                                if (searchFilter.writtenByUser === "true" && option.writer !== account) return false;

                                if (searchFilter.writtenByUser === "false" && option.writer === account) return false;
                            }

                            return true;
                        })
                        .map((option, index) => (
                            <tr key={index} className={`${index < options.length - 1 ? "border-b-2 border-gray-100" : ""}`}>
                                <td className="px-3 py-4 text-center">
                                    {option.owner === account && option.expiry >= Date.now() && option.status === "none" ? (
                                        <button
                                            className="transition duration-100 cursor-pointer bg-green-400 hover:bg-green-500 text-white font-bold rounded py-2 px-4"
                                            onClick={(e) => {
                                                setSellOption(option);
                                            }}
                                        >
                                            Sell
                                        </button>
                                    ) : (
                                        <span className="text-gray-600">Unavailable</span>
                                    )}
                                </td>
                                <td className="px-3 py-4" title={new Date(option.expiry).toString()}>
                                    {new Date(option.expiry).toLocaleDateString()}
                                </td>
                                <td className="px-3 py-4" title={option.status.toString()}>
                                    {option.status}
                                </td>
                                <td className="px-3 py-4" title={option.tokenAddress.toString()}>
                                    {option.tokenAddress.slice(0, 8)}
                                    ...
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={(
                                        web3.utils
                                            .toBN(option.strikePrice)
                                            .mul(web3.utils.toBN(10 ** DISPLAY_DECIMALS))
                                            .div(web3.utils.toBN(10).pow(web3.utils.toBN(optionsMarket?.tradeCurrencyDecimals as number)))
                                            .toNumber() /
                                        10 ** DISPLAY_DECIMALS
                                    ).toString()}
                                >
                                    {(
                                        web3.utils
                                            .toBN(option.strikePrice)
                                            .mul(web3.utils.toBN(10 ** DISPLAY_DECIMALS))
                                            .div(web3.utils.toBN(10).pow(web3.utils.toBN(optionsMarket?.tradeCurrencyDecimals as number)))
                                            .toNumber() /
                                        10 ** DISPLAY_DECIMALS
                                    ).toString()}
                                </td>
                                <td className="px-3 py-4 text-center">
                                    {option.owner === account ? (
                                        option.status === "none" ? (
                                            option.expiry >= Date.now() ? (
                                                <button
                                                    className="transition duration-100 cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold rounded py-2 px-4"
                                                    onClick={async (e) => {
                                                        // Get contract detials
                                                        const optionsMarketAddress = optionsMarket?.address as string;
                                                        const tokenAmountPerUnit = web3.utils.toBN(optionsMarket?.tokenAmountPerUnit as string);
                                                        const unitsPerOption = web3.utils.toBN(optionsMarket?.unitsPerOption as string);

                                                        // Check the ERC20 allowances
                                                        if (option.type === "call") {
                                                            // Check that funds are allocated to contract and if not allocate them
                                                            await checkTransfer(
                                                                web3,
                                                                optionsMarketAddress,
                                                                account as string,
                                                                web3.utils.toBN(option.strikePrice).mul(unitsPerOption).toString(),
                                                                optionsMarket?.tradeCurrency
                                                            );
                                                        } else {
                                                            // Get the contract of the token
                                                            const token = await getERC20Contract(web3, option.tokenAddress);

                                                            // Check that funds are allocated to contract and if not allocate them
                                                            await checkTransfer(
                                                                web3,
                                                                optionsMarketAddress,
                                                                account as string,
                                                                tokenAmountPerUnit.mul(unitsPerOption).toString(),
                                                                token
                                                            );
                                                        }

                                                        // Attempt to exercise the option
                                                        await optionsMarket?.optionsMarket.methods.exerciseOption(option.id).send({
                                                            from: account,
                                                        });

                                                        // Update the state
                                                        setOptions((prev) => {
                                                            const clone = [...prev];
                                                            for (let i = 0; i < clone.length; i++) {
                                                                if (clone[i].id === option.id) {
                                                                    clone[i].status = "exercised";
                                                                    break;
                                                                }
                                                            }
                                                            return clone;
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
                                                        await optionsMarket?.optionsMarket.methods.collectExpired(option.id).send({
                                                            from: account,
                                                        });

                                                        // Update the state
                                                        setOptions((prev) => {
                                                            const clone = [...prev];
                                                            for (let i = 0; i < clone.length; i++) {
                                                                if (clone[i].id === option.id) {
                                                                    clone[i].status = "collected";
                                                                    break;
                                                                }
                                                            }
                                                            return clone;
                                                        });
                                                    }}
                                                >
                                                    Collect
                                                </button>
                                            ) : (
                                                <span className="text-gray-600">Unavailable</span>
                                            )
                                        ) : (
                                            <span className="text-gray-600">Unavailable</span>
                                        )
                                    ) : (
                                        <span className="text-gray-600">Unavailable</span>
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
