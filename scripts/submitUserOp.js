// submitUserOp.js - Injected by HTML and called from uploadToIPFS()
window.handlePostUploadSubmission = async function ({ hashHex, ipfsHash }) {
    console.log("📦 Starting ERC-4337 UserOp preparation (no wallet)...");
  
    // Utility: Retry wrapper
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
      // ✅ 1. Prepare userOp on the backend
      const response = await fetch('https://mylockchain-backend-7292d672afb4.herokuapp.com/prepareUserOp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentHash: hashHex })
      });
  
      const { userOp, userOpHash } = await response.json();
  
      if (!userOp || !userOpHash) {
        throw new Error("❌ Backend did not return a valid UserOp or UserOpHash.");
      }
  
      console.log("🔐 No MetaMask required — using sponsored Paymaster flow.");
  
      // ✅ 2. Use empty signature (Paymaster sponsored)
      userOp.signature = "0x";
  
      // ✅ 3. Submit signed UserOp to backend with retry
      const submitResponse = await retryOperation(() =>
        fetch('https://mylockchain-backend-7292d672afb4.herokuapp.com/submitSignedUserOp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userOp, signature: userOp.signature })
        })
      );
  
      const result = await submitResponse.json();
  
      if (result.success && result.txHash) {
        console.log("✅ UserOp submitted successfully:", result.txHash);
        alert("🎉 Document hash registered successfully!\nTx: " + result.txHash);
  
        // Save txHash globally
        window.lastTxHash = result.txHash;
  
        // Generate receipt in UI
        if (typeof generateRelayReceipt === 'function') {
          generateRelayReceipt(result.txHash);
        }
  
      } else {
        console.error("❌ Submission failed:", result.error);
        alert("🚫 Submission failed. Check console for details.");
      }
    } catch (err) {
      console.error("❌ Error during ERC-4337 flow:", err);
      alert("❌ Submission failed: " + (err.message || "Unknown error"));
    }
  };
  