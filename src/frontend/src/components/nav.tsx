import { useEffect, useContext } from "react";
import { injected } from "./wallet/connectors";
import Web3 from "web3";
import { useWeb3React } from "@web3-react/core";
import { selectorContext } from "./context";

function Nav() {
    const { active, account, activate, deactivate } = useWeb3React();
    const web3: Web3 = useWeb3React().library;
    const [selector, setSelector] = useContext(selectorContext);

    async function connect() {
        try {
            // Connect to wallet and store state
            await activate(injected);
            localStorage.setItem("connected", "true");
        } catch (ex) {
            console.error(ex);
        }
    }

    async function disconnect() {
        try {
            // Deactive wallet connection and remove state from local storage
            deactivate();
            localStorage.removeItem("connected");
        } catch (ex) {
            console.error(ex);
        }
    }

    useEffect(() => {
        // Connect to wallet if state stored in local storage, and repeat whenever web3 is updated
        if (localStorage.getItem("connected") === "true") connect();
    }, [web3]);

    return (
        <div className="Nav">
            <div className="p-5 w-5/6 mx-auto mb-8 flex sm:flex-row flex-col justify-between items-center sm:space-x-6 space-y-2">
                <h1 className="text-xl uppercase font-medium text-gray-900">
                    Crypto Options
                </h1>
                <div className="flex sm:flex-row flex-col justify-center items-center sm:space-x-6 space-y-2">
                    <button
                        className={`transition duration-100 cursor-pointer text-gray-700 hover:text-gray-900 font-bold py-2 px-4 ${
                            selector == "trades"
                                ? "sm:border-b-2 border-green-500"
                                : ""
                        }`}
                        onClick={(e) => setSelector("trades")}
                    >
                        Trades
                    </button>
                    <button
                        className={`transition duration-100 cursor-pointer text-gray-700 hover:text-gray-900 font-bold py-2 px-4 ${
                            selector == "options"
                                ? "sm:border-b-2 border-green-500"
                                : ""
                        }`}
                        onClick={(e) => setSelector("options")}
                    >
                        Options
                    </button>
                    {active ? (
                        <button
                            className="transition duration-100 bg-green-400 hover:bg-green-500 text-white font-bold rounded py-2 px-3"
                            onClick={disconnect}
                        >
                            Disconnect wallet
                        </button>
                    ) : (
                        <button
                            className="transition duration-100 bg-green-400 hover:bg-green-500 text-white font-bold rounded py-2 px-3"
                            onClick={connect}
                        >
                            Connect wallet
                        </button>
                    )}
                    {active ? (
                        <span className="text-gray-600">
                            {account?.slice(0, 10)}
                            ...
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default Nav;
