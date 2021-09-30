import Web3 from "web3";
import OptionsMarket from "../abi/OptionsMarket.json";
import IERC20 from "../abi/IERC20.json";
import { createContext, Dispatch, SetStateAction } from "react";

export interface OptionsMarketData {
    optionsMarket: any; // Contract
    address: string;
    tradeCurrency: any; // Contract
    tradeCurrencyDecimals: string;
    tokenAmountPerUnit: string;
    unitsPerOption: string;
}

// Options contract context
export const optionsMarketContext = createContext<[OptionsMarketData | null, Dispatch<SetStateAction<OptionsMarketData | null>>]>(undefined as any);

// Nav selector context
export const selectorContext = createContext<[string, Dispatch<SetStateAction<string>>]>(undefined as any);

export async function getOptionsMarketContract(web3: Web3) {
    // Get the contract and return it
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = (OptionsMarket.networks as any)[networkId];
    const contract = new web3.eth.Contract(OptionsMarket.abi as any, deployedNetwork && deployedNetwork.address);
    return contract;
}

export async function getERC20Contract(web3: Web3, address: string) {
    // Get the contract and return it
    const contract = new web3.eth.Contract(IERC20.abi as any, address);
    return contract;
}

export async function checkTransfer(web3: Web3, contractAddress: string, account: string, amount: string, tokenContract: any) {
    // Check the allowance of the contract
    const allowance = await tokenContract.methods.allowance(account, contractAddress).call();

    // If the allowance of the contract is not enough allocate it more funds
    if (allowance < amount) {
        await tokenContract.methods.approve(contractAddress, web3.utils.toBN(amount).sub(web3.utils.toBN(allowance))).send({
            from: account,
        });
    }
}

// Shift a string up a number of decimal places
export function shiftDecimal(num: string, decimals: number, direction: "forward" | "backward") {
    // Get the location of the decimal
    let decimalIndex = num.indexOf(".");
    if (decimalIndex === -1) decimalIndex = num.length;

    if (direction === "forward") {
    } else if (direction === "backward") {
        console.log(num, decimals, direction, decimalIndex);

        // Add on the correct amount of zeros depending on the decimal number
        const charsToIndex = num.length - 1 - decimalIndex;
        const zerosToAdd = decimals - charsToIndex;

        // Pad the number
        const padded = num + "0".repeat(Math.max(zerosToAdd, 0));
        const shiftedIndex = decimalIndex + charsToIndex + zerosToAdd;
        const decimalAdded = padded.slice(0, shiftedIndex + 1) + "." + padded.slice(shiftedIndex + 1, undefined);
        let decimalRemoved = decimalAdded.slice(0, decimalIndex) + decimalAdded.slice(decimalIndex + 1, undefined);
        if (decimalRemoved[decimalRemoved.length - 1] === ".") decimalRemoved = decimalRemoved.slice(0, decimalRemoved.length - 1);

        return decimalRemoved;
    } else {
        throw "Invalid direction param";
    }
}
