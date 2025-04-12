// submitUserOp.js - Called by uploadToIPFS() once document is pinned

window.handlePostUploadSubmission = async function ({ hashHex, ipfsHash }) {
    console.log("📦 Starting ERC-4337 UserOp preparation (no wallet required)");
  
    // Utility: Retry wrapper for flaky backend calls
    async function retryOperation(fn, retries = 2, delay = 2000) {
      for (let i = 0; i < retries; i++) {
        try {
          return await fn();
        } catch (err) {
          if (i < retries - 1) {
            console.warn(`⏳ Retrying (${i + 1}/${retries})...`, err.message);
            await new Promise(res => setTimeout(res, delay));
          } else {
            throw err;
          }
        }
      }
    }
  
    try {
      // ✅ STEP 1: Call /prepareUserOp with the hash of the pinned document
const prepareRes = await fetch('https://mylockchain-backend-7292d672afb4.herokuapp.com/prepareUserOp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ documentHash: hashHex })
});

const { userOp, userOpHash } = await prepareRes.json();

// ✅ Explicitly preserve factory-related fields if they exist
const fullUserOp = {
  ...userOp,
  factory: userOp.factory || undefined,
  factoryData: userOp.factoryData || undefined
};

console.log("🧾 Prepared userOp:", userOp);
console.log("🖋️ Signature:", userOp.signature); // 👈 Add this for debugging
console.log("🔐 No MetaMask needed — Paymaster is sponsoring this tx");

// ✅ Submit with fullUserOp
const submitRes = await retryOperation(() =>
  fetch('https://mylockchain-backend-7292d672afb4.herokuapp.com/submitSignedUserOp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userOp: fullUserOp })
  })
);
  
      const result = await submitRes.json();
  
      if (result.success && result.txHash) {
        console.log("✅ Transaction submitted:", result.txHash);
        alert(`🎉 Document registered!\n\n🔗 View on Arbiscan:\nhttps://arbiscan.io/tx/${result.txHash}`);
  
        // Save tx globally (for UI receipts)
        window.lastTxHash = result.txHash;
  
        // Optional: Generate a UI receipt
        if (typeof generateRelayReceipt === 'function') {
          generateRelayReceipt(result.txHash);
        }
  
      } else {
        console.error("❌ Submission failed:", result.error);
        alert("🚫 Submission failed. Check console for details.");
      }
  
    } catch (err) {
      console.error("❌ Fatal error during ERC-4337 flow:", err);
      alert("❌ Failed to submit: " + (err.message || "Unknown error"));
    }
  };
  
