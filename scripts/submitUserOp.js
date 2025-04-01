(async function () {
    // Wait for window.AccountAbstractionUtils to be loaded
    while (!window.AccountAbstractionUtils || !window.AccountAbstractionUtils.getUserOpHash) {
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
  
      const bundler = new ethers.providers.JsonRpcProvider(BUNDLER_RPC);
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
  
      const registryIface = new ethers.utils.Interface(["function register(bytes32 hash)"]);
      const encodedCall = registryIface.encodeFunctionData("register", [hashHex]);
  
      const walletIface = new ethers.utils.Interface([
        "function execute(address dest, uint256 value, bytes calldata func)"
      ]);
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
        paymasterAndData: PAYMASTER,
        signature: "0x"
      };
  
      const packed = packUserOp(userOp);
      const { chainId } = await bundler.getNetwork();
      const userOpHash = await getUserOpHash(packed, ENTRY_POINT, chainId);
  
      const signature = await signer.signMessage(ethers.utils.arrayify(userOpHash));
      userOp.signature = signature;
  
      const result = await bundler.send("eth_sendUserOperation", [userOp, ENTRY_POINT]);
      console.log("✅ Submitted UserOperation:", result);
      alert("🎉 Your document hash was registered on-chain!");
      return result;
    };
  })();
  
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
  
      // Connect to bundler and signer
      const bundler = new ethers.providers.JsonRpcProvider(BUNDLER_RPC);
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
  
      // Encode call: registry.register(bytes32)
      const registryIface = new ethers.utils.Interface([
        "function register(bytes32 hash)"
      ]);
      const encodedCall = registryIface.encodeFunctionData("register", [hashHex]);
  
      // Encode smart wallet execute(dest, value, data)
      const walletIface = new ethers.utils.Interface([
        "function execute(address dest, uint256 value, bytes calldata func)"
      ]);
      const callData = walletIface.encodeFunctionData("execute", [
        REGISTRY_ADDRESS,
        0,
        encodedCall
      ]);
  
      // Estimate nonce and gas price
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
        paymasterAndData: PAYMASTER, // use "" for no sponsor
        signature: "0x"
      };
  
      // Pack & hash
      const packed = packUserOp(userOp);
      const { chainId } = await bundler.getNetwork();
      const userOpHash = await getUserOpHash(packed, ENTRY_POINT, chainId);
  
      // MetaMask signature
      const signature = await signer.signMessage(ethers.utils.arrayify(userOpHash));
      userOp.signature = signature;
  
      // Submit via bundler
      const result = await bundler.send("eth_sendUserOperation", [userOp, ENTRY_POINT]);
      console.log("✅ Submitted UserOperation:", result);
      alert("🎉 Your document hash was registered on-chain!");
      return result;
    };
  })();
  