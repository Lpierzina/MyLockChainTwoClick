require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const ENTRY_POINT = process.env.ENTRY_POINT;

  if (!ENTRY_POINT || !ENTRY_POINT.startsWith("0x")) {
    throw new Error("🚨 Missing or invalid ENTRY_POINT in your .env file.");
  }

  // Deploy LockChainPaymaster only
  const LockChainPaymaster = await hre.ethers.getContractFactory("LockChainPaymaster");
  const paymaster = await LockChainPaymaster.deploy(ENTRY_POINT);
  await paymaster.waitForDeployment();
  console.log("✅ LockChainPaymaster deployed to:", await paymaster.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
