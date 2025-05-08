<<<<<<< HEAD
# MyLockChain.io V2 — README

## 🛡️ Overview
**MyLockChain.io V2** is a decentralized document registration platform built for lawyers, notaries, and professionals who require tamper-evident, long-term proof of document existence. By integrating IPFS for decentralized storage and ERC-4337 account abstraction on Arbitrum via Pimlico, MyLockChain enables gasless registration without requiring users to understand blockchain or use a wallet.

---

## 🔧 Stack
- **Frontend:** HTML, JavaScript, PayPal SDK, Netlify
- **Backend:** Node.js (Heroku), Express, viem, permissionless.js
- **Blockchain:** Arbitrum One, LightAccount v2, EntryPoint v0.7, Pimlico Bundler + Paymaster
- **Email:** Nodemailer via Gmail SMTP
- **Storage:** IPFS via Pinata

---

## ⚙️ Registration Flow
## 📊 MyLockChain Flow Overview

![MyLockChain Flow Diagram](https://white-payable-angelfish-864.mypinata.cloud/ipfs/bafybeihz4lo3h7qz2qtkqq6lbna43o3f7pablevrjvfxwjvqktrdtkbhwi?pinataGatewayToken=wz1XCejvOunmyvz-8N92kgL1QCs_5GZVAy9v392CMRKuWkEG1mBdtxvRhyYefA5N)

### Step-by-Step:
1. **User uploads a file**
   - File is hashed with Keccak256
   - Pinned to IPFS (via Pinata) and returns a CID
   - CID is hashed again to generate `documentHash`
2. **User pays via PayPal**
   - Amount depends on file size
   - No crypto wallet needed
3. **Frontend calls `/pimlicoSmartAccountClient`**
   - Sends `documentHash` to backend
   
4. **Backend flow:**
   - Encodes call to `LockChainRegistry.register(documentHash)`
   - Wraps in LightAccount v2 `execute(to, value, data)`
   - Constructs factory + factoryData for the Smart Wallet
   - Calls `pm_getPaymasterStubData` to get estimated gas usage
   - Boosts `callGasLimit`, `verificationGasLimit`, and adds default `preVerificationGas`
   - Calls `pm_getPaymasterData` with sponsorship policy to get `paymasterAndData`
   - Constructs full ERC-4337 UserOperation (with proper gas + sponsorship)
   - Signs the `userOpHash` with server-side wallet (via viem)
   - Sends the operation via `eth_sendUserOperation` to Pimlico bundler
   - Polls `/user-operations/:hash` for real on-chain `transactionHash`
   - Returns the transaction hash to frontend

5. **Frontend polls contract**
   - Verifies `isRegistered(documentHash)`
   - Retrieves registrant + timestamp from `getDetails`
   - Sends receipt email with file, CID, tx link, and blockchain proof

---

## 🔐 Smart Contract
- **Registry Address:** `process.env.REGISTRY_ADDRESS`
- **ABI Functions:**
  - `isRegistered(bytes32 documentHash) → bool`
  - `getDetails(bytes32 documentHash) → (address registrant, uint256 timestamp)`
  - `register(bytes32 documentHash)` (called by LightAccount)

---

## 🔄 Pimlico Sponsorship
### Stub Estimation
```js
await client.request({
  method: 'pm_getPaymasterStubData',
  params: [
    { factory, factoryData, callData, ... }, // normalized UserOp fields
    entryPoint, // string
    chainIdHex  // string, e.g. '0xa4b1'
  ]
})
```

### Sponsored UserOp
```js
await client.request({
  method: 'pm_getPaymasterData',
  params: [
    { factory, factoryData, callData, ..., gas fields },
    entryPoint,
    chainId,
    { sponsorshipPolicyId }
  ]
})
```

---

## 🔁 Dev Notes
- LightAccount index is **randomized** per session to avoid Pimlico quota blocks
- Gas fields are converted with `numberToHex(BigInt(...))`
- `paymasterAndData` is **split** into `paymaster` and `paymasterData`
- Email receipt includes:
  - File name
  - IPFS CID + URL
  - Keccak256 hash
  - On-chain timestamp + registrant
  - Arbiscan transaction link

---

## 🌐 Deployment
- **Frontend:** `https://mylockchaintwoclick.netlify.app` and `https://mylockchain.io`
- **Backend:** `https://mylockchain-backend.herokuapp.com`

---

## 🧪 Testing
- Curl examples available for both `prepareUserOp` and `submitSignedUserOp`
- Pimlico API Logs viewable via https://dashboard.pimlico.io

---

## 📬 Support
For dev or legal partnership inquiries, contact: `luke@mylockchain.io`

---

## 🧠 Architecture Diagram
```
Frontend → IPFS → Backend → Pimlico Paymaster → EntryPoint → Registry Contract
                    ↓                     ↑
               Email via Gmail       Bundler Submission
```

---

## 🧩 Sequence Diagram
See included Mermaid.js sequence diagram in the repo or documentation.

---

## ✅ Summary
MyLockChain V2 delivers frictionless blockchain notarization for real-world users. Through ERC-4337 abstraction, IPFS permanence, and PayPal UX, it makes decentralized trust easy, affordable, and scalable.

