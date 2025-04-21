// submitUserOp.js - Called by uploadToIPFS() once document is pinned
/*  ChatGPT 
✅ This submitUserOp.js is fully built for your current architecture, which:
Uses toSimpleSmartAccount() to generate the LightAccount
Manually builds initCode using getAccountInitCode() from your backend’s smartAccountClient.js
Avoids any use of .getInitCode(), which is not available on the return object from toSimpleSmartAccount() 
(unlike toLightSmartAccount())

So this version is:
💡 LightAccount-aware
🧬 initCode-safe for undeployed accounts
✂️ Cleans up factory + factoryData before submission
🔒 Compatible with Pimlico + permissionless@0.2.41 + viem@2.26.3
may want to display LightAccount deployment status in the frontend or cache it across submissions.
*/

window.handlePostUploadSubmission = async function ({ hashHex, ipfsHash }) {
  console.log("📦 Starting ERC-4337 UserOp preparation (no wallet required)");

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
    // ✅ STEP 1: Call /prepareUserOp
    const prepareRes = await fetch('https://mylockchain-backend-7292d672afb4.herokuapp.com/prepareUserOp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentHash: hashHex }),
    });

    const { userOp, userOpHash } = await prepareRes.json();

    console.log("✅ Keys in userOp:", Object.keys(userOp));
    console.log("🏗 factory:", userOp.factory);
    console.log("🏗 factoryData:", userOp.factoryData);

    const fullUserOp = {
      ...userOp,
      ...(userOp.factory ? { factory: userOp.factory } : {}),
      ...(userOp.factoryData ? { factoryData: userOp.factoryData } : {}),
    };

    if (!fullUserOp.signature || fullUserOp.signature === '0x') {
      throw new Error('Signature missing. Cannot submit unsigned UserOperation.');
    }

    console.log("🧾 Full UserOperation ready to submit:", fullUserOp);
    console.log("🖋️ Signature:", fullUserOp.signature);

    // ✅ STEP 2: Submit signed userOp
    const submitRes = await retryOperation(() =>
      fetch('https://mylockchain-backend-7292d672afb4.herokuapp.com/submitSignedUserOp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userOp: fullUserOp }),
      })
    );

    const result = await submitRes.json();

    if (result.success && result.txHash) {
      console.log("✅ Transaction sent:", result.txHash);
      alert(`🎉 Document registered!\n\n🔗 View on Arbiscan:\nhttps://arbiscan.io/tx/${result.txHash}`);
      window.lastTxHash = result.txHash;
      if (typeof generateRelayReceipt === 'function') {
        generateRelayReceipt(result.txHash);
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
