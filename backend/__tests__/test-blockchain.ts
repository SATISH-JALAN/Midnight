/**
 * Test script for BlockchainService
 * Run: bun run src/test-blockchain.ts
 */

import { blockchainService } from './services/BlockchainService.js';

async function testBlockchainService() {
  console.log('🔗 Testing BlockchainService...\n');

  // Step 1: Test connection
  console.log('1️⃣ Testing blockchain connection...');
  const connected = await blockchainService.testConnection();
  
  if (!connected) {
    console.log('❌ Failed to connect to blockchain. Check RPC_URL in .env');
    return;
  }
  console.log('✅ Blockchain connection successful!\n');

  // Step 2: Check free mints for a test address
  const testAddress = '0xA87D3656C7Cc2812A687953b3A88EF1D07494faA'; // Deployer address
  console.log('2️⃣ Checking free mints remaining for:', testAddress);
  const freeMints = await blockchainService.getFreeMintRemaining(testAddress);
  console.log('   Free mints remaining today:', freeMints);

  // Step 3: Check mint fee
  console.log('\n3️⃣ Checking mint fee...');
  const mintFee = await blockchainService.getMintFee(testAddress);
  console.log('   Mint fee:', mintFee, 'MNT');

  console.log('\n🎉 BlockchainService test complete!');
  console.log('\n📝 Note: To test actual minting, use the upload endpoint.');
}

testBlockchainService();
