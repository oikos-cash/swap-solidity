// run "tronbox compile" first
const fs = require("fs");
const { promisify } = require("util");

const TronWeb = require("tronweb");
const { SynthetixJs } = require("@oikos/oikos-js");

const UniswapFactory = require("../build/contracts/UniswapFactory.json");
const UniswapExchange = require("../build/contracts/UniswapExchange.json");

const isReset = process.argv.includes("--reset");
let addresses = require("../addresses.json") || {};

if (isReset) {
  addresses = {};
}

if (!isReset) {
  console.log("Info: use --reset to force new deploy \n");
}

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

  if (!isReset && addresses.factory) {
    console.log(`Factory already deployed, skipping. Use --reset to override.`);
    return new TronWeb.Contract(tronWeb, abi, addresses.factory);
  }

  const contract = await tronWeb.contract().new({
    abi,
    bytecode,
    // feeLimit:1000000000,
    callValue: 0,
    // userFeePercentage:1,
    // originEnergyLimit:10000000,
    // parameters:[para1,2,3,...]
  });

  console.log(`Deployed factory`);

  addresses.factory = contract.address;
  return contract;
};

const deployExchangeForSynth = async (factory, synthCode) => {
  const synthAddress = snx[synthCode].contract.address;
  const { abi, bytecode } = UniswapExchange;

  if (!isReset && addresses.exchanges[synthCode]) {
    console.log(`${synthCode} exchange already deployed, skipping.`);
    return new TronWeb.Contract(
      tronWeb,
      abi,
      addresses.exchanges[synthCode].address
    );
  }

  const contract = await tronWeb.contract().new({
    abi,
    bytecode,
    callValue: 0,
    // parameters:[para1,2,3,...]
  });

  const factoryAddress = factory.address;
  const tokenAddress = synthAddress;
  await contract.setup(tokenAddress, factoryAddress).send();

  // register with factory
  const exchangeAddress = contract.address;
  const res = await factory
    .registerExchange(exchangeAddress, tokenAddress)
    .send({ shouldPollResponse: true });

  if (typeof res !== "string") {
    console.log(res);
  }

  console.log(`Deployed exchange for ${synthCode} at ${exchangeAddress}`);

  /*
  console.log("Asking factory about the token exchange address:");
  console.log(await factory.getExchange(tokenAddress).call());
  */
  // exchange deployed
  addresses.exchanges = {
    ...(addresses.exchanges || {}),
    [synthCode]: {
      address: contract.address,
      tokenAddress,
    },
  };
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
  await writeAddresses(addresses);

  // deploy all synths!
  for (synth of snx.contractSettings.synths) {
    try {
      await deployExchangeForSynth(factory, synth.name);
      await writeAddresses(addresses);
    } catch (err) {
      console.error(`Error deploying ${synth.name}`);
      console.error(err);
    }
  }

  // console.log(await exchange.totalSupply().call());
  await writeAddresses(addresses);
};

run().catch((err) => {
  console.error(err);
});
