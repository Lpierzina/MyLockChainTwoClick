// submitUserOp.js
// Create and send a sponsored ERC-4337 UserOperation via MetaMask, EntryPoint, and Paymaster

import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/+esm";
import {
  getUserOpHash,
  packUserOp
} from "https://cdn.jsdelivr.net/npm/@account-abstraction/utils@0.6.3/+esm"; // version-matched to v0.7 struct

const ENTRY_POINT = "0xE624D5227a5EefaC396426Cf8f16E6A34294bDE0"; // Your deployed EntryPoint
const PAYMASTER = "0x9e662d0ce3Eb47761BaC126aDFb27F714d819898";   // Your LockChainPaymaster
const BUNDLER_RPC = "https://arb-mainnet.g.alchemy.com/v2/R3hvZ2ZEkRFc0agXhqctMfFMYym9YvMa"; // 🔑 Replace with real key
const CONTRACT_ADDRESS = "0xF22570437AC863b105a7BbD49979831286D8e9BE"; // LockChainMeta Wallet

const CONTRACT_ABI = [
  {
    "inputs": [{ "internalType": "bytes32", "name": "documentHash", "type": "bytes32" }],
    "name": "registerDocument",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

export async function handlePostUploadSubmission({ hashHex, ipfsHash }) {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const sender = await signer.getAddress();

    const iface = new ethers.utils.Interface(CONTRACT_ABI);
    const callData = iface.encodeFunctionData("registerDocument", [hashHex]);

    const userOp = {
      sender: sender,
      nonce: await provider.getTransactionCount(sender),
      initCode: "0x",
      callData: callData,
      accountGasLimits: ethers.utils.hexZeroPad("0x01f400", 32), // 128k gas
      preVerificationGas: ethers.utils.hexlify(60000),
      gasFees: ethers.utils.hexZeroPad("0x100", 32), // sample max fee
      paymasterAndData: PAYMASTER.toLowerCase(),
      signature: "0x"
    };

    const userOpHash = await getUserOpHash(userOp, ENTRY_POINT, 42161); // Arbitrum One chainId
    const signature = await signer.signMessage(ethers.utils.arrayify(userOpHash));
    userOp.signature = signature;

    const packedOp = packUserOp(userOp);

    const bundlerReq = {
      method: "eth_sendUserOperation",
      params: [packedOp, ENTRY_POINT],
      id: 1,
      jsonrpc: "2.0"
    };

    const bundlerRes = await fetch(BUNDLER_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bundlerReq)
    });

    const result = await bundlerRes.json();

    if (result.error) {
      console.error("Bundler error:", result.error);
      alert("Bundler Error: " + result.error.message);
      return;
    }

    const opHash = result.result;
    console.log("✅ UserOperation submitted:", opHash);

    alert(`✅ Document registered with sponsored gas!\n\nUserOpHash: ${opHash}`);

    // optionally store opHash, hashHex, ipfsHash somewhere
    return opHash;
  } catch (err) {
    console.error("❌ Submission failed:", err);
    alert("Error: " + err.message);
  }
}
