// /scripts/submitUserOp.js

(async function () {
    // ⏳ Wait until the UMD script is fully loaded
    while (
      typeof window.AccountAbstractionUtils === "undefined" ||
      typeof window.AccountAbstractionUtils.getUserOpHash === "undefined"
    ) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  
    const { getUserOpHash, packUserOp } = window.AccountAbstractionUtils;
    const { ethers } = window;
  
    window.handlePostUploadSubmission = async function ({ hashHex, ipfsHash, userAddress }) {
      console.log("📦 Starting ERC-4337 submission...");
  
      const {
        ENTRY_POINT,
        SMART_WALLET,
        PAYMASTER,
        BUNDLER_RPC,
        REGISTRY_ADDRESS
      } = window.ERC4337_CONFIG;
  
      // Connect to bundler and wallet
      const bundler = new ethers.providers.JsonRpcProvider(BUNDLER_RPC);
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
  
      // Encode registry.register(bytes32)
      const registryIface = new ethers.utils.Interface([
        "function register(bytes32 hash)"
      ]);
      const encodedCall = registryIface.encodeFunctionData("register", [hashHex]);
  
      // Wrap in smart wallet call: execute(address,uint256,bytes)
      const walletIface = new ethers.utils.Interface([
        "function execute(address dest, uint256 value, bytes calldata func)"
      ]);
      const callData = walletIface.encodeFunctionData("execute", [
        REGISTRY_ADDRESS,
        0,
        encodedCall
      ]);
  
      // Get nonce and gas price
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
        paymasterAndData: PAYMASTER || "0x", // fallback to empty string if none
        signature: "0x"
      };
  
      const packed = packUserOp(userOp);
      const { chainId } = await bundler.getNetwork();
      const userOpHash = await getUserOpHash(packed, ENTRY_POINT, chainId);
  
      // Sign using connected wallet (e.g. MetaMask)
      const signature = await signer.signMessage(ethers.utils.arrayify(userOpHash));
      userOp.signature = signature;
  
      // Send the UserOp via eth_sendUserOperation
      const result = await bundler.send("eth_sendUserOperation", [userOp, ENTRY_POINT]);
  
      console.log("✅ Submitted UserOperation:", result);
      alert("🎉 Your document hash was registered on-chain!");
      return result;
    };
  })();
  