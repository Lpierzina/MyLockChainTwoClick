// submitUserOp.js - Called by uploadToIPFS() once document is pinned
window.handlePostUploadSubmission = async function ({ hashHex, ipfsHash, fileName }) {
    console.log("📦 Starting ERC-4337 UserOp submission (no wallet required)");
  
    // Optional override: window.ARB_TX_EXPLORER_BASE = 'https://explorer.arbitrum.io';
    const explorerFallbacks = [
      'https://arbiscan.io',
      'https://explorer.arbitrum.io',
      'https://arbitrum.blockscout.com'
    ];
  
    try {
      const submitRes = await fetch('https://mylockchain-backend-7292d672afb4.herokuapp.com/pimlicoSmartAccountClient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentHash: hashHex }),
      });
  
      const result = await submitRes.json();
      const txHash = result.hash;
  
      if (!txHash || !/^0x([A-Fa-f0-9]{64})$/.test(txHash)) {
        console.warn("⚠️ Result may not be a real transaction hash:", txHash);
        alert("⚠️ Submission returned an unexpected hash. Please verify manually.");
      }
  
      // Try explorer options until one loads successfully
      let explorerUrl = '';
      for (const base of [window.ARB_TX_EXPLORER_BASE, ...explorerFallbacks]) {
        if (!base) continue;
        const testUrl = `${base}/tx/${txHash}`;
        try {
          const headRes = await fetch(testUrl, { method: 'HEAD' });
          if (headRes.ok) {
            explorerUrl = testUrl;
            break;
          }
        } catch (e) {
          console.warn(`❌ Explorer failed: ${testUrl}`, e.message);
        }
      }
  
      if (!explorerUrl) {
        explorerUrl = `https://arbiscan.io/tx/${txHash}`; // final fallback
      }
  
      // Show receipt immediately
      const receiptEl = document.getElementById("receipt");
      const contentEl = document.getElementById("receiptContent");
      const qrCodeEl = document.getElementById("qrCode");
  
      if (receiptEl && contentEl && qrCodeEl) {
        contentEl.innerHTML = `
          <strong>File Name:</strong> ${fileName}<br>
          <strong>IPFS Hash:</strong> ${ipfsHash}<br>
          <strong>Blockchain Transaction:</strong>
          <a href="${explorerUrl}" target="_blank">${txHash}</a>
        `;
        qrCodeEl.innerHTML = '';
        new QRCode(qrCodeEl, `https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
        receiptEl.style.display = 'block';
        receiptEl.scrollIntoView({ behavior: 'smooth' });
      }
  
      if (typeof generateRelayReceipt === 'function') {
        generateRelayReceipt(txHash);
      }
  
    } catch (err) {
      console.error("❌ Fatal error during submission:", err);
      alert("❌ Failed to submit UserOp: " + (err.message || "Unknown error"));
    }
  };
  
