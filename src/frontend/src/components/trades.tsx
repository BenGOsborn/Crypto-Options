import { useContext, useEffect, useState } from "react";
import { contractDataCtx } from "./contexts/contractData";

function Trades() {
    const [contractData, setContractData] = useContext(contractDataCtx);
    const [trades, setTrades] = useState<any[]>([]);

    useEffect(() => {
        if (contractData !== null)
            contractData.instance.events
                .TradeOpened({ fromBlock: 0 })
                .on("data", (event: any) => console.log(event));
    }, [contractData]);

    return <div className="Trades"></div>;
}

export default Trades;
