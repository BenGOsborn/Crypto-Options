import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import Web3 from "web3";
import { getOptionsMarketContract } from "./helpers";

interface Trade {
    id: number;
    poster: string;
    optionId: number;
    price: number;
    status: string;
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
                                    poster: trade[0],
                                    optionId: trade[1],
                                    price: trade[2],
                                    status: trade[3],
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

    return <div className="Trades">{}</div>;
}

export default Trades;
