const hre = require("hardhat");

async function main() {
  const Registry = await hre.ethers.getContractFactory("LockChainRegistry");
  const registry = await Registry.deploy();

  console.log("⏳ Deploying LockChainRegistry...");
  await registry.waitForDeployment(); // ✅ Use this instead of .deployed()

  const address = await registry.getAddress(); // ✅ New way to get address
  console.log("✅ LockChainRegistry deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
