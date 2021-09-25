import { useWeb3React } from "@web3-react/core";
import Web3 from "web3";

export async function getContract(web3: Web3 | undefined, abi: any) {
    // Get web3
    if (typeof web3 === "undefined") {
        web3 = useWeb3React().library;
    }

    // Get the contract and return it
    const networkId = await (web3 as Web3).eth.net.getId();
    const deployedNetwork = (abi.networks as any)[networkId];
    const contract = new (web3 as Web3).eth.Contract(
        abi.abi as any,
        deployedNetwork && deployedNetwork.address
    );
    return contract;
}
