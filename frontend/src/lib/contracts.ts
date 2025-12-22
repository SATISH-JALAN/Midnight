/**
 * Smart Contract Configuration for Midnight Radio
 * 
 * Multi-chain support: Mantle Sepolia + Arbitrum Sepolia
 */

import { getContractAddress, DEFAULT_CHAIN_ID } from './chains';

// ============================================
// LEGACY EXPORTS (for backward compatibility)
// These use the default chain (Mantle Sepolia)
// ============================================
export const VOICE_NOTE_NFT_ADDRESS = getContractAddress(DEFAULT_CHAIN_ID, 'voiceNoteNFT');
export const TIPPING_POOL_ADDRESS = getContractAddress(DEFAULT_CHAIN_ID, 'tippingPool');
export const ECHO_REGISTRY_ADDRESS = getContractAddress(DEFAULT_CHAIN_ID, 'echoRegistry');

// ============================================
// DYNAMIC ADDRESS GETTERS (for multi-chain)
// ============================================
export function getVoiceNoteNFTAddress(chainId: number | undefined): `0x${string}` {
  return getContractAddress(chainId, 'voiceNoteNFT');
}

export function getTippingPoolAddress(chainId: number | undefined): `0x${string}` {
  return getContractAddress(chainId, 'tippingPool');
}

export function getEchoRegistryAddress(chainId: number | undefined): `0x${string}` {
  return getContractAddress(chainId, 'echoRegistry');
}

// ============================================
// CHAIN IDs
// ============================================
export const MANTLE_SEPOLIA_CHAIN_ID = 5003;
export const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

// ============================================
// ABIs (same for all chains - contracts are identical)
// ============================================

// VoiceNoteNFT ABI (only functions we need for frontend)
export const VOICE_NOTE_NFT_ABI = [
  // Read functions
  {
    name: 'getMintFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getFreeMintRemaining',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  // Write functions
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'noteId', type: 'string' },
      { name: 'metadataUri', type: 'string' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  // Events
  {
    name: 'VoiceNoteMinted',
    type: 'event',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'noteId', type: 'string', indexed: false },
      { name: 'broadcaster', type: 'address', indexed: true },
      { name: 'expiresAt', type: 'uint256', indexed: false },
    ],
  },
] as const;

// TippingPool ABI  
export const TIPPING_POOL_ABI = [
  {
    name: 'tip',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'broadcaster', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'getTotalTips',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'TipReceived',
    type: 'event',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'tipper', type: 'address', indexed: true },
      { name: 'broadcaster', type: 'address', indexed: true },
      { name: 'tipAmount', type: 'uint256', indexed: false },
      { name: 'platformFee', type: 'uint256', indexed: false },
      { name: 'broadcasterAmount', type: 'uint256', indexed: false },
    ],
  },
] as const;

// EchoRegistry ABI
export const ECHO_REGISTRY_ABI = [
  {
    name: 'registerEcho',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'parentNoteId', type: 'string' },
      { name: 'echoNoteId', type: 'string' },
      { name: 'metadataUrl', type: 'string' },
      { name: 'parentBroadcaster', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'getEchoFee',
    type: 'function',
    stateMutability: 'pure',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getEchoCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'parentNoteId', type: 'string' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;
