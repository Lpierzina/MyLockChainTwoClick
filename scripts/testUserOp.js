// testUserOp.js
require("dotenv").config();
const { ethers } = require("hardhat");
const { keccak256, AbiCoder, ZeroAddress } = require("ethers");

async function main() {
  const ENTRY_POINT = process.env.ENTRY_POINT;
  const sender = process.env.SMART_WALLET;

  if (!ENTRY_POINT || !ENTRY_POINT.startsWith("0x")) {
    throw new Error("🚨 Missing or invalid ENTRY_POINT in your .env file.");
  }

  if (!sender || !sender.startsWith("0x")) {
    throw new Error("🚨 Missing SMART_WALLET in .env.");
  }

  const callData = "0x";         // replace with actual encoded call
  const initCode = "0x";
  const signature = "0x";        // placeholder
  const paymasterAndData = "0x"; // no paymaster for now

  const nonce = 0;

  const verificationGasLimit = 100_000;
  const callGasLimit = 300_000;
  const preVerificationGas = 21_000;

  const accountGasLimits = ethers.zeroPadValue(
    ethers.toBeHex((BigInt(verificationGasLimit) << 128n) | BigInt(callGasLimit)),
    32
  );

  const maxFeePerGas = ethers.parseUnits("2", "gwei");
  const maxPriorityFeePerGas = ethers.parseUnits("1", "gwei");

  const gasFees = ethers.zeroPadValue(
    ethers.toBeHex((BigInt(maxPriorityFeePerGas) << 128n) | BigInt(maxFeePerGas)),
    32
  );

  const userOp = {
    sender,
    nonce,
    initCode,
    callData,
    accountGasLimits,
    preVerificationGas,
    gasFees,
    paymasterAndData,
    signature
  };

  console.log("🧪 PackedUserOperation:");
  console.dir(userOp, { depth: null });

  const abiCoder = new AbiCoder();
  const encoded = abiCoder.encode(
    [
      "address",
      "uint256",
      "bytes",
      "bytes",
      "bytes32",
      "uint256",
      "bytes32",
      "bytes",
      "bytes"
    ],
    [
      userOp.sender,
      userOp.nonce,
      userOp.initCode,
      userOp.callData,
      userOp.accountGasLimits,
      userOp.preVerificationGas,
      userOp.gasFees,
      userOp.paymasterAndData,
      userOp.signature
    ]
  );

  const userOpHash = keccak256(encoded);
  console.log("🔐 userOpHash:", userOpHash);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
