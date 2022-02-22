# nft-market-frontend

## Step 1: Config!

Change NFT_CONTRACT_NAME and MARKET_CONTRACT_NAME in:

    config.js

## Step 2: Storage deposit in MARKET CONTRACT!

One command:

    near call MARKET_CONTRACT_NAME storage_deposit --accountId ACCOUNT_ID --deposit 0.01
    near call nft-market.test_nft.testnet storage_deposit --accountId haitq6_owner.testnet --deposit 0.01

## Step 3: Test!

One command:

    yarn start
