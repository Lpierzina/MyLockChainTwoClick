// submitUserOp.js - Called by uploadToIPFS() once document is pinned
window.handlePostUploadSubmission = async function ({ hashHex, ipfsHash, fileName }) {
    window.lastUploadedFileName = fileName; // ✅ Store for later use
    console.log("📦 File name stored for later use:", fileName);
    console.log("📦 Starting ERC-4337 UserOp submission (no wallet required)");
  
    try {
      // Get registry address for the receipt
      const configRes = await fetch("https://mylockchain-backend-7292d672afb4.herokuapp.com/config");
      const config = await configRes.json();
      const registryAddress = config.ERC4337_CONFIG.REGISTRY_ADDRESS;
  
      // Submit UserOp
      const submitRes = await fetch("https://mylockchain-backend-7292d672afb4.herokuapp.com/pimlicoSmartAccountClient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentHash: hashHex }),
      });
  
      const result = await submitRes.json();
      const txHash = result.hash;
  
      if (!txHash || !/^0x([A-Fa-f0-9]{64})$/.test(txHash)) {
        console.warn("⚠️ Result may not be a real transaction hash:", txHash);
        alert("⚠️ Submission returned an unexpected hash. Please verify manually.");
      }
  
      // Wait for registry confirmation
      await new Promise(r => setTimeout(r, 2000));
      const regCheckRes = await fetch("https://mylockchain-backend-7292d672afb4.herokuapp.com/checkRegistration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hashHex }),
      });
  
      const { isRegistered, registrant, timestamp } = await regCheckRes.json();
      const readableTime = timestamp ? new Date(timestamp * 1000).toLocaleString() : "(pending)";
      const ipfsGateway = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      const explorerUrl = `https://arbiscan.io/tx/${txHash}`;
  
      // Render the receipt
      const receiptEl = document.getElementById("receipt");
      const contentEl = document.getElementById("receiptContent");
      const qrCodeEl = document.getElementById("qrCode");
  
      if (receiptEl && contentEl && qrCodeEl) {
        contentEl.innerHTML = `
          <h2>📄 Your LockChain.io Registration Receipt</h2>
          <p>This is your permanent proof of document registration on the Arbitrum blockchain.</p>
          <ul>
            <li><strong>📁 File Name:</strong> ${fileName || window.lastUploadedFileName || "(unknown)"}</li>
            <li><strong>📦 IPFS Hash (CID):</strong> <code>${ipfsHash}</code></li>
            <li><strong>🔗 View/Download File:</strong> <a href="${ipfsGateway}" target="_blank">${ipfsGateway}</a></li>
            <li><strong>🔒 Document Hash (Keccak256):</strong> <code>${hashHex}</code></li>
            <li><strong>👤 Registered By:</strong> ${registrant}</li>
            <li><strong>🕒 Timestamp:</strong> ${readableTime}</li>
            <li><strong>📜 Smart Contract:</strong> <a href="https://arbiscan.io/address/${registryAddress}" target="_blank">LockChainRegistry.sol</a></li>
            <li><strong>🧾 Transaction:</strong> <a href="${explorerUrl}" target="_blank">${txHash}</a></li>
          </ul>
  
          <hr>
  
          <h4>📘 What's the Difference?</h4>
          <p><strong>IPFS Hash:</strong> This CID retrieves your file from the decentralized IPFS network. Anyone with this link can view or download it.</p>
          <p><strong>Document Hash:</strong> This is a cryptographic Keccak256 hash of your file, recorded on-chain. It proves the document hasn’t been changed.</p>
  
          <hr>
  
          <label for="email">📧 Want a copy of this receipt by email?</label>
          <input type="email" id="emailInput" placeholder="you@example.com" />
          <button onclick="sendReceiptByEmail()">Send Receipt</button>
        `;
  
        // Clear QR container and render exactly one QR code (IPFS link only)
        qrCodeEl.innerHTML = '';
        new QRCode(qrCodeEl, ipfsGateway);
  
        receiptEl.style.display = 'block';
        receiptEl.scrollIntoView({ behavior: 'smooth' });
      }
  
      // Optional email function
      window.sendReceiptByEmail = async function () {
        const email = document.getElementById("emailInput").value;
        if (!email || !email.includes("@")) {
          alert("Please enter a valid email address.");
          return;
        }
  
        try {
            const res = await fetch("https://mylockchain-backend-7292d672afb4.herokuapp.com/sendReceipt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                fileName: fileName || window.lastUploadedFileName || "(unknown)",
                ipfsHash,
                hashHex,
                txHash,
                registrant,
                timestamp,
              }),
            });
  
          const json = await res.json();
          if (json.success) {
            alert("📩 Receipt sent successfully!");
          } else {
            throw new Error(json.error || "Email send failed");
          }
        } catch (err) {
          console.error("❌ Failed to send email receipt:", err);
          alert("Error sending receipt. Try again later.");
        }
      };
  
       
    } catch (err) {
      console.error("❌ Fatal error during submission:", err);
      alert("❌ Failed to submit UserOp: " + (err.message || "Unknown error"));
    }
  };
  
