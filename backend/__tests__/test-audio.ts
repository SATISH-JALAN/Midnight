/**
 * Test script for AudioProcessor
 * Run: bun run src/test-audio.ts
 */

import { audioProcessor } from './services/AudioProcessor.js';
import { readFile } from 'fs/promises';
import path from 'path';

async function testAudioProcessor() {
  console.log('🎵 Testing AudioProcessor...\n');

  // Check if test file exists, otherwise create a simple test
  const testFilePath = './uploads/temp/test-audio.webm';
  
  try {
    // Try to read an existing test file
    const buffer = await readFile(testFilePath);
    console.log(`📁 Found test file: ${testFilePath} (${buffer.length} bytes)`);
    
    const result = await audioProcessor.process(buffer, 'test-audio.webm');
    
    console.log('\n✅ Processing complete!');
    console.log('   Note ID:', result.noteId);
    console.log('   Output:', result.outputPath);
    console.log('   Duration:', result.duration, 'seconds');
    console.log('   Waveform points:', result.waveform.length);
    console.log('   Waveform sample:', result.waveform.slice(0, 5).map(v => v.toFixed(2)).join(', '), '...');
    
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      console.log('⚠️  No test file found at:', testFilePath);
      console.log('\nTo test, place a WebM audio file at that path and run again.');
      console.log('Or record audio from the frontend and check the upload endpoint.\n');
      
      // Test that FFmpeg is available
      console.log('🔍 Checking FFmpeg availability...');
      const proc = Bun.spawn(['ffmpeg', '-version'], {
        stdout: 'pipe',
        stderr: 'pipe',
      });
      const output = await new Response(proc.stdout).text();
      
      if (output.includes('ffmpeg version')) {
        console.log('✅ FFmpeg is installed and accessible!');
        console.log('   Version:', output.split('\n')[0]);
      } else {
        console.log('❌ FFmpeg not found. Please restart your terminal to load PATH.');
      }
    } else {
      console.error('❌ Error:', err.message);
    }
  }
}

testAudioProcessor();
