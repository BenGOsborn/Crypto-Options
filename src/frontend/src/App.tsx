import { useWeb3React } from "@web3-react/core";
import { useState } from "react";
import { selectorContext } from "./components/context";
import Nav from "./components/nav";
import Trades from "./components/trades";
import Options from "./components/options";

function App() {
    const { active } = useWeb3React();
    const [selector, setSelector] = useState<string>("trades");

    return (
        <div className="App">
            <selectorContext.Provider value={[selector, setSelector]}>
                <Nav />
            </selectorContext.Provider>
            <div className="content">
                {(() => {
                    if (selector === "trades") {
                        return <Trades />;
                    } else if (selector === "options") {
                        return <Options />;
                    }
                })()}
            </div>
        </div>
    );
}

export default App;
