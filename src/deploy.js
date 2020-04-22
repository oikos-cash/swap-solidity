// run "tronbox compile" first
const fs = require("fs");
const { promisify } = require("util");

const TronWeb = require("tronweb");
const { SynthetixJs } = require("@oikos/oikos-js");
const oikos = require("@oikos/oikos");

const UniswapFactory = require("../build/contracts/UniswapFactory.json");
const UniswapExchange = require("../build/contracts/UniswapExchange.json");

const isReset = process.argv.includes("--reset");
let allAddresses = require("../addresses.json");
if (Object.keys(allAddresses).length === 0) {
  allAddresses = {
    mainnet: { exchanges: {} },
    shasta: { exchanges: {} },
  };
}

const network = process.env.TRON_NETWORK || "mainnet";

const addresses = allAddresses[network];

if (isReset) {
  addresses = {};
}

if (!isReset) {
  console.log(
    "Info: use --reset or remove items from addresses.json to force new deploy \n"
  );
}

const createTronWeb = () => {
  const HttpProvider = TronWeb.providers.HttpProvider;
  const subdomain = network === "mainnet" ? "" : `${network}.`;
  const fullNode = new HttpProvider(`https://api.${subdomain}trongrid.io`);
  const solidityNode = new HttpProvider(`https://api.${subdomain}trongrid.io`);
  const eventServer = `https://api.${subdomain}trongrid.io`;
  const privateKey =
    network === "mainnet"
      ? process.env.DEPLOY_PRIVATE_KEY_MAINNET
      : process.env.PRIVATE_KEY;
  const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
  return tronWeb;
};

const tronWeb = createTronWeb();
const networkId = {
  mainnet: 1,
  shasta: 2,
}[network];
const snx = new SynthetixJs({ networkId });

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
  let synthAddress;
  if (synthCode === "OKS") {
    synthAddress = oikos.getTarget({ network: "shasta" }).ProxyERC20.address;
  } else {
    synthAddress = snx[synthCode].contract.address;
  }
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

const synthWhitelist = ["sUSD", "sTRX", "OKS"];

const run = async () => {
  const factory = await deployFactory();
  await writeAddresses(allAddresses);

  // deploy OKS
  await deployExchangeForSynth(factory, "OKS");

  // deploy all synths!
  const synths = snx.contractSettings.synths.filter((s) =>
    synthWhitelist.includes(s.name)
  );
  for (synth of synths) {
    try {
      await deployExchangeForSynth(factory, synth.name);
      await writeAddresses(allAddresses);
    } catch (err) {
      console.error(`Error deploying ${synth.name}`);
      console.error(err);
    }
  }

  // console.log(await exchange.totalSupply().call());
  await writeAddresses(allAddresses);
};

run().catch((err) => {
  console.error(err);
});
