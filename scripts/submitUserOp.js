const { getUserOpHash, packUserOp } = window.AccountAbstractionUtils;
const { ethers } = window;

export async function handlePostUploadSubmission({ hashHex, ipfsHash, userAddress }) {
  console.log("📦 Starting ERC-4337 submission...");
  const ENTRY_POINT = "0xE624D5227a5EefaC396426Cf8f16E6A34294bDE0";
  const SMART_WALLET = "0xF22570437AC863b105a7BbD49979831286D8e9BE";
  const REGISTRY_ADDRESS = "0x6C06aD114856E341540F53Cd377eF24c176034B3";
  const PAYMASTER = "0x9e662d0ce3Eb47761BaC126aDFb27F714d819898"; // or "" for none
  const BUNDLER_RPC = "https://arb-mainnet.g.alchemy.com/v2/R3hvZ2ZEkRFc0agXhqctMfFMYym9YvMa";

  const bundler = new ethers.providers.JsonRpcProvider(BUNDLER_RPC);
  const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

  // 🔧 Encode registry.register(hash)
  const registryIface = new ethers.utils.Interface([
    "function register(bytes32 hash)"
  ]);
  const encodedCall = registryIface.encodeFunctionData("register", [hashHex]);

  // 🧠 Build callData for your smart wallet
  const walletIface = new ethers.utils.Interface([
    "function execute(address dest, uint256 value, bytes calldata func)"
  ]);
  const callData = walletIface.encodeFunctionData("execute", [
    REGISTRY_ADDRESS,
    0,
    encodedCall
  ]);

  // 🧮 Get sender nonce
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
  const network = await bundler.getNetwork();
  const hash = await getUserOpHash(packed, ENTRY_POINT, network.chainId);

  const sig = await signer.signMessage(ethers.utils.arrayify(hash));
  userOp.signature = sig;

  const result = await bundler.send("eth_sendUserOperation", [userOp, ENTRY_POINT]);
  console.log("✅ UserOperation submitted:", result);
  alert("🎉 Document registered on-chain via ERC-4337!");
  return result;
}
