import { useWeb3React } from "@web3-react/core";
import { useContext, useState } from "react";
import Web3 from "web3";
import { DISPLAY_DECIMALS, optionsMarketContext, SearchFilter } from "../helpers";
import { userTradesContext } from "./helpers";

function UserTrades() {
    // Web3 data
    const [optionsMarket, setOptionsMarket] = useContext(optionsMarketContext);
    const { account } = useWeb3React();
    const web3: Web3 = useWeb3React().library;

    // Trade data
    const [trades, setTrades] = useContext(userTradesContext);

    // Used for filtering
    const [searchFilter, setSearchFilter] = useState<SearchFilter>({
        optionType: "call",
        tradeStatus: "any",
        tokenAddress: "",
        writtenByUser: "any",
        expiryDateStart: 0,
        expiryDateEnd: Date.now() + 3.154e12,
    });

    return (
        <div className="overflow-auto h-96 sm:w-3/5 w-11/12 mx-auto mt-16 rounded-xl shadow-md p-6">
            <form className="pb-6 mb-6 flex flex-wrap justify-evenly lg:items-start items-center space-x-4 border-b-4 border-gray-100" style={{ minWidth: 500 }}>
                <fieldset className="flex flex-col space-x-1 space-y-2 justify-center items-center">
                    <label htmlFor="type" className="text-gray-900 font-bold">
                        Option Type
                    </label>
                    <select
                        id="type"
                        className="bg-green-500 text-white font-bold rounded py-2 px-3"
                        onChange={(e) => {
                            setSearchFilter((prev) => {
                                const newPrev = { ...prev };
                                newPrev.optionType = e.target.value as any;
                                return newPrev;
                            });
                        }}
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
                        onChange={(e) => {
                            setSearchFilter((prev) => {
                                const newPrev = { ...prev };
                                newPrev.writtenByUser = e.target.value as any;
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
                    <label htmlFor="type" className="text-gray-900 font-bold">
                        Expiry Range
                    </label>
                    <input
                        type="week"
                        onChange={(e) => {
                            setSearchFilter((prev) => {
                                const newPrev = { ...prev };
                                newPrev.expiryDateStart = (e.target.valueAsDate as Date).getTime();
                                return newPrev;
                            });
                        }}
                    />
                    <input
                        type="week"
                        onChange={(e) => {
                            setSearchFilter((prev) => {
                                const newPrev = { ...prev };
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
                                const newPrev = { ...prev };
                                newPrev.tokenAddress = e.target.value;
                                return newPrev;
                            });
                        }}
                    />
                </fieldset>
                <fieldset className="flex flex-col space-x-1 space-y-2 justify-center items-center">
                    <label htmlFor="type" className="text-gray-900 font-bold">
                        Trade Status
                    </label>
                    <select
                        id="type"
                        className="bg-green-500 text-white font-bold rounded py-2 px-3"
                        onChange={(e) => {
                            setSearchFilter((prev) => {
                                const newPrev = { ...prev };
                                newPrev.tradeStatus = e.target.value as any;
                                return newPrev;
                            });
                        }}
                    >
                        <option value="any">Any</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </fieldset>
            </form>
            <table className="mx-auto table-fixed" style={{ minWidth: 500 }}>
                <thead>
                    <tr className="font-bold text-gray-900">
                        <th className="px-3 py-2 break-words w-1/12" title={`${DISPLAY_DECIMALS} d.p`}>
                            Premium (DAI)
                        </th>
                        <th className="px-3 py-2 break-words w-1/12">Expiry</th>
                        <th className="px-3 py-2 break-words w-1/12">Token Address</th>
                        <th className="px-3 py-2 break-words w-1/12" title={`${DISPLAY_DECIMALS} d.p`}>
                            Strike Price (DAI)
                        </th>
                        <th className="px-3 py-2 break-words w-1/12">Trade Status</th>
                        <th className="px-3 py-2 break-words w-1/12">Cancel</th>
                    </tr>
                </thead>
                <tbody>
                    {trades
                        .filter((trade) => {
                            // Filter out option type
                            if (trade.type !== searchFilter.optionType) {
                                return false;
                            }

                            // Filter out trade type
                            if (searchFilter.tradeStatus !== "any" && trade.tradeStatus !== searchFilter.tradeStatus) {
                                return false;
                            }

                            // Filter token address
                            if (!trade.tokenAddress.toLowerCase().startsWith(searchFilter.tokenAddress?.toLowerCase() as string)) return false;

                            // Filter out of range expiry options
                            if (!((searchFilter.expiryDateStart as number) <= trade.expiry && trade.expiry <= (searchFilter.expiryDateEnd as number))) return false;

                            // Filter options written by user
                            if (searchFilter.writtenByUser !== "any") {
                                if (searchFilter.writtenByUser === "true" && trade.writer !== account) return false;

                                if (searchFilter.writtenByUser === "false" && trade.writer === account) return false;
                            }

                            return true;
                        })
                        .map((trade, index) => (
                            <tr key={index} className={`${index < trades.length - 1 ? "border-b-2 border-gray-100" : ""}`}>
                                <td
                                    className="px-3 py-4"
                                    title={(
                                        web3.utils
                                            .toBN(trade.premium)
                                            .mul(web3.utils.toBN(10 ** DISPLAY_DECIMALS))
                                            .div(web3.utils.toBN(10).pow(web3.utils.toBN(optionsMarket?.tradeCurrencyDecimals as number)))
                                            .toNumber() /
                                        10 ** DISPLAY_DECIMALS
                                    ).toString()}
                                >
                                    {web3.utils
                                        .toBN(trade.premium)
                                        .mul(web3.utils.toBN(10 ** DISPLAY_DECIMALS))
                                        .div(web3.utils.toBN(10).pow(web3.utils.toBN(optionsMarket?.tradeCurrencyDecimals as number)))
                                        .toNumber() /
                                        10 ** DISPLAY_DECIMALS}
                                </td>
                                <td className="px-3 py-4" title={new Date(trade.expiry).toString()}>
                                    {new Date(trade.expiry).toLocaleDateString()}
                                </td>
                                <td className="px-3 py-4" title={trade.tokenAddress}>
                                    {trade.tokenAddress.slice(0, 8)}...
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={(
                                        web3.utils
                                            .toBN(trade.strikePrice)
                                            .mul(web3.utils.toBN(10 ** DISPLAY_DECIMALS))
                                            .div(web3.utils.toBN(10).pow(web3.utils.toBN(optionsMarket?.tradeCurrencyDecimals as number)))
                                            .toNumber() /
                                        10 ** DISPLAY_DECIMALS
                                    ).toString()}
                                >
                                    {web3.utils
                                        .toBN(trade.strikePrice)
                                        .mul(web3.utils.toBN(10 ** DISPLAY_DECIMALS))
                                        .div(web3.utils.toBN(10).pow(web3.utils.toBN(optionsMarket?.tradeCurrencyDecimals as number)))
                                        .toNumber() /
                                        10 ** DISPLAY_DECIMALS}
                                </td>
                                <td className="px-3 py-4" title={trade.tradeStatus}>
                                    {trade.tradeStatus}
                                </td>
                                <td className="px-3 py-4 text-center">
                                    {trade.tradeStatus === "open" ? (
                                        <button
                                            className="transition duration-100 cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold rounded py-2 px-4"
                                            onClick={async (e) => {
                                                // Cancel the trade
                                                await optionsMarket?.optionsMarket.methods.cancelTrade(trade.id).send({
                                                    from: account,
                                                });
                                            }}
                                        >
                                            Cancel
                                        </button>
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

export default UserTrades;
