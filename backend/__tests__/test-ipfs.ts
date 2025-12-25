/**
 * Test script for IPFSService
 * Run: bun run src/test-ipfs.ts
 */

import { ipfsService } from './services/IPFSService.js';
import { audioProcessor } from './services/AudioProcessor.js';
import { readFile, writeFile } from 'fs/promises';

async function testIPFSService() {
  console.log('🌐 Testing IPFS Service (Pinata)...\n');

  // Step 1: Test connection
  console.log('1️⃣ Testing Pinata connection...');
  const connected = await ipfsService.testConnection();
  
  if (!connected) {
    console.log('❌ Failed to connect to Pinata. Check your JWT token.');
    return;
  }
  console.log('✅ Pinata connection successful!\n');

  // Step 2: Try uploading a test file (if available)
  const testAudioPath = './uploads/notes/test-sample.mp3';
  
  try {
    // Check if we have a test file
    await readFile(testAudioPath);
    console.log('2️⃣ Found test audio file, uploading to IPFS...');
    
    const result = await ipfsService.upload(testAudioPath, {
      noteId: 'test-' + Date.now(),
      duration: 30,
      moodColor: '#0EA5E9',
      waveform: Array.from({ length: 100 }, () => Math.random()),
      broadcaster: '0x1234567890123456789012345678901234567890',
      timestamp: Date.now(),
    });

    console.log('\n✅ Upload successful!');
    console.log('   Audio Hash:', result.audioHash);
    console.log('   Metadata Hash:', result.metadataHash);
    console.log('   Audio URL:', result.audioUrl);
    console.log('   Metadata URL:', result.metadataUrl);

  } catch (err: any) {
    if (err.code === 'ENOENT') {
      console.log('ℹ️  No test audio file found at:', testAudioPath);
      console.log('   Skipping upload test. Connection verified!\n');
      console.log('   To test upload, place an MP3 file at that path.\n');
    } else {
      console.error('❌ Error:', err.message);
    }
  }

  console.log('🎉 IPFS Service test complete!');
}

testIPFSService();
