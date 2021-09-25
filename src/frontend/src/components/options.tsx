import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import Web3 from "web3";
import { getOptionsMarketContract, getERC20Contract } from "./helpers";

interface Option {
    id: number;
    expiry: number;
    status: string;
    writer: string;
    owner: string;
    tokenAddress: string;
    amount: number;
    price: number;
    type: string;
}

function Options() {
    const [optionsMarket, setOptionsMarket] = useState<any | null>(null);
    const { active, account } = useWeb3React();
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
        if (active) {
            // Store the options market contract and listen for events
            getOptionsMarketContract(web3)
                .then((contract) => {
                    // Store the contract in the state
                    setOptionsMarket(contract);

                    // Add event listener for options written by the user
                    contract.events
                        .OptionWritten({
                            fromBlock: 0,
                            filter: {
                                writer: account,
                            },
                        })
                        .on("data", async (event: any) => {
                            // Get the option and add it to the list
                            const optionId = event.returnValues.optionId;
                            const option = await contract.methods
                                .getOption(optionId)
                                .call();
                            const owner = await contract.methods
                                .getOptionOwner(optionId)
                                .call();

                            const newOption: Option = {
                                id: optionId,
                                expiry: option[0] * 1000,
                                status: option[1],
                                writer: option[2],
                                owner,
                                tokenAddress: option[3],
                                amount: option[4],
                                price: option[5],
                                type: option[6],
                            };
                            setOptions((prev) => [...prev, newOption]);
                        });

                    // Add events for options traded that belong to the user
                    contract.events
                        .TradeExecuted({
                            fromBlock: 0,
                            filter: {
                                buyer: account,
                            },
                        })
                        .on("data", async (event: any) => {
                            // Get the option and add it to the list
                            const optionId = event.returnValues.optionId;
                            const option = await contract.methods
                                .getOption(optionId)
                                .call();
                            const owner = await contract.methods
                                .getOptionOwner(optionId)
                                .call();

                            // Only add the option if it is owned and the id is not within the list
                            if (owner == account) {
                                let contains = false;
                                for (const opt of options) {
                                    if (opt.id == optionId) {
                                        contains = true;
                                        break;
                                    }
                                }
                                if (!contains) {
                                    const newOption: Option = {
                                        id: optionId,
                                        expiry: option[0] * 1000,
                                        status: option[1],
                                        writer: option[2],
                                        owner,
                                        tokenAddress: option[3],
                                        amount: option[4],
                                        price: option[5],
                                        type: option[6],
                                    };
                                    setOptions((prev) => [...prev, newOption]);
                                }
                            }
                        });
                })
                .catch((err: any) => console.log(err));
            // Also add in transferred options soon too (how can I transfer this)
        }
    }, [active]);

    return (
        <div className="MyOptions">
            <div className="mx-auto w-2/5 min-w-min rounded-xl shadow-md p-6">
                <form
                    className="flex flex-col space-y-6"
                    onSubmit={async (e) => {
                        // Prevent the page from reloading
                        e.preventDefault();

                        // Only submit if contract data loaded
                        if (optionsMarket !== null) {
                            // Get contract address
                            const optionsMarketAddress = optionsMarket._address;

                            // Check the ERC20 allowances
                            if (optionType === "put") {
                                // Check the trade currency and allocate funds
                                const tradeCurrencyAddress =
                                    await optionsMarket.methods
                                        .getTradeCurrency()
                                        .call();
                                const tradeCurrency = await getERC20Contract(
                                    web3,
                                    tradeCurrencyAddress
                                );

                                // Check the allowance of the contract
                                const allowance = await tradeCurrency.methods
                                    .allowance(account, optionsMarketAddress)
                                    .call();

                                // If the allowance of the contract is not enough allocate it more funds
                                if (allowance < tokenPrice) {
                                    await tradeCurrency.methods
                                        .approve(
                                            optionsMarketAddress,
                                            web3.utils
                                                .toBN(tokenPrice)
                                                .sub(web3.utils.toBN(allowance))
                                        )
                                        .send({ from: account });
                                }
                            } else {
                                // Get the contract of the token
                                const token = await getERC20Contract(
                                    web3,
                                    tokenAddress
                                );

                                // Check the allowance of the contract
                                const allowance = await token.methods
                                    .allowance(account, optionsMarketAddress)
                                    .call();

                                // Appove funds to the contract
                                if (allowance < tokenAmount) {
                                    await token.methods
                                        .approve(
                                            optionsMarketAddress,
                                            web3.utils
                                                .toBN(tokenAmount)
                                                .sub(web3.utils.toBN(allowance))
                                        )
                                        .send({ from: account });
                                }
                            }

                            // Create the new option
                            await optionsMarket.methods
                                .writeOption(
                                    optionType,
                                    expiry,
                                    tokenAddress,
                                    tokenAmount,
                                    tokenPrice
                                )
                                .send({ from: account });

                            // @ts-ignore
                            e.target.reset();
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
                        <label
                            className="text-gray-500 text-sm italic mt-2"
                            htmlFor="tokenAddress"
                        >
                            It is recommended you pre-approve the tokens you
                            wish to use to save gas fees
                        </label>
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
                                htmlFor="tokenAmount"
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
                                htmlFor="tokenPrice"
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
            {/* **** I NEED TO ADD SOME FORM OF OPTION TO MANUALLY EXPIRE IT HERE + INTEGRATE BOUGHT CONTRACTS */}
            <div className="overflow-x-auto w-3/5 mx-auto mt-16 rounded-xl shadow-md p-6">
                <table
                    className="mx-auto table-fixed"
                    style={{ minWidth: 500 }}
                >
                    <thead>
                        <tr className="font-bold text-gray-900">
                            <th className="px-3 py-2 break-words w-1/12">ID</th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Expiry
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Status
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Token Address
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Amount
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Price
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Type
                            </th>
                            <th className="px-3 py-2 break-words w-1/12">
                                Option
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {options.map((option, index) => (
                            <tr
                                key={index}
                                className={`${
                                    index < options.length - 1
                                        ? "border-b-2 border-green-100"
                                        : ""
                                }`}
                            >
                                <th
                                    className="font-bold text-gray-900 px-3 py-4"
                                    title={option.id.toString()}
                                >
                                    {option.id}
                                </th>
                                <td
                                    className="px-3 py-2"
                                    title={new Date(option.expiry).toString()}
                                >
                                    {new Date(
                                        option.expiry
                                    ).toLocaleDateString()}
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={option.status.toString()}
                                >
                                    {option.status}
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={option.tokenAddress.toString()}
                                >
                                    {option.tokenAddress.slice(0, 8)}...
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={option.amount.toString()}
                                >
                                    {option.amount}
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={option.price.toString()}
                                >
                                    {option.price}
                                </td>
                                <td
                                    className="px-3 py-4"
                                    title={option.type.toString()}
                                >
                                    {option.type}
                                </td>
                                <td className="px-3 py-4 text-center">
                                    {option.owner == account ? (
                                        option.status == "none" ? (
                                            option.expiry >= Date.now() ? (
                                                <button
                                                    className="transition duration-100 cursor-pointer bg-green-400 hover:bg-green-500 text-white font-bold rounded py-2 px-4"
                                                    onClick={(e) => {}}
                                                >
                                                    Exercise
                                                </button>
                                            ) : option.writer == account ? (
                                                <button
                                                    className="transition duration-100 cursor-pointer bg-green-400 hover:bg-green-500 text-white font-bold rounded py-2 px-4"
                                                    onClick={(e) => {}}
                                                >
                                                    Collect
                                                </button>
                                            ) : null
                                        ) : null
                                    ) : null}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Options;
