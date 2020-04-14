// const Exchange = artifacts.require("./UniswapExchange.sol");
const TronWeb = require("tronweb");
const { SynthetixJs } = require("@oikos/oikos-js");

const Factory = artifacts.require("./UniswapFactory.sol");

const createTronWeb = () => {
  const { HttpProvider } = TronWeb.providers;
  const fullNode = new HttpProvider("https://api.shasta.trongrid.io");
  const solidityNode = new HttpProvider("https://api.shasta.trongrid.io");
  const eventServer = "https://api.shasta.trongrid.io";
  const privateKey = process.env.PRIVATE_KEY;
  const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
  return tronWeb;
};

const tronWeb = createTronWeb();

module.exports = async function(deployer) {
  // If UniswapExchange is deployed after UniswapFactory, its address is not saved in the .json file (weird)
  // const exchange = await deployer.deploy(UniswapExchange);
  await deployer.deploy(Factory);

  const snx = new SynthetixJs({ networkId: 2 });
  const whitelist = ["sTRX"];
  const synths = snx.contractSettings.synths.filter((s) =>
    whitelist.includes(s.name)
  );

  const factoryAddress = Factory.address;

  const factory = await tronWeb.contract().at(factoryAddress);
  // it's not clear what the purpose of the exchange template address
  // it's not used anywhere in the contract
  let res;
  res = await factory
    .initializeFactory(tronWeb.defaultAddress.hex)
    .send({ shouldPollResponse: true });

  console.log("initializeFactory", res);
  await Promise.all(
    synths.map(async (synthInfo) => {
      const synthContract = snx[synthInfo.name];
      const address = synthContract.contract.address;
      // note: exchange will be created without associated ABI on
      // blockchain
      res = await factory.createExchange(address).send({
        shouldPollResponse: true,
      });
      console.log(`createExchange for ${synthInfo.name}`, res);
      // TODO: write exchange address somewhere?
    })
  );
};
