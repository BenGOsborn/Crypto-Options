import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import Web3 from "web3";
import { getOptionsMarketContract } from "./helpers";

interface Trade {
    id: number;
    optionId: number;
    price: number;
}

function Trades() {
    // Store the web3 data
    const [optionsMarket, setOptionsMarket] = useState<any | null>(null);
    const { active, account } = useWeb3React();
    const web3: Web3 = useWeb3React().library;

    // Store the trades
    const [trades, setTrades] = useState<Trade[]>([]);
    const [ownedTrades, setOwnedTrades] = useState<Trade[]>([]);

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

                            // Make sure the trade is opened
                            if (trade[3] === "open") {
                                const newTrade: Trade = {
                                    id: tradeId,
                                    optionId: trade[1],
                                    price: trade[2],
                                };
                                setTrades((prev) => [...prev, newTrade]);

                                // If the trade belongs to the user then add it to the owned list
                                if (trade[0] === account) {
                                    setOwnedTrades((prev) => [
                                        ...prev,
                                        newTrade,
                                    ]);
                                }
                            }
                        });
                })
                .catch((err: any) => console.error(err));
        }
    }, [active]);

    return (
        <div className="Trades">
            <div className="overflow-x-auto w-3/5 mx-auto mt-16 rounded-xl shadow-md p-6">
                <table
                    className="mx-auto table-fixed"
                    style={{ minWidth: 500 }}
                >
                    <thead>
                        <tr className="font-bold text-gray-900">
                            <th className="px-3 py-2 break-words w-1/12">
                                View
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Trade ID
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Option ID
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Price
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.map((trade, index) => (
                            <tr
                                key={index}
                                className={`${
                                    index < trades.length - 1
                                        ? "border-b-2 border-green-100"
                                        : ""
                                }`}
                            >
                                <td className="px-3 py-4 text-center">
                                    <button
                                        className="transition duration-100 cursor-pointer bg-green-400 hover:bg-green-500 text-white font-bold rounded py-2 px-4"
                                        onClick={(e) => {}}
                                    >
                                        View
                                    </button>
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={trade.id.toString()}
                                >
                                    {trade.id}
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={trade.optionId.toString()}
                                >
                                    {trade.optionId}
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={trade.price.toString()}
                                >
                                    {trade.price}
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
