import Web3 from "web3";
import OptionsMarket from "../abi/OptionsMarket.json";
import IERC20 from "../abi/IERC20.json";

export async function getOptionsMarketContract(web3: Web3) {
    // Get the contract and return it
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = (OptionsMarket.networks as any)[networkId];
    const contract = new web3.eth.Contract(
        OptionsMarket.abi as any,
        deployedNetwork && deployedNetwork.address
    );
    return contract;
}

export async function getERC20Contract(web3: Web3, address: string) {
    // Get the contract and return it
    const contract = new web3.eth.Contract(IERC20.abi as any, address);
    return contract;
}
