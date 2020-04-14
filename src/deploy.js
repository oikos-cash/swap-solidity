// run "tronbox compile" first
const fs = require("fs");
const { promisify } = require("util");

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
  const res = await factory
    .registerExchange(exchangeAddress, tokenAddress)
    .send({ shouldPollResponse: true });

  console.log(res);
  console.log("Asking factory about the token exchange address:");
  console.log(await factory.getExchange(tokenAddress).call());
  // exchange deployed
  return contract;
};

const writeAddresses = async (obj) => {
  await promisify(fs.writeFile)(
    "./addresses.json",
    JSON.stringify(obj, null, 2)
  );
};

const run = async () => {
  const factory = await deployFactory();
  const exchange = await deployExchangeForSynth(factory, "sTRX");

  console.log(await exchange.totalSupply().call());

  await writeAddresses({
    factory: factory.address,
    exchanges: {
      sTRX: exchange.address,
    },
  });
};

run().catch((err) => {
  console.error(err);
});
