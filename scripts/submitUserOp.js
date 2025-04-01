(async function () {
    while (
      typeof window.AccountAbstractionUtils === "undefined" ||
      typeof window.AccountAbstractionUtils.getUserOpHash === "undefined"
    ) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  
    const { getUserOpHash, packUserOp } = window.AccountAbstractionUtils;
    const { ethers } = window;
  
    async function retryOperation(fn, retries = 2, delay = 2000) {
      for (let i = 0; i < retries; i++) {
        try {
          return await fn();
        } catch (err) {
          if (i < retries - 1) {
            console.warn(`Retrying... (${i + 1})`, err.message);
            await new Promise(res => setTimeout(res, delay));
          } else {
            throw err;
          }
        }
      }
    }
  
    window.handlePostUploadSubmission = async function ({ hashHex, ipfsHash, userAddress }) {
      const {
        ENTRY_POINT,
        SMART_WALLET,
        PAYMASTER,
        BUNDLER_RPC,
        REGISTRY_ADDRESS
      } = window.ERC4337_CONFIG;
  
      const bundler = new ethers.providers.JsonRpcProvider(BUNDLER_RPC);
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
  
      const registryIface = new ethers.utils.Interface(["function register(bytes32 hash)"]);
      const encodedCall = registryIface.encodeFunctionData("register", [hashHex]);
  
      const walletIface = new ethers.utils.Interface(["function execute(address dest, uint256 value, bytes func)"]);
      const callData = walletIface.encodeFunctionData("execute", [REGISTRY_ADDRESS, 0, encodedCall]);
  
      const nonce = await bundler.getStorageAt(SMART_WALLET, 0);
      const gasPrice = await bundler.getGasPrice();
  
      const userOp = {
        sender: SMART_WALLET,
        nonce: ethers.BigNumber.from(nonce).toString(),
        initCode: "0x",
        callData,
        accountGasLimits: ethers.utils.hexZeroPad("0x100000100000", 32),
        preVerificationGas: "50000",
        gasFees: ethers.utils.hexZeroPad(
          gasPrice.toHexString().slice(2).padStart(64, "0"),
          32
        ),
        paymasterAndData: PAYMASTER || "0x",
        signature: "0x"
      };
  
      const packed = packUserOp(userOp);
      const { chainId } = await bundler.getNetwork();
      const userOpHash = await getUserOpHash(packed, ENTRY_POINT, chainId);
      const signature = await signer.signMessage(ethers.utils.arrayify(userOpHash));
      userOp.signature = signature;
  
      try {
        const result = await retryOperation(() => bundler.send("eth_sendUserOperation", [userOp, ENTRY_POINT]), 2, 3000);
        console.log("✅ Submitted via bundler:", result);
        alert("🎉 Document registered on-chain via bundler.");
        return result;
      } catch (err) {
        console.warn("❌ Bundler failed, falling back to backend server:", err.message);
  
        try {
          const response = await fetch("https://mylockchain-backend-7292d672afb4.herokuapp.com/submitSignedUserOp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userOp, signature })
          });
  
          const result = await response.json();
  
          if (result.success) {
            alert("🎉 Fallback successful: Document registered on-chain.");
            return result.txHash;
          } else {
            throw new Error(result.error || "Fallback failed");
          }
        } catch (serverErr) {
          console.error("❌ Fallback submission failed:", serverErr.message);
          alert("❌ All attempts failed. Try again later.");
        }
      }
    };
  })();
  