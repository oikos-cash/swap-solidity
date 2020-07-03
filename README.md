# Uniswap contracts for the Tron blockchain

Install dependencies:

```bash
npm install
```

Private key to use for deployment:

```bash
export TRON_NETWORK=shasta
# export DEPLOY_PRIVATE_KEY_MAINNET=privatekey_for_mainnet
export PRIVATE_KEY=yourprivatekey
```

Compile contracts:

```bash
npm run compile
```

Deploy:

```bash
npm run deploy:mainnet
npm run deploy:shasta
```

## Deploying Exchange through Tronscan

1. Go to https://tronscan.org/#/contracts/contract-compiler and drag &
   drop files from `./tronscan-contracts` directory.
2. Click compile
   - Solidity version: 0.5.8_Odyssey_v3.6.0
   - Optimization: enabled
   - Runs: 200
3. Click deploy (keep default parameters)
4. Copy deployed contract address (e.g. THZCPzTwKw1JtTjxJSubKwyEyAB34SXe2J)
5. Add entry to `./src/other-tokens.js` with token information.
