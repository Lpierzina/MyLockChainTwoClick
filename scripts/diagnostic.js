// diagnostic.js
const { Alchemy, Network } = require('alchemy-sdk');

const config = {
  apiKey: process.env.ALCHEMY_API_KEY, // load from .env
  network: Network.ARB_MAINNET,
};

const alchemy = new Alchemy(config);

async function main() {
  const block = await alchemy.core.getBlockNumber();
  console.log("Latest Arbitrum block:", block);
}

main();
