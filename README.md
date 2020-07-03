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
3. Set `Contact Name` to `UniswapExchange.sol` and click deploy (keep other parameters to their default values).
4. Note contract address (e.g. `TSpoeVoxnZHdnLopfMd5YPJyFEE2zPjb8v`)
5. Add entry to `./src/other-tokens.js` with token information (token
   address, code and decimals). For
   example:

   ```json
   {
     "address": "TNo59Khpq46FGf4sD7XSWYFNfYfbc8CqNK",
     "code": "BNKR",
     "decimals": 6
   }
   ```

6. Add entry to `./addresses.json` with token information (addresses in
   tron hex format). `address` is the address of the exchange previously
   created at step 4 and `tokenAddress` is the token address in tron hex
   format. You can use `tronWeb.address.toHex('...')` in browser console
   to convert from Tron address format to tron hex address format. The
   `setup` field should be false (meaning the exchange is not setup
   yet).

   For example:

   ```json
      "BNKR": {
        "address": "41b8e350b56e26fdc2a8cbc0700657b88587043609",
        "tokenAddress": "418caeea9c7ebb8840ee4b49d10542b99cec6ffbc6",
        "decimals": 6,
        "setup": false
      }
   ```

7. Run `npm run deploy:mainnet` to setup the exchange.
