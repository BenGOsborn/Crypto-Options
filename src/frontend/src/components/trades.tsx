import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import Web3 from "web3";
import {
    getERC20Contract,
    getOptionsMarketContract,
    safeTransfer,
} from "./helpers";

interface Trade {
    id: number;
    optionId: number;
    tradePrice: number;
    tradeStatus: string;
    expiry: number;
    writer: string;
    tokenAddress: string;
    amount: number;
    price: number;
    type: string;
}

interface SearchFilter {
    optionType: "call" | "put" | "any";
    tokenAddress: string;
    tradeStatus: "open" | "closed" | "cancelled" | "any";
    writtenByUser: "true" | "false" | "any";
    expiryDateStart: number;
    expiryDateEnd: number;
}

function Trades() {
    // Store the web3 data
    const [optionsMarket, setOptionsMarket] = useState<any | null>(null);
    const { active, account } = useWeb3React();
    const web3: Web3 = useWeb3React().library;

    // Store the trades
    const [trades, setTrades] = useState<Trade[]>([]);
    const [ownedTrades, setOwnedTrades] = useState<Trade[]>([]);

    // Used for showing the buy screen
    const [buyTrade, setBuyTrade] = useState<{
        id: number;
        price: number;
    } | null>(null);

    // Used for filtering
    const [searchFilterOwned, setSearchFilterOwned] = useState<SearchFilter>({
        optionType: "any",
        tradeStatus: "any",
        tokenAddress: "",
        writtenByUser: "any",
        expiryDateStart: 0,
        expiryDateEnd: Date.now() + 3.154e12,
    });

    useEffect(() => {
        if (active) {
            // Get the contract
            getOptionsMarketContract(web3)
                .then((contract) => {
                    // Save the options market
                    setOptionsMarket(contract);

                    // Add an event listener for open trades
                    contract.events
                        .TradeOpened({
                            fromBlock: 0,
                        })
                        .on("data", async (event: any) => {
                            // Get the trade and add it to the list
                            const tradeId = event.returnValues.tradeId;
                            const trade = await contract.methods
                                .getTrade(tradeId)
                                .call();

                            // Get the option from the trade
                            const option = await contract.methods
                                .getOption(trade[1])
                                .call();

                            // Add the new trade to the lists
                            const newTrade: Trade = {
                                id: tradeId,
                                optionId: trade[1],
                                tradePrice: trade[2],
                                tradeStatus: trade[3],
                                expiry: option[0] * 1000,
                                writer: option[2],
                                tokenAddress: option[3],
                                amount: option[4],
                                price: option[5],
                                type: option[6],
                            };
                            if (trade[3] === "open" && trade[0] !== account) {
                                setTrades((prev) => [...prev, newTrade]);
                            }
                            if (trade[0] === account) {
                                setOwnedTrades((prev) => [...prev, newTrade]);
                            }
                        });

                    // Add an event listener to remove executed or cancelled trades
                    contract.events
                        .TradeExecuted({ fromBlock: 0 })
                        .on("data", async (event: any) => {
                            // Remove trades that have been executed
                            const tradeId = event.returnValues.tradeId;
                            setTrades((prev) =>
                                prev.filter((trade) => trade.id !== tradeId)
                            );
                        });
                    contract.events
                        .TradeCancelled({ fromBlock: 0 })
                        .on("data", async (event: any) => {
                            // Remove trades that have been cancelled
                            const tradeId = event.returnValues.tradeId;
                            setTrades((prev) =>
                                prev.filter((trade) => trade.id !== tradeId)
                            );
                        });
                })
                .catch((err: any) => console.error(err));
        }
    }, [active]);

    return (
        <div className="Trades">
            {/* Buy option modal */}
            {buyTrade !== null ? (
                <div className="bg-black bg-opacity-80 fixed inset-0 flex items-center justify-center">
                    <div className="mx-auto sm:w-2/5 w-4/5 min-w-min bg-white rounded-xl shadow-md p-6">
                        <h2 className="font-bold text-xl uppercase text-gray-900">
                            Buy Option
                        </h2>
                        <p className="text-gray-500">
                            When you buy an option, you have the right but not
                            the obligation to exercise it at any time before the
                            expiry you wish.
                        </p>
                        <div className="flex justify-between sm:flex-row flex-col items-stretch sm:space-x-4 sm:space-y-0 space-y-4 mt-5">
                            <button
                                className="transition duration-100 cursor-pointer bg-green-400 hover:bg-green-500 text-white font-bold rounded py-2 px-16"
                                onClick={async (e) => {
                                    // Get the trade currency
                                    const tradeCurrencyAddress =
                                        await optionsMarket.methods
                                            .getTradeCurrency()
                                            .call();
                                    const tradeCurrency =
                                        await getERC20Contract(
                                            web3,
                                            tradeCurrencyAddress
                                        );

                                    // Safe allocate funds
                                    await safeTransfer(
                                        web3,
                                        optionsMarket._address,
                                        account as string,
                                        buyTrade.price,
                                        tradeCurrency
                                    );

                                    // Execute the trade
                                    await optionsMarket.methods
                                        .executeTrade(buyTrade.id)
                                        .send({ from: account });
                                }}
                            >
                                Buy
                            </button>
                            <button
                                onClick={(e) => setBuyTrade(null)}
                                className="transition duration-100 cursor-pointer bg-transparent border-gray-500 border hover:border-gray-700 text-gray-500 hover:text-gray-700 font-bold rounded py-2 px-8"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
            {/* Show user trades */}
            <div className="overflow-x-auto w-3/5 mx-auto mt-16 rounded-xl shadow-md p-6">
                <form
                    className="pb-6 mb-6 flex flex-wrap justify-evenly lg:items-start items-center space-x-4 border-b-4 border-gray-100"
                    style={{ minWidth: 500 }}
                >
                    <fieldset className="flex flex-col space-x-1 space-y-2 justify-center items-center">
                        <label
                            htmlFor="type"
                            className="text-gray-900 font-bold"
                        >
                            Option Type
                        </label>
                        <select
                            id="type"
                            className="bg-green-500 text-white font-bold rounded py-2 px-3"
                            onChange={(e) => {
                                setSearchFilterOwned((prev) => {
                                    const newPrev = { ...prev };
                                    newPrev.optionType = e.target.value as any;
                                    return newPrev;
                                });
                            }}
                        >
                            <option value="any">Any</option>
                            <option value="call">Call</option>
                            <option value="put">Put</option>
                        </select>
                    </fieldset>
                    <fieldset className="flex flex-col space-x-1 space-y-2 justify-center items-center">
                        <label
                            htmlFor="type"
                            className="text-gray-900 font-bold"
                        >
                            Written By You
                        </label>
                        <select
                            id="type"
                            className="bg-green-500 text-white font-bold rounded py-2 px-3"
                            onChange={(e) => {
                                setSearchFilterOwned((prev) => {
                                    const newPrev = { ...prev };
                                    newPrev.writtenByUser = e.target
                                        .value as any;
                                    return newPrev;
                                });
                            }}
                        >
                            <option value="any">Any</option>
                            <option value="true">True</option>
                            <option value="false">False</option>
                        </select>
                    </fieldset>
                    <fieldset className="flex flex-col space-x-1 space-y-2 justify-center items-center">
                        <label
                            htmlFor="type"
                            className="text-gray-900 font-bold"
                        >
                            Expiry Range
                        </label>
                        <input
                            type="datetime-local"
                            onChange={(e) => {
                                setSearchFilterOwned((prev) => {
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
                                setSearchFilterOwned((prev) => {
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
                                setSearchFilterOwned((prev) => {
                                    const newPrev = { ...prev };
                                    newPrev.tokenAddress = e.target.value;
                                    return newPrev;
                                });
                            }}
                        />
                    </fieldset>
                    <fieldset className="flex flex-col space-x-1 space-y-2 justify-center items-center">
                        <label
                            htmlFor="type"
                            className="text-gray-900 font-bold"
                        >
                            Trade Status
                        </label>
                        <select
                            id="type"
                            className="bg-green-500 text-white font-bold rounded py-2 px-3"
                            onChange={(e) => {}}
                        >
                            <option value="any">Any</option>
                            <option value="open">Open</option>
                            <option value="closed">Closed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </fieldset>
                </form>
                <table
                    className="mx-auto table-fixed"
                    style={{ minWidth: 500 }}
                >
                    <thead>
                        <tr className="font-bold text-gray-900">
                            <th className="px-3 py-2 break-words w-1/12">
                                Trade Price
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Expiry
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Token Address
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Token Amount
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Price
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Trade Status
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Cancel
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {ownedTrades
                            .filter((trade) => {
                                // Filter out option type
                                if (
                                    searchFilterOwned.optionType !== "any" &&
                                    trade.type !== searchFilterOwned.optionType
                                ) {
                                    return false;
                                }

                                // Filter out trade type
                                if (
                                    searchFilterOwned.tradeStatus !== "any" &&
                                    trade.tradeStatus !==
                                        searchFilterOwned.tradeStatus
                                ) {
                                    return false;
                                }

                                // Filter token address
                                if (
                                    !trade.tokenAddress
                                        .toLowerCase()
                                        .startsWith(
                                            searchFilterOwned.tokenAddress.toLowerCase()
                                        )
                                )
                                    return false;

                                // Filter out of range expiry options
                                if (
                                    !(
                                        searchFilterOwned.expiryDateStart <=
                                            trade.expiry &&
                                        trade.expiry <=
                                            searchFilterOwned.expiryDateEnd
                                    )
                                )
                                    return false;

                                // Filter options written by user
                                if (searchFilterOwned.writtenByUser !== "any") {
                                    if (
                                        searchFilterOwned.writtenByUser ===
                                            "true" &&
                                        trade.writer !== account
                                    )
                                        return false;

                                    if (
                                        searchFilterOwned.writtenByUser ===
                                            "false" &&
                                        trade.writer === account
                                    )
                                        return false;
                                }

                                return true;
                            })
                            .map((trade, index) => (
                                <tr
                                    key={index}
                                    className={`${
                                        index < ownedTrades.length - 1
                                            ? "border-b-2 border-gray-100"
                                            : ""
                                    }`}
                                >
                                    <td
                                        className="px-3 py-4"
                                        title={trade.tradePrice.toString()}
                                    >
                                        {trade.tradePrice}
                                    </td>
                                    <td
                                        className="px-3 py-4"
                                        title={new Date(
                                            trade.expiry
                                        ).toString()}
                                    >
                                        {new Date(
                                            trade.expiry
                                        ).toLocaleDateString()}
                                    </td>
                                    <td
                                        className="px-3 py-4"
                                        title={trade.tokenAddress}
                                    >
                                        {trade.tokenAddress.slice(0, 8)}...
                                    </td>
                                    <td
                                        className="px-3 py-4"
                                        title={trade.amount.toString()}
                                    >
                                        {trade.amount}
                                    </td>
                                    <td
                                        className="px-3 py-4"
                                        title={trade.price.toString()}
                                    >
                                        {trade.price}
                                    </td>
                                    <td
                                        className="px-3 py-4"
                                        title={trade.tradeStatus}
                                    >
                                        {trade.tradeStatus}
                                    </td>
                                    <td className="px-3 py-4 text-center">
                                        {trade.tradeStatus === "open" ? (
                                            <button
                                                className="transition duration-100 cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold rounded py-2 px-4"
                                                onClick={async (e) => {
                                                    // Cancel the trade
                                                    await optionsMarket.methods
                                                        .cancelTrade(trade.id)
                                                        .send({
                                                            from: account,
                                                        });
                                                }}
                                            >
                                                Cancel
                                            </button>
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
            {/* Show all trades */}
            <div className="overflow-x-auto w-3/5 mx-auto mt-16 rounded-xl shadow-md p-6">
                <table
                    className="mx-auto table-fixed"
                    style={{ minWidth: 500 }}
                >
                    <thead>
                        <tr className="font-bold text-gray-900">
                            <th className="px-3 py-2 break-words w-1/12">
                                Buy
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Trade Price
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Expiry
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Token Address
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Token Amount
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Price
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Type
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Trade Status
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Cancel
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.map((trade, index) => (
                            <tr
                                key={index}
                                className={`${
                                    index < ownedTrades.length - 1
                                        ? "border-b-2 border-gray-100"
                                        : ""
                                }`}
                            >
                                <td className="px-3 py-4 text-center">
                                    {trade.tradeStatus === "open" ? (
                                        <button
                                            className="transition duration-100 cursor-pointer bg-green-400 hover:bg-green-500 text-white font-bold rounded py-2 px-4"
                                            onClick={(e) => {
                                                setBuyTrade({
                                                    id: trade.optionId,
                                                    price: trade.tradePrice,
                                                });
                                            }}
                                        >
                                            Buy
                                        </button>
                                    ) : (
                                        <span className="text-gray-600">
                                            Unavailable
                                        </span>
                                    )}
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={trade.tradePrice.toString()}
                                >
                                    {trade.tradePrice}
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={new Date(trade.expiry).toString()}
                                >
                                    {new Date(
                                        trade.expiry
                                    ).toLocaleDateString()}
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={trade.tokenAddress}
                                >
                                    {trade.tokenAddress.slice(0, 8)}...
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={trade.amount.toString()}
                                >
                                    {trade.amount}
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={trade.price.toString()}
                                >
                                    {trade.price}
                                </td>
                                <td className="px-3 py-4" title={trade.type}>
                                    {trade.type}
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={trade.tradeStatus}
                                >
                                    {trade.tradeStatus}
                                </td>
                                <td className="px-3 py-4 text-center">
                                    {trade.tradeStatus === "open" ? (
                                        <button
                                            className="transition duration-100 cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold rounded py-2 px-4"
                                            onClick={async (e) => {
                                                // Cancel the trade
                                                await optionsMarket.methods
                                                    .cancelTrade(trade.id)
                                                    .send({ from: account });
                                            }}
                                        >
                                            Cancel
                                        </button>
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
        </div>
    );
}

export default Trades;
