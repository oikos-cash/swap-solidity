const TronWeb = require("tronweb");
const exchange = require("./build/contracts/UniswapExchange.json");
const factory = require("./build/contracts/UniswapFactory.json");
const web3 = require("web3");
const chalk = require("chalk");
const BigNumber = require("bignumber.js");
const { SynthetixJs } = require("@oikos/oikos-js");

const networkId = 2;
const snxJS = new SynthetixJs({ networkId });

const sTRXAddress = snxJS.sTRX.contract.address;

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

const tokenAddress = sTRXAddress;
const exchangeAddress = exchange.networks[networkId].address;

const loadContract = async (address) => {
  return await tronWeb.contract().at(address);
};

const run = async () => {
  console.log(`Uniswap sTRX Exchange Address: ${sTRXAddress}`);
  const Exchange = await loadContract(exchangeAddress);
  const Token = await loadContract(tokenAddress);
  // const totalSupply = await Token.totalSupply().call();

  const approveAmount = 1e10;

  let res = await Token.approve(
    tronWeb.address.fromHex(exchangeAddress),
    web3.utils.toWei(new BigNumber(approveAmount).toString())
  ).send({ callValue: 0, shouldPollResponse: true });
  console.log("approve:", res);
  res = await Exchange.setup(tokenAddress).send({
    callValue: 0,
    shouldPollResponse: true,
  });
  console.log("exchange:", res);
};

run().catch(console.error);
