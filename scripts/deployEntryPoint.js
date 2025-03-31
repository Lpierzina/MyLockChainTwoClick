require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const ENTRY_POINT = process.env.ENTRY_POINT;

  if (!ENTRY_POINT || !ENTRY_POINT.startsWith("0x")) {
    throw new Error("🚨 Missing or invalid ENTRY_POINT in your .env file.");
  }

  const LockChainEntryPoint = await hre.ethers.getContractFactory("OwnableLockChainMeta");
  const lockchain = await LockChainEntryPoint.deploy(ENTRY_POINT);
  await lockchain.waitForDeployment();

  console.log("✅ LockChainEntryPoint deployed to:", await lockchain.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
