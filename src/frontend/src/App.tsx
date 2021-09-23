import { useWeb3React } from "@web3-react/core";
import { injected } from "../components/wallet/connectors";

function App() {
    const { active, account, library, connector, activate, deactivate } =
        useWeb3React();

    async function connect() {
        try {
            await activate(injected);
        } catch (ex) {
            console.log(ex);
        }
    }

    async function disconnect() {
        try {
            deactivate();
        } catch (ex) {
            console.log(ex);
        }
    }

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
