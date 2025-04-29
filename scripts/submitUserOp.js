// submitUserOp.js - Called by uploadToIPFS() once document is pinned
  window.handlePostUploadSubmission = async function ({ hashHex, ipfsHash }) {
    console.log("📦 Starting ERC-4337 UserOp submission (no wallet required)");
  
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
      // ✅ STEP 1: Directly call /pimlicoSmartAccountClient
      const submitRes = await retryOperation(() =>
        fetch('https://mylockchain-backend-7292d672afb4.herokuapp.com/pimlicoSmartAccountClient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentHash: hashHex, // Coming from uploadToIPFS()
          }),
        })
      );
  
      const result = await submitRes.json();
  
      if (result.hash) {
        console.log("✅ UserOp submitted. Bundler hash:", result.hash);
        alert(`🎉 Document registered!\n\n🔗 View UserOp on Arbiscan Bundler View:\nhttps://arbiscan.io/tx/${result.hash}`);
        window.lastTxHash = result.hash;
        if (typeof generateRelayReceipt === 'function') {
          generateRelayReceipt(result.hash);
        }
      } else {
        console.error("❌ Submission failed:", result.error);
        alert("🚫 Submission failed. Check console for details.");
      }
  
    } catch (err) {
      console.error("❌ Fatal error in UserOp flow:", err);
      alert("❌ Failed to submit: " + (err.message || "Unknown error"));
    }
  };
  
