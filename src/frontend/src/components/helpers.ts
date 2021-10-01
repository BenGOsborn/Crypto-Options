import Web3 from "web3";
import OptionsMarket from "../abi/OptionsMarket.json";
import IERC20 from "../abi/IERC20.json";
import { createContext, Dispatch, SetStateAction } from "react";

export interface OptionsMarketData {
    optionsMarket: any; // Contract
    address: string;
    tradeCurrency: any; // Contract
    tradeCurrencyDecimals: number;
    tokenAmountPerUnit: string;
    unitsPerOption: string;
}

export const DISPLAY_DECIMALS = 12;

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
    const allowance = web3.utils.toBN(await tokenContract.methods.allowance(account, contractAddress).call());
    const amountBN = web3.utils.toBN(amount);

    // If the allowance of the contract is not enough allocate it more funds
    if (allowance.lt(amountBN)) {
        await tokenContract.methods.approve(contractAddress, amountBN.add(allowance).toString()).send({
            from: account,
        });
    }
}
