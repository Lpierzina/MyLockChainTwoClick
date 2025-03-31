const hre = require("hardhat");


async function main() {
    const [deployer] = await hre.ethers.getSigners();
  
    const entryPointAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
    const AccountFactory = await hre.ethers.getContractFactory("AccountFactory");
    const accountFactory = await AccountFactory.deploy(entryPointAddress);
    await accountFactory.waitForDeployment();
  
    console.log("✅ AccountFactory deployed to:", accountFactory.target);
  }

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
