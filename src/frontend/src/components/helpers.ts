import Web3 from "web3";

export async function getContract(web3: Web3, abi: any) {
    // Get the contract and return it
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = (abi.networks as any)[networkId];
    const contract = new web3.eth.Contract(
        abi.abi as any,
        deployedNetwork && deployedNetwork.address
    );
    return contract;
}
