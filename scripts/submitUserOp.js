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
          body: JSON.stringify({ documentHash: hashHex }),
        })
      );
  
      const result = await submitRes.json();
  
      if (result.hash) {
        console.log("✅ UserOp submitted. Bundler hash:", result.hash);
        window.lastTxHash = result.hash;
  
        await verifyRegistrationAndShowReceipt(
          hashHex,
          result.hash,
          ipfsHash,
          lastUploadedFileName
        );
  
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
  
    // ✅ Moved OUTSIDE of try block
    async function verifyRegistrationAndShowReceipt(hashHex, txHash, ipfsHash, fileName) {
        try {
          const res = await fetch(`${API_BASE_URL}/checkRegistration`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hashHex })
          });
      
          const { isRegistered, registrant, timestamp } = await res.json();
      
          if (!isRegistered) {
            alert("❌ Document was not found in the LockChainRegistry. Something went wrong.");
            return;
          }
      
          const readableDate = new Date(timestamp * 1000).toLocaleString();
          const receiptEl = document.getElementById("receipt");
          const contentEl = document.getElementById("receiptContent");
          const qrCodeEl = document.getElementById("qrCode");
      
          if (receiptEl && contentEl && qrCodeEl) {
            contentEl.innerHTML = `
              <strong>File Name:</strong> ${fileName}<br>
              <strong>IPFS Hash:</strong> ${ipfsHash}<br>
              <strong>Blockchain Transaction:</strong>
              <a href="https://arbiscan.io/tx/${txHash}" target="_blank">${txHash}</a><br>
              <strong>Registered By:</strong> ${registrant}<br>
              <strong>Timestamp:</strong> ${readableDate}
            `;
            qrCodeEl.innerHTML = '';
            new QRCode(qrCodeEl, `https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
            receiptEl.style.display = 'block';
            receiptEl.scrollIntoView({ behavior: 'smooth' });
          }
        } catch (err) {
          console.error("Verification failed:", err);
          alert("⚠️ Could not verify registration on-chain.");
        }
      }
      
  };
  
