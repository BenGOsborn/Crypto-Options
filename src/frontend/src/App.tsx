import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import Web3 from "web3";
import { injected } from "./components/wallet/connectors";
import OptionsMarket from "./abi/OptionsMarket.json";

interface ContractData {
    networkId: number;
    deployedNetwork: any;
    instance: any;
}

function App() {
    const { active, account, activate, deactivate } = useWeb3React();
    let web3: Web3 = useWeb3React().library;
    const [contractData, setContractData] = useState<ContractData | null>(null);

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
        <div className="App">
            {active ? (
                <button onClick={disconnect}>Disconnect wallet</button>
            ) : (
                <button onClick={connect}>Connect wallet</button>
            )}
            {active ? account : <span>Not connected</span>}
        </div>
    );
}

export default App;
