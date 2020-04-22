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
