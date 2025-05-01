// submitUserOp.js - Called by uploadToIPFS() once document is pinned
/*
export const pimlicoSmartAccountClient = (app) => {
 works like this:
First calls getPaymasterStubData with the factory + factoryData + callData format.
Then calls getPaymasterData with a sponsorship policy, EntryPoint v0.7, and proper gas fields.
Injects paymasterAndData, callGasLimit, and other required fields into the final UserOperation.
Logs everything with safeStringifyBigInts() for full visibility.

Inside getPaymasterStubData(client, parameters):

const { chainId, entryPointAddress, context, ...userOperation } = parameters
They split out chainId, entryPointAddress, and context.

Everything else (userOperation) must match UserOperation shape.

Then they call:


await client.request({
  method: 'pm_getPaymasterStubData',
  params: [
    {
      ...request,                          // 👈 UserOperation fields
      callGasLimit: request.callGasLimit ?? '0x0',
      verificationGasLimit: request.verificationGasLimit ?? '0x0',
      preVerificationGas: request.preVerificationGas ?? '0x0',
    },
    entryPointAddress,                     // 👈 String, eg '0x...'
    numberToHex(chainId),                  // 👈 BigInt converted to hex string like '0x1a4b1'
    context,                               // 👈 Optional (usually undefined)
  ]
})
⚙️ Updated Flow Summary

🔢 Step	What Happens
Encode callData to Registry	✅
Build LightAccount (factory/factoryData)	✅
Stub gas with paymaster	✅
Request real paymaster sponsorship	✅
Build UserOp (with sponsorship fields)	✅
Calculate required prefund + check balance	🔥
Estimate gas + boost verificationGasLimit if needed	🔥
Sign UserOp hash	✅
Submit to Pimlico Bundler	✅

*/




import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { encodeFunctionData, numberToHex, http, createPublicClient, parseAbi, concatHex } from 'viem';
import { getUserOperationHash, createBundlerClient, createPaymasterClient } from 'viem/account-abstraction';
import { arbitrum } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { toLightSmartAccount } from 'permissionless/accounts';
import { parseGwei } from 'viem/utils'
import { getRequiredPrefund } from 'permissionless';


const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS;
const ENTRY_POINT = process.env.ENTRY_POINT;
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;



function extractPaymasterFieldsFromPaymasterAndData(paymasterAndData) {
  if (!paymasterAndData || paymasterAndData.length < 42) {
    throw new Error('Invalid paymasterAndData');
  }
  const paymaster = `0x${paymasterAndData.slice(2, 42)}`; // first 20 bytes
  const paymasterData = `0x${paymasterAndData.slice(42)}`; // rest

  return {
    paymaster,
    paymasterData,
  };
}

function normalizeUserOpFieldsWithLogging(op) {
    const keysToNormalize = [
      'nonce',
      'callGasLimit',
      'verificationGasLimit',
      'preVerificationGas',
      'maxFeePerGas',
      'maxPriorityFeePerGas',
      'value',
      'paymasterVerificationGasLimit',
      'paymasterPostOpGasLimit'
    ];
  
    for (const key of keysToNormalize) {
      if (op[key] !== undefined) {
        try {
          op[key] = numberToHex(BigInt(op[key]));
        } catch (err) {
          console.error(`❌ Failed to normalize ${key}:`, op[key]);
          throw err;
        }
      }
    }
    return op;
  }
  



const safeStringifyBigInts = (obj) => JSON.stringify(obj, (key, value) =>
  typeof value === 'bigint' ? value.toString() : value,
2);



const paymasterClient = createPaymasterClient({
  transport: http(`${process.env.PIMLICO_PAYMASTER_RPC}`, {
    headers: {
      Authorization: `Bearer ${process.env.PIMLICO_API_KEY}`,
    },
  }),
});


console.log('🏭 FACTORY_ADDRESS:', process.env.FACTORY_ADDRESS);
console.log('🏦 ENTRY_POINT:', process.env.ENTRY_POINT);
console.log('🏦 REGISTRY_ADDRESS:', process.env.REGISTRY_ADDRESS);





export const pimlicoSmartAccountClient = (app) => {
    app.post('/pimlicoSmartAccountClient', async (req, res) => {
      try {
        const { documentHash } = req.body;
        if (!documentHash) throw new Error('Missing "documentHash" in request body');
  
        // Step 1: Encode call to Registry
        const registryCallData = encodeFunctionData({
          abi: [{
            name: 'register',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [{ name: 'documentHash', type: 'bytes32' }],
            outputs: [],
          }],
          functionName: 'register',
          args: [documentHash],
        });
  
        // Step 2: Wrap it for LightAccount
        const wrappedCallData = encodeFunctionData({
          abi: [{
            name: 'execute',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'value', type: 'uint256' },
              { name: 'data', type: 'bytes' },
            ],
            outputs: [],
          }],
          functionName: 'execute',
          args: [REGISTRY_ADDRESS, 0n, registryCallData],
        });
        console.log('📥 Calling sendUserOperation with:', { REGISTRY_ADDRESS, wrappedCallData });
  
      const privateKeyRaw = process.env.PRIVATE_KEY;
      if (!privateKeyRaw || typeof privateKeyRaw !== 'string' || privateKeyRaw.length < 64) {
        throw new Error('Invalid or missing PRIVATE_KEY — must be a 64-character hex string');
      }
      const privateKey = privateKeyRaw.startsWith('0x') ? privateKeyRaw : `0x${privateKeyRaw}`;
      const walletAccount = privateKeyToAccount(privateKey);
      console.log('🔑 Wallet address:', walletAccount.address);
  
      console.log('🌐 ARBITRUM_RPC_URL:', process.env.ARBITRUM_RPC_URL);
  
      const publicClient = createPublicClient({
        chain: arbitrum,
        transport: http(process.env.ARBITRUM_RPC_URL),
      });
  
      const factoryAddrUsed = FACTORY_ADDRESS || '0x0000000000400CdFef5E2714E63d8040b700BC24';
      const randomIndex = BigInt(Math.floor(Math.random() * 9000) + 1000);
  
        
        console.log('🎲 Random index:', randomIndex); 
        
        
        const smartAccount = await toLightSmartAccount({
            owner: walletAccount,
            client: publicClient,
            index: randomIndex,
            factoryAddress: factoryAddrUsed,
            version: '2.0.0' // VERY important: LightAccount v2 uses "2.0.0" schema for signatures
          });
      
          const { factory, factoryData } = await smartAccount.getFactoryArgs();
          const entryPoint = smartAccount.entryPoint;
          
          console.log('🏗️ LightAccount config:', safeStringifyBigInts({
            factory,
            factoryData,
            entryPoint: smartAccount.entryPoint,
          }));
          
          if (!factory || !factoryData) {
            console.error('🚨 factory,:', factory);
            console.error('🚨 factoryData:', factoryData);
            throw new Error(`🚨 Missing factory or factoryData: ${safeStringifyBigInts({ factory, factoryData })}`);
          }



      const nonce = await publicClient.readContract({
        address: entryPoint.address,
        abi: parseAbi(['function getNonce(address sender, uint192 key) view returns (uint256)']),
        functionName: 'getNonce',
        args: [smartAccount.address, 0n],
      });
      
      console.log('🔄 Nonce:', nonce);


      
      const rawStubParams = {
        sender: smartAccount.address,
        nonce,
        factory,
        factoryData,
        callData: wrappedCallData,
        signature: '0x',
        callGasLimit: '1550000',
        verificationGasLimit: '1550000',
        preVerificationGas: '1000000',
        maxFeePerGas: parseGwei('5'),          // ← set properly
        maxPriorityFeePerGas: parseGwei('1'),  // ← set properly
      };
      
      console.log('📤 Raw stub params:', rawStubParams);


      
      const sanitizedStubParams = {
        sender: rawStubParams.sender,
        nonce: numberToHex(BigInt(rawStubParams.nonce ?? 0n)),
        factory: rawStubParams.factory,
        factoryData: rawStubParams.factoryData || '0x',
        callData: rawStubParams.callData,
        signature: rawStubParams.signature || '0x',
        callGasLimit: numberToHex(BigInt(rawStubParams.callGasLimit ?? 1550000n)),
        verificationGasLimit: numberToHex(BigInt(rawStubParams.verificationGasLimit ?? 1000000n)),
        preVerificationGas: numberToHex(BigInt(rawStubParams.preVerificationGas ?? 1000000n)),
        maxFeePerGas: numberToHex(BigInt(rawStubParams.maxFeePerGas ?? 1550000n)),
        maxPriorityFeePerGas: numberToHex(BigInt(rawStubParams.maxPriorityFeePerGas ?? 1n)),
        value: '0x0',  // optional, but safe
      };
      delete sanitizedStubParams.value; 
      console.log('📦 Sanitized stub params:', JSON.parse(safeStringifyBigInts(sanitizedStubParams))); // <- 🔥 important


  
      const stubResponse = await paymasterClient.request({
        method: 'pm_getPaymasterStubData',
        params: [
          sanitizedStubParams,
          entryPoint.address,
          '0xa4b1'
        ]
      });      
      
      const stub = {
        ...stubResponse,
        paymasterVerificationGasLimit: stubResponse.paymasterVerificationGasLimit
          ? BigInt(stubResponse.paymasterVerificationGasLimit)
          : undefined,
        paymasterPostOpGasLimit: stubResponse.paymasterPostOpGasLimit
          ? BigInt(stubResponse.paymasterPostOpGasLimit)
          : undefined,
      };      
      
      console.log('📥 Stub response:', safeStringifyBigInts(stub));


      const boostedCallGasLimit = BigInt(sanitizedStubParams.callGasLimit) + 500_000n;
      const boostedVerificationGasLimit = BigInt(stub.paymasterVerificationGasLimit) + 300_000n;

  
      const sponsorshipParams = {
        sender: smartAccount.address,
        nonce: numberToHex(BigInt(nonce)),
        factory,
        factoryData,
        callData: wrappedCallData,
        callGasLimit: numberToHex(boostedCallGasLimit),
        verificationGasLimit: numberToHex(boostedVerificationGasLimit),
        preVerificationGas: sanitizedStubParams.preVerificationGas,
        maxFeePerGas: sanitizedStubParams.maxFeePerGas,
        maxPriorityFeePerGas: sanitizedStubParams.maxPriorityFeePerGas,
        signature: '0x',
        paymaster: null,
        paymasterData: null,
        paymasterVerificationGasLimit: numberToHex(stub.paymasterVerificationGasLimit),
        paymasterPostOpGasLimit: numberToHex(stub.paymasterPostOpGasLimit),
      };
            
      console.log('📤 Sponsorship params:', safeStringifyBigInts(sponsorshipParams));
  

      const sponsorship =  await paymasterClient.request({
        method: 'pm_getPaymasterData',
        params: [
          sponsorshipParams,
          entryPoint.address,
          '0xa4b1', // use 0xa4b1 not "42161" here for Pimlico
          { sponsorshipPolicyId: process.env.PIMLICO_SPONSORSHIP_POLICY_ID }
        ],
      });
      console.log('🎁 Sponsorship:', safeStringifyBigInts(sponsorship));
  

  
     
      
      const { paymaster, paymasterData } = extractPaymasterFieldsFromPaymasterAndData(
        sponsorship.paymaster + sponsorship.paymasterData.slice(2)
      );
      
      
            
  
      // 1. Build raw userOp (NO numberToHex)
      const userOp = {
        sender: smartAccount.address,
        nonce,
        factory,
        factoryData,
        callData: wrappedCallData,
        callGasLimit: sponsorshipParams.callGasLimit,
        verificationGasLimit: numberToHex(boostedVerificationGasLimit),   // <--- BOOSTED here
        preVerificationGas: sponsorshipParams.preVerificationGas,
        maxFeePerGas: sponsorshipParams.maxFeePerGas,
        maxPriorityFeePerGas: sponsorshipParams.maxPriorityFeePerGas,
        paymaster,
        paymasterVerificationGasLimit: numberToHex(stub.paymasterVerificationGasLimit ?? 60000n),
        paymasterPostOpGasLimit: numberToHex(stub.paymasterPostOpGasLimit ?? 20000n),
        paymasterData,
        signature: '0x',
    };
    
  
  // 2. Normalize userOp
  const normalizedUserOp = normalizeUserOpFieldsWithLogging({ ...userOp });
  
  // 3. Prefund check
  const requiredPrefund = getRequiredPrefund({ userOperation: normalizedUserOp });
  console.log('🔧 Required Prefund (wei):', requiredPrefund.toString());
  
  const senderBalance = await publicClient.getBalance({ address: smartAccount.address });
  console.log('💰 Sender Balance (wei):', senderBalance.toString());
  
  if (senderBalance < requiredPrefund) {
    console.warn(`⚠️ Sender does not have enough prefund: requires ${requiredPrefund}, but has ${senderBalance}`);
  }
  
  // 4. Continue signing & submitting the normalizedUserOp
  const userOpHash = getUserOperationHash({
    chainId: 42161,
    entryPointAddress: entryPoint.address,
    entryPointVersion: '0.7',
    userOperation: normalizedUserOp,
  });
  
  console.log('🖋️ UserOpHash to sign:', userOpHash);
  
  const rawSignature = await walletAccount.signMessage({ message: { raw: userOpHash } });

// prepend the SignatureType
const signatureWithType = concatHex(['0x00', rawSignature]);

normalizedUserOp.signature = signatureWithType;
  
  console.log('🖋️ Final signed UserOp:', safeStringifyBigInts(normalizedUserOp));

  const bundlerClient = createBundlerClient({
    account: smartAccount,
    client: publicClient,
    transport: http(process.env.PIMLICO_BUNDLER_RPC, {
      headers: {
        Authorization: `Bearer ${process.env.PIMLICO_API_KEY}`,
      },
    }),
  });

  
  // 5. Submit
  const sendResponse = await bundlerClient.request({
    method: 'eth_sendUserOperation',
    params: [normalizedUserOp, ENTRY_POINT],
  });

  console.log('✅ UserOp submitted. Hash:', sendResponse);

  // 👇 Add Pimlico follow-up to get the real on-chain txHash
  const userOpHashFromBundler = sendResponse;
  let transactionHash = null;
  const maxRetries = 5;
  const delay = 2000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const resp = await fetch(`https://api.pimlico.io/v2/42161/user-operations/${userOpHashFromBundler}?apikey=${process.env.PIMLICO_API_KEY}`);
    const json = await resp.json();

    if (json.transactionHash) {
      transactionHash = json.transactionHash;
      break;
    }
    await new Promise(res => setTimeout(res, delay));
  }

  if (!transactionHash) {
    console.warn("⏳ Timed out waiting for transaction hash");
    return res.json({ hash: userOpHash });
  }

  return res.json({ hash: transactionHash });
  
    } catch (err) {
      console.error('❌ /pimlicoSmartAccountClient error:', err.stack || err);
      res.status(500).json({ error: err.message });
    }
  
  });
  
  };
