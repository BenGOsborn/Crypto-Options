import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import Web3 from "web3";
import {
    getERC20Contract,
    getOptionsMarketContract,
    checkTransfer,
} from "../helpers";
import {
    Trade,
    tradesContext,
    userTradesContext,
    buyTradeContext,
} from "./helpers";
import NonUserTrades from "./nonUserTrades";
import UserTrades from "./userTrades";

function Trades() {
    // Store the web3 data
    const [optionsMarket, setOptionsMarket] = useState<any | null>(null);
    const { active, account } = useWeb3React();
    const web3: Web3 = useWeb3React().library;

    // Store the trades
    const [trades, setTrades] = useState<Trade[]>([]);
    const [userTrades, setUserTrades] = useState<Trade[]>([]);

    // Used for showing the buy screen
    const [buyTrade, setBuyTrade] = useState<Trade | null>(null);

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
                                setUserTrades((prev) => [...prev, newTrade]);
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
            {buyTrade !== null ? (
                <div className="bg-black bg-opacity-80 fixed inset-0 flex items-center justify-center">
                    <div className="mx-auto sm:w-2/5 w-4/5 min-w-min bg-white rounded-xl shadow-md p-6">
                        <h2 className="font-bold text-xl uppercase text-gray-900">
                            Buy Option
                        </h2>
                        {buyTrade.type === "call" ? (
                            <p className="text-gray-500">
                                By purchasing this{" "}
                                <span className="font-bold">
                                    {buyTrade.type}
                                </span>{" "}
                                option for{" "}
                                <span className="font-bold">
                                    {buyTrade.tradePrice}
                                </span>{" "}
                                DAI, you are buying the right but not the
                                obligation to buy{" "}
                                <span className="font-bold">
                                    {buyTrade.amount}
                                </span>{" "}
                                of the token with address '
                                <span
                                    className="font-bold"
                                    title={buyTrade.tokenAddress}
                                >
                                    {buyTrade.tokenAddress.slice(0, 8)}...
                                </span>
                                ' for {buyTrade.price} DAI any time before{" "}
                                <span className="font-bold">
                                    {new Date(
                                        buyTrade.expiry
                                    ).toLocaleDateString()}
                                </span>
                                .
                            </p>
                        ) : (
                            <p className="text-gray-500">
                                By purchasing this{" "}
                                <span className="font-bold">
                                    {buyTrade.type}
                                </span>{" "}
                                option for{" "}
                                <span className="font-bold">
                                    {buyTrade.tradePrice}
                                </span>{" "}
                                DAI, you are buying the right but not the
                                obligation to sell{" "}
                                <span className="font-bold">
                                    {buyTrade.amount}
                                </span>{" "}
                                of the token with address '
                                <span
                                    className="font-bold"
                                    title={buyTrade.tokenAddress}
                                >
                                    {buyTrade.tokenAddress.slice(0, 8)}...
                                </span>
                                ' for {buyTrade.price} DAI any time before{" "}
                                <span className="font-bold">
                                    {new Date(
                                        buyTrade.expiry
                                    ).toLocaleDateString()}
                                </span>
                                .
                            </p>
                        )}
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
                                    await checkTransfer(
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
            <userTradesContext.Provider value={[userTrades, setUserTrades]}>
                <buyTradeContext.Provider value={[buyTrade, setBuyTrade]}>
                    <UserTrades />
                </buyTradeContext.Provider>
            </userTradesContext.Provider>
            <tradesContext.Provider value={[trades, setTrades]}>
                <NonUserTrades />
            </tradesContext.Provider>
        </div>
    );
}

export default Trades;
