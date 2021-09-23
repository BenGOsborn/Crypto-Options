import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import Web3 from "web3";
import { injected } from "./components/wallet/connectors";
import OptionsMarket from "./abi/OptionsMarket.json";

interface ContractData {}

function App() {
    const { active, account, activate, deactivate } = useWeb3React();
    const web3: Web3 = useWeb3React().library;
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
            console.log(instance);
        } catch (ex) {
            console.log(ex);
        }
    }

    async function disconnect() {
        try {
            deactivate();
            localStorage.removeItem("connected");
        } catch (ex) {
            console.log(ex);
        }
    }

    useEffect(() => {
        if (localStorage.getItem("connected") === "true") connect();
    }, []);

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
