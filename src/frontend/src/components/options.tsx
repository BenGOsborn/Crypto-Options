import { useWeb3React } from "@web3-react/core";
import { useContext, useEffect, useState } from "react";
import Web3 from "web3";
import { contractDataCtx } from "./contexts/contractData";

interface Option {
    id: number;
    expiry: number;
    status: string;
    writer: string;
    tokenAddress: string;
    amount: number;
    price: number;
    type: string;
}

function Options() {
    const [contractData, setContractData] = useContext(contractDataCtx);
    const { account } = useWeb3React();
    const web3: Web3 = useWeb3React().library;

    // Store the create option state
    const [optionType, setOptionType] = useState<string>("call");
    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [expiry, setExpiry] = useState<number>(0);
    const [tokenAmount, setTokenAmount] = useState<number>(0);
    const [tokenPrice, setTokenPrice] = useState<number>(0);

    // Store the existing written options by the account
    const [options, setOptions] = useState<Option[]>([]);

    useEffect(() => {
        if (contractData !== null)
            contractData.instance.events
                .OptionWritten({
                    fromBlock: 0,
                    filter: {
                        writer: account,
                    },
                })
                .on("data", async (event: any) => {
                    // Try and test with ethereum and see if it returns any different results

                    const optionId = event.returnValues.optionId;
                    const option = await contractData.instance.methods
                        .getOption(optionId)
                        .call();

                    const newOption: Option = {
                        id: optionId,
                        expiry: option[0] * 1000,
                        status: option[1],
                        writer: option[2],
                        tokenAddress: option[3],
                        amount: option[4],
                        price: option[5],
                        type: option[6],
                    };
                    setOptions((prev) => [...prev, newOption]);
                });

        // Also add in transferred options soon too (how can I transfer this)
    }, [contractData]);

    return (
        <div className="MyOptions">
            <div className="container mx-auto w-2/5 min-w-min rounded-xl shadow-md p-6">
                <form
                    className="flex flex-col space-y-6"
                    onSubmit={async (e) => {
                        // Prevent the page from reloading
                        e.preventDefault();

                        // Only submit if contract data loaded
                        if (contractData !== null) {
                            // Create the new option
                            await contractData.instance.methods
                                .writeOption(
                                    optionType,
                                    expiry,
                                    tokenAddress,
                                    tokenAmount,
                                    tokenPrice
                                )
                                .send({ from: account });

                            // @ts-ignore
                            // e.target.reset();
                        }
                    }}
                >
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
                                onChange={(e) => setOptionType(e.target.value)}
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
                                onChange={(e) => setOptionType(e.target.value)}
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
                            placeholder="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            onChange={(e) => setTokenAddress(e.target.value)}
                        />
                    </fieldset>

                    <fieldset className="flex flex-col">
                        <label
                            className="text-gray-900 font-bold"
                            htmlFor="expiry"
                        >
                            Expiry
                        </label>
                        <input
                            type="datetime-local"
                            id="expiry"
                            onChange={(e) => {
                                setExpiry(
                                    new Date(e.target.value).getTime() / 1000
                                );
                            }}
                            required
                        />
                    </fieldset>

                    <div className="flex space-x-3 justify-between">
                        <fieldset className="flex flex-col">
                            <label
                                className="text-gray-900 font-bold whitespace-nowrap"
                                htmlFor="tokenAddress"
                            >
                                Token Amount
                            </label>
                            <input
                                type="number"
                                name="tokenAmount"
                                id="tokenAmount"
                                placeholder="100"
                                min={0}
                                onChange={(e) =>
                                    setTokenAmount(e.target.valueAsNumber)
                                }
                                required
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                        </fieldset>
                        <fieldset className="flex flex-col">
                            <label
                                className="text-gray-900 font-bold whitespace-nowrap"
                                htmlFor="tokenAddress"
                            >
                                Token Price
                            </label>
                            <input
                                type="number"
                                name="tokenPrice"
                                id="tokenPrice"
                                placeholder="100"
                                min={0}
                                onChange={(e) =>
                                    setTokenPrice(e.target.valueAsNumber)
                                }
                                required
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                        </fieldset>
                    </div>
                    <div className="flex flex-row justify-between">
                        <input
                            className="transition duration-100 cursor-pointer bg-green-400 hover:bg-green-500 text-white font-bold rounded py-2 px-8"
                            type="submit"
                            value="Write"
                        />
                        <input
                            className="transition duration-100 cursor-pointer bg-transparent border-gray-500 border hover:border-gray-700 text-gray-500 hover:text-gray-700 font-bold rounded py-2 px-8"
                            type="reset"
                            value="Reset"
                        />
                    </div>
                </form>
            </div>
            <table className="container mx-auto mt-10 w-2/5 min-w-min rounded-xl shadow-md p-6">
                <thead>
                    <tr>
                        <td>ID</td>
                        <td>Expiry</td>
                        <td>Status</td>
                        <td>Writer</td>
                        <td>Token Address</td>
                        <td>Amount</td>
                        <td>Price</td>
                        <td>Type</td>
                    </tr>
                </thead>
                <tbody>
                    {options.map((option, index) => (
                        <tr key={index}>
                            <td>{option.id}</td>
                            <td>{option.expiry}</td>
                            <td>{option.status}</td>
                            <td>{option.writer}</td>
                            <td>{option.tokenAddress}</td>
                            <td>{option.amount}</td>
                            <td>{option.price}</td>
                            <td>{option.type}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Options;
