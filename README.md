# Uniswap contracts for the Tron blockchain

Install dependencies:

```bash
npm install
```

Private key to use for deployment:

```bash
export PRIVATE_KEY=yourprivatekey
```

Compile contracts and deploy on shasta:

```bash
npx tronbox migrate --network shasta --reset
```

Or on mainnet:

```bash
npx tronbox migrate --network mainnet --reset
```
