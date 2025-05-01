// submitUserOp.js - Called by uploadToIPFS() once document is pinned
window.handlePostUploadSubmission = async function ({ hashHex, ipfsHash, fileName }) {
  console.log("📦 Starting ERC-4337 UserOp submission (no wallet required)");

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

    // Show receipt immediately
    const receiptEl = document.getElementById("receipt");
    const contentEl = document.getElementById("receiptContent");
    const qrCodeEl = document.getElementById("qrCode");

    if (receiptEl && contentEl && qrCodeEl) {
      contentEl.innerHTML = `
        <strong>File Name:</strong> ${fileName}<br>
        <strong>IPFS Hash:</strong> ${ipfsHash}<br>
        <strong>Blockchain Transaction:</strong>
        <a href="https://arbiscan.io/tx/${txHash}" target="_blank">${txHash}</a>
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
