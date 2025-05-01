// submitUserOp.js - Called by uploadToIPFS() once document is pinned
window.handlePostUploadSubmission = async function ({ hashHex, ipfsHash, fileName }) {
  console.log("📦 Starting ERC-4337 UserOp submission (no wallet required)");

  try {
    // 🔧 Fetch registry address from /config
    const configRes = await fetch("https://mylockchain-backend-7292d672afb4.herokuapp.com/config");
    const config = await configRes.json();
    const registryAddress = config.ERC4337_CONFIG.REGISTRY_ADDRESS;

    // 🚀 Submit UserOp
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

    // ⏱ Wait for the registry contract to confirm the document
    await new Promise(r => setTimeout(r, 2000));
    const regCheckRes = await fetch("https://mylockchain-backend-7292d672afb4.herokuapp.com/checkRegistration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hashHex })
    });

    const { isRegistered, registrant, timestamp } = await regCheckRes.json();
    const readableDate = timestamp ? new Date(timestamp * 1000).toLocaleString() : "(pending)";

    // 🔗 Arbiscan link
    const explorerUrl = `https://arbiscan.io/tx/${txHash}`;
    const ipfsGateway = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    // 🧾 Show receipt
    const receiptEl = document.getElementById("receipt");
    const contentEl = document.getElementById("receiptContent");
    const qrCodeEl = document.getElementById("qrCode");

    if (receiptEl && contentEl && qrCodeEl) {
      contentEl.innerHTML = `
        <h2>📄 Your LockChain.io Registration Receipt</h2>
        <p>This is your permanent proof of document registration on the Arbitrum blockchain.</p>
        <ul>
          <li><strong>📁 File Name:</strong> ${fileName}</li>
          <li><strong>📦 IPFS Hash (CID):</strong> <code>${ipfsHash}</code></li>
          <li><strong>🔗 View/Download File:</strong> <a href="${ipfsGateway}" target="_blank">${ipfsGateway}</a></li>
          <li><strong>🔒 Document Hash (Keccak256):</strong> <code>${hashHex}</code></li>
          <li><strong>👤 Registered By:</strong> ${registrant || "(unknown)"}</li>
          <li><strong>🕒 Timestamp:</strong> ${readableDate}</li>
          <li><strong>📜 Smart Contract:</strong> <a href="https://arbiscan.io/address/${registryAddress}" target="_blank">LockChainRegistry.sol</a></li>
          <li><strong>🧾 Transaction:</strong> <a href="${explorerUrl}" target="_blank">${txHash}</a></li>
        </ul>

        <hr>

        <h4>📘 What's the Difference?</h4>
        <p><strong>IPFS Hash:</strong> This is a content identifier (CID) used to retrieve your file from the decentralized IPFS network. You can share this with others so they can view or download the file.</p>
        <p><strong>Document Hash:</strong> This is a Keccak256 cryptographic hash of your document. It was recorded immutably on-chain. Anyone can verify that a document has not been altered by checking its hash against the registry.</p>

        <hr>

        <p>✅ Save this receipt for your records. For questions, visit <a href="https://mylockchain.io" target="_blank">MyLockChain.io</a>.</p>

        <hr>

        <label for="email">📧 Want a copy of this receipt by email?</label>
        <input type="email" id="emailInput" placeholder="you@example.com" />
        <button onclick="sendReceiptByEmail()">Send Receipt</button>
      `;

      qrCodeEl.innerHTML = '';
      new QRCode(qrCodeEl, ipfsGateway);
      receiptEl.style.display = 'block';
      receiptEl.scrollIntoView({ behavior: 'smooth' });
    }

    // 📬 Email logic
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
            fileName,
            ipfsHash,
            hashHex,
            txHash,
            registrant,
            timestamp
          })
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

    if (typeof generateRelayReceipt === "function") {
      generateRelayReceipt(txHash);
    }

  } catch (err) {
    console.error("❌ Fatal error during submission:", err);
    alert("❌ Failed to submit UserOp: " + (err.message || "Unknown error"));
  }
};
