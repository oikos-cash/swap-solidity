const TronWeb = require("tronweb");
// const abi = require('../constants/abis/exchange.json')

const abi = require("../build/contracts/UniswapExchange.json").abi;

const createTronWeb = () => {
  const HttpProvider = TronWeb.providers.HttpProvider;
  const fullNode = new HttpProvider("https://api.shasta.trongrid.io");
  const solidityNode = new HttpProvider("https://api.shasta.trongrid.io");
  const eventServer = "https://api.shasta.trongrid.io";
  const privateKey = process.env.PRIVATE_KEY;
  const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
  return tronWeb;
};
const tronWeb = createTronWeb();

const run = async () => {
  const address = "4181320633b7cae3be5b8655bb5d09d4a1a4cbf168";

  const exchangeContract = new TronWeb.Contract(tronWeb, abi, address);
  console.log(exchangeContract);
  try {
    const res = await exchangeContract.totalSupply().call();
    console.log(res);
  } catch (err) {
    console.log(
      err.transaction.transaction.raw_data.contract[0].parameter.value
    );
    throw err;
  }
};
const run2 = async () => {
  const factoryAddress = "4174cd1f8fe09dc858683c3b5c16c370301d715d6f";
  const tokenAddress = "41056c4b3c825e6220784a640945e11a563f129722";

  const factory = await tronWeb.contract().at(factoryAddress);

  const exc = await factory.getExchange(tokenAddress).call();

  console.log(exc);
};

run2().catch((err) => {
  console.error(err);
});
