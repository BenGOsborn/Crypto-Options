import { useWeb3React } from "@web3-react/core";
import { useState } from "react";
import {
    ContractData,
    contractDataCtx,
} from "./components/contexts/contractData";
import Nav from "./components/nav";
import Trades from "./components/trades";
import Options from "./options";

function App() {
    const { active } = useWeb3React();
    const [contractData, setContractData] = useState<ContractData | null>(null);

    return (
        <div className="App">
            <contractDataCtx.Provider value={[contractData, setContractData]}>
                <Nav />
                <div className="Switch">
                    <Trades />
                    <Options />
                </div>
            </contractDataCtx.Provider>
        </div>
    );
}

export default App;
