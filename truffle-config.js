const { default: createJavaTronProvider, createMapTruffleBytecode } = require('@opentron/java-tron-provider')

module.exports = {
  networks: {
    nile: {
      provider: () => {
        if (!process.env.PRIVATE_KEY_NILE) {
          throw new Error('Missing PRIVATE_KEY_NILE environment variable')
        }
        return createJavaTronProvider({
          network: 'nile',
          privateKey: process.env.PRIVATE_KEY_NILE,
          mapBytecode: createMapTruffleBytecode()
        })
      },
      network_id: '*',
      production: true,
      gasPrice: 10
    }
  },

  mocha: {},
  compilers: {
    solc: {}
  }
}
