/**
 * Smart Contract Configuration for Midnight Radio
 * 
 * Deployed on Mantle Sepolia Testnet
 */

// Contract Addresses (Mantle Sepolia) - Properly checksummed (EIP-55)
export const VOICE_NOTE_NFT_ADDRESS = '0x0b118a0F67D6F2329ad993A844549aED4cEa0E15' as const;
export const TIPPING_POOL_ADDRESS = '0x3543243e2dD9027d8f7Ad53373f31d155ffc410F' as const;

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

// Chain ID for Mantle Sepolia
export const MANTLE_SEPOLIA_CHAIN_ID = 5003;
