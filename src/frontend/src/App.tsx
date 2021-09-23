import { useWeb3React } from "@web3-react/core";
import { useState } from "react";
import Web3 from "web3";
import {
    ContractData,
    contractDataCtx,
} from "./components/contexts/contractData";
import Nav from "./components/nav";

function App() {
    const { active } = useWeb3React();
    let web3: Web3 = useWeb3React().library;
    const [contractData, setContractData] = useState<ContractData | null>(null);

    return (
        <div className="App">
            <contractDataCtx.Provider value={[contractData, setContractData]}>
                <Nav />
            </contractDataCtx.Provider>
        </div>
    );
}

export default App;
