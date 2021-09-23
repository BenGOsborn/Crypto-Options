import { useWeb3React } from "@web3-react/core";
import { injected } from "../components/wallet/connectors";

function App() {
    const { active, account, library, connector, activate, deactivate } =
        useWeb3React();

    function connect() {}

    return (
        <div className="App">
            <button onClick={connect}>Connect wallet</button>
            <span>Not connected</span>
        </div>
    );
}

export default App;
