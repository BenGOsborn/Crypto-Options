// Uninstall web3
require("dotenv").config();
const Web3 = require("web3");
const OptionsMarket = require("../build/contracts/OptionsMarket.json");

const init = async () => {
    const web3 = new Web3(`https://ropsten.infura.io/v3/${process.env.INFURA}`);

    const id = await web3.eth.net.getId();
    const deployedNetwork = OptionsMarket.networks[id];
    const contract = new web3.eth.Contract(
        OptionsMarket.abi,
        deployedNetwork.address
    );

    const results = await contract.getPastEvents("OptionWritten", {
        fromBlock: 0,
    });
    for (const result of results) {
        const ascii = web3.utils.toAscii(result.returnValues.optionType);
        console.log(ascii);
    }
};

init();
