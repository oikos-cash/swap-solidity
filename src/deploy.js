// run "tronbox compile" first
const fs = require("fs");
const { promisify } = require("util");

const TronWeb = require("tronweb");
const { SynthetixJs } = require("@oikos/oikos-js");
const oikos = require("@oikos/oikos");

const otherTokens = require("./other-tokens.js");
const UniswapFactory = require("../build/contracts/UniswapFactory.json");
const UniswapExchange = require("../build/contracts/UniswapExchange.json");

const isReset = process.argv.includes("--reset");
let allAddresses = require("../addresses.json");
allAddresses.mainnet = allAddresses.mainnet || { exchanges: {} };
allAddresses.shasta = allAddresses.shasta || { exchanges: {} };

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
    // feeLimit: 10 * 1e6,
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
    synthAddress = oikos.getTarget({ network }).ProxyERC20.address;
  } else {
    synthAddress = snx[synthCode].contract.address;
  }

  return await deployExchangeForToken(factory, {
    code: synthCode,
    address: synthAddress,
  });
};

const deployExchangeForToken = async (factory, token) => {
  const { address, code } = token;

  const { abi, bytecode } = UniswapExchange;

  const tokenAddress = address.startsWith("T")
    ? TronWeb.address.toHex(address)
    : address;

  let contract;
  if (!isReset && addresses.exchanges[code]) {
    contract = new TronWeb.Contract(
      tronWeb,
      abi,
      addresses.exchanges[code].address
    );
    // return exchangeContract
  }

  if (contract) {
    console.log(`${code} exchange already deployed, skipping deployment.`);
  } else {
    contract = await tronWeb.contract().new({
      abi,
      bytecode,
      callValue: 0,
      // feeLimit: 10 * 1e6,
      // parameters:[para1,2,3,...]
    });
  }

  if (addresses.exchanges[code].setup) {
    console.log(`${code} exchange already setup, skipping setup.`);
  } else {
    console.log(`Setting up ${code} exchange.`);
    const factoryAddress = factory.address;
    await contract.setup(tokenAddress, factoryAddress).send();

    // register with factory
    const exchangeAddress = contract.address;
    const res = await factory
      .registerExchange(exchangeAddress, tokenAddress)
      .send({ shouldPollResponse: true });

    if (typeof res !== "string") {
      console.log(res);
    }

    console.log(`Setup exchange for ${code} at ${exchangeAddress}`);
  }

  /*
    console.log("Asking factory about the token exchange address:");
    console.log(await factory.getExchange(tokenAddress).call());
    */
  // exchange deployed
  addresses.exchanges = {
    ...(addresses.exchanges || {}),
    [code]: {
      address: contract.address,
      tokenAddress,
      decimals: token.decimals,
      setup: true,
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

  for (token of otherTokens[network]) {
    try {
      await deployExchangeForToken(factory, token);
      await writeAddresses(allAddresses);
    } catch (err) {
      console.error(`Error deploying ${token.name}`);
      console.error(err);
    }
  }

  // console.log(await exchange.totalSupply().call());
  await writeAddresses(allAddresses);
};

run().catch((err) => {
  console.error(err);
});
