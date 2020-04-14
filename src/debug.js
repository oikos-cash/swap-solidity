const TronWeb = require("tronweb");
// const abi = require('../constants/abis/exchange.json')
const addresses = require("../addresses.json");

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

const debugTotalSupply = async () => {
  const exchangeContract = new TronWeb.Contract(
    tronWeb,
    abi,
    addresses.exchanges.sTRX
  );
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

const debugGetExchange = async () => {
  const tokenAddress = "41056c4b3c825e6220784a640945e11a563f129722";
  const factoryAddress = addresses.factory;
  const exchangeAddress = addresses.exchanges.sTRX;

  const factory = await tronWeb.contract().at(factoryAddress);

  let res;
  res = await factory.getExchange(tokenAddress).call();

  console.log(res);
};

const main = async () => {
  // await debugTotalSupply();
  await debugGetExchange();
};

main().catch((err) => {
  console.error(err);
});
