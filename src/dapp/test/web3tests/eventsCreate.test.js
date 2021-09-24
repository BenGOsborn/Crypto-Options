// Uninstall web3
require("dotenv").config();
const Web3 = require("web3");
const OptionsMarket = require("../../build/contracts/OptionsMarket.json");
const HDWalletProvider = require("@truffle/hdwallet-provider");

const init = async () => {
    const address = "0xCE7ec19FC81ACD5919E4d0cF8862ba20A8090D6a";
    const privateKey =
        "0xc86f1871597d7bb0f25297c4437ccaa90f14c6f9409fa921532778d3c7b560c8";

    // const web3 = new Web3(`https://ropsten.infura.io/v3/${process.env.INFURA}`);
    const provider = new HDWalletProvider(privateKey, "http://127.0.0.1:8545");
    const web3 = new Web3(provider);

    const id = await web3.eth.net.getId();
    const deployedNetwork = OptionsMarket.networks[id];
    const contract = new web3.eth.Contract(
        OptionsMarket.abi,
        deployedNetwork.address
    );

    await contract.methods
        .writeOption(
            "call",
            Math.floor(Date.now() / 1000) + 20000,
            "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
            0,
            0
        )
        .send({ from: address });

    const results = await contract.getPastEvents("OptionWritten", {
        fromBlock: 0,
    });
    console.log(results);
};

init();
