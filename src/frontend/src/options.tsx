import { useWeb3React } from "@web3-react/core";
import { useContext, useEffect } from "react";
import { contractDataCtx } from "./components/contexts/contractData";

function Options() {
    const [contractData, setContractData] = useContext(contractDataCtx);
    const { account } = useWeb3React();

    useEffect(() => {
        if (contractData !== null)
            contractData.instance.events
                .OptionWritten({
                    fromBlock: 0,
                    filter: {
                        writer: account,
                    },
                })
                .on("data", (event: any) => console.log(event));
    }, [contractData, account]);

    return (
        <div className="MyOptions">
            <div className="container mx-auto w-1/3 min-w-min rounded-xl shadow-md p-6">
                <form className="flex flex-col space-y-6">
                    <fieldset className="flex flex-col space-y-1">
                        <label
                            className="text-gray-900 font-bold"
                            htmlFor="type"
                        >
                            Option Type
                        </label>
                        <div>
                            <input
                                type="radio"
                                name="type"
                                id="call"
                                value="call"
                                defaultChecked
                            />
                            <label className="ml-3" htmlFor="call">
                                Call
                            </label>
                        </div>
                        <div>
                            <input
                                type="radio"
                                name="type"
                                id="put"
                                value="put"
                            />
                            <label className="ml-3" htmlFor="put">
                                Put
                            </label>
                        </div>
                    </fieldset>

                    <fieldset className="flex flex-col">
                        <label
                            className="text-gray-900 font-bold"
                            htmlFor="tokenAddress"
                        >
                            Token Address
                        </label>
                        <input
                            type="text"
                            name="tokenAddress"
                            id="tokenAddress"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </fieldset>

                    <fieldset className="flex flex-col">
                        <label
                            className="text-gray-900 font-bold"
                            htmlFor="expiry"
                        >
                            Expiry
                        </label>
                        <input type="datetime-local" id="expiry" />
                    </fieldset>
                </form>
            </div>
        </div>
    );
}

export default Options;
