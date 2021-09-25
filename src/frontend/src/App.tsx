import { useWeb3React } from "@web3-react/core";
import { useState } from "react";
import Nav from "./components/nav";
import Trades from "./components/trades";
import Options from "./components/options";

function App() {
    const { active } = useWeb3React();

    return (
        <div className="App">
            <Nav />
            <div className="Switch">
                <Trades />
                <Options />
            </div>
        </div>
    );
}

export default App;
