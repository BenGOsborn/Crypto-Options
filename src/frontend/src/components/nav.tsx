import { useContext, useEffect } from "react";
import { ContractData, contractDataCtx } from "./contexts/contractData";
import { injected } from "./wallet/connectors";
import OptionsMarket from "../abi/OptionsMarket.json";
import Web3 from "web3";
import { useWeb3React } from "@web3-react/core";

function Nav() {
    const [contractData, setContractData] = useContext(contractDataCtx);
    const { active, account, activate, deactivate } = useWeb3React();
    let web3: Web3 = useWeb3React().library;

    async function connect() {
        try {
            // Connect to wallet and store state
            await activate(injected);
            localStorage.setItem("connected", "true");

            // Get the contract and store it in the state
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = (OptionsMarket.networks as any)[networkId];
            const instance = new web3.eth.Contract(
                OptionsMarket.abi as any,
                deployedNetwork && deployedNetwork.address
            );
            const state: ContractData = {
                networkId,
                deployedNetwork,
                instance,
            };
            setContractData(state);
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
            <div className="p-5 w-5/6 mx-auto mb-8 flex sm:flex-row flex-col justify-between items-center">
                <h1 className="text-xl uppercase font-medium">Hello world</h1>
                <div className="flex sm:flex-row flex-col justify-center items-center sm:my-0 my-3">
                    {active ? (
                        <button
                            className="transition duration-100 bg-green-400 hover:bg-green-500 text-white font-bold rounded py-2 px-3 mx-2"
                            onClick={disconnect}
                        >
                            Disconnect wallet
                        </button>
                    ) : (
                        <button
                            className="transition duration-100 bg-green-400 hover:bg-green-500 text-white font-bold rounded py-2 px-3 mx-2"
                            onClick={connect}
                        >
                            Connect wallet
                        </button>
                    )}
                    {active ? (
                        <span className="mx-2 text-gray-600 sm:my-0 my-3">
                            {account?.slice(0, 16)}...
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default Nav;
