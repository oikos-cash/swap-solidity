module.exports = {
  networks: {
    mainnet: {
      privateKey: process.env.PRIVATE_KEY,
      userFeePercentage: 100,
      feeLimit: 1e8,
      fullHost: "https://api.trongrid.io",
      network_id: "1",
    },
    shasta: {
      privateKey: process.env.PRIVATE_KEY,
      userFeePercentage: 50,
      feeLimit: 1e8,
      fullHost: "https://api.shasta.trongrid.io",
      network_id: "2",
    },
    compilers: {
      solc: {
        version: "0.5.8",
      },
    },
  },
};
