import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import {
    getERC20Contract,
    getOptionsMarketContract,
    selectorContext,
} from "./components/helpers";
import Nav from "./components/nav";
import Trades from "./components/trades/main";
import Options from "./components/options/main";
import Web3 from "web3";
import { OptionsMarketData, optionsMarketContext } from "./components/helpers";

function App() {
    // Store the tab selector
    const [selector, setSelector] = useState<string>("trades");

    // Store the web3 data
    const [optionsMarket, setOptionsMarket] =
        useState<OptionsMarketData | null>(null);
    const { active } = useWeb3React();
    const web3: Web3 = useWeb3React().library;

    useEffect(() => {
        if (active) {
            getOptionsMarketContract(web3)
                .then(async (contract) => {
                    // Get the data for the state
                    const tradeCurrencyAddress =
                        await contract.methods.getTradeCurrency();
                    const tradeCurrency = await getERC20Contract(
                        web3,
                        tradeCurrencyAddress
                    );
                    const tradeCurrencyDecimals = 1e18; // This is hardcoded to the stablecoin - this is because IERC20 doesnt allow for decimals to be called

                    // Store the contract data in the state
                    const contractData: OptionsMarketData = {
                        optionsMarket: contract,
                        address: (contract as any)._address,
                        tradeCurrency,
                        tradeCurrencyDecimals,
                        tokenAmountPerUnit:
                            await contract.methods.getTokenAmountPerUnit().call(),
                        unitsPerOption: await contract.methods.getUnitsPerOption().call()
                    };
                    setOptionsMarket(contractData);
                })
                .catch((e) => console.error(e));
        }
    }, [active]);

    return (
        <div className="App">
            <selectorContext.Provider value={[selector, setSelector]}>
                <Nav />
            </selectorContext.Provider>
            <optionsMarketContext.Provider
                value={[optionsMarket, setOptionsMarket]}
            >
                <div className="content mb-16">
                    {(() => {
                        if (selector === "trades") {
                            return <Trades />;
                        } else if (selector === "options") {
                            return <Options />;
                        }
                    })()}
                </div>
            </optionsMarketContext.Provider>
        </div>
    );
}

export default App;
