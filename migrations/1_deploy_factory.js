const Factory = artifacts.require("./UniswapFactory.sol");

module.exports = async function(deployer) {
  await deployer.deploy(Factory);
};
