require("dotenv").config();
const hre = require("hardhat");

const ENTRY_POINT = "0x0576a174D229E3cFA37253523E645A78A0C91B57"; // EntryPoint on Arbitrum
const PAYMASTER = "0x63e0D71fE6a57bd88d1242d0123c183712673869"; // Your Paymaster
const AMOUNT_ETH = "0.00001"; // Amount to deposit (adjust if needed)

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const entryPoint = await hre.ethers.getContractAt("EntryPoint", ENTRY_POINT);

  const valueToDeposit = hre.ethers.parseEther(AMOUNT_ETH);

  console.log(`Depositing ${AMOUNT_ETH} ETH into Paymaster...`);

  const tx = await entryPoint.depositTo(PAYMASTER, {
    value: valueToDeposit,
  });

  await tx.wait();
  console.log("✅ Paymaster funded successfully.");
  console.log("🔗 Tx Hash:", tx.hash);
}

main().catch((err) => {
  console.error("💥 Error funding Paymaster:", err);
  process.exitCode = 1;
});
