// run "tronbox compile" first

const TronWeb = require("tronweb");
const { SynthetixJs } = require("@oikos/oikos-js");

const UniswapFactory = require("../build/contracts/UniswapFactory.json");
const UniswapExchange = require("../build/contracts/UniswapExchange.json");

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
const snx = new SynthetixJs({ networkId: 2 });

const deployFactory = async () => {
  const abi = UniswapFactory.abi;
  const bytecode = UniswapFactory.bytecode;

  const contract = await tronWeb.contract().new({
    abi,
    bytecode,
    // feeLimit:1000000000,
    callValue: 0,
    // userFeePercentage:1,
    // originEnergyLimit:10000000,
    // parameters:[para1,2,3,...]
  });

  console.log("factory address", contract.address);
  return contract;
};

const deployExchangeForSynth = async (factory, synthCode) => {
  const synthAddress = snx[synthCode].contract.address;

  const { abi, bytecode } = UniswapExchange;

  const contract = await tronWeb.contract().new({
    abi,
    bytecode,
    callValue: 0,
    // parameters:[para1,2,3,...]
  });
  console.log(`${synthCode} exchange address`, contract.address);

  const factoryAddress = factory.address;
  const tokenAddress = synthAddress;
  await contract.setup(tokenAddress, factoryAddress).send();

  // register with factory
  const exchangeAddress = contract.address;
  await factory.registerExchange(exchangeAddress, tokenAddress).send();
  // exchange deployed
};

const run = async () => {
  const factory = await deployFactory();
  await deployExchangeForSynth(factory, "sTRX");

  /*
  const exchangeContract = new TronWeb.Contract(tronWeb, abi, address)
  console.log(exchangeContract)
  try {
    await exchangeContract.totalSupply().call()
  } catch (err) {
    console.log(err.transaction.transaction.raw_data.contract[0].parameter.value)
    throw err
  }
  */
};

run().catch((err) => {
  console.error(err);
});
