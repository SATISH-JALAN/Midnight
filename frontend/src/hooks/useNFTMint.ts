/**
 * Hook for minting Voice Note NFTs on Mantle
 * Uses wagmi for client-side transaction signing
 */

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { useState, useCallback } from 'react';
import { 
  VOICE_NOTE_NFT_ADDRESS, 
  VOICE_NOTE_NFT_ABI,
  MANTLE_SEPOLIA_CHAIN_ID 
} from '@/lib/contracts';
import { mantleSepolia } from '@/lib/wagmi';

export interface MintResult {
  txHash: string;
  success: boolean;
  error?: string;
}

export interface UseNFTMintReturn {
  mint: (noteId: string, metadataUrl: string) => Promise<MintResult>;
  getMintFee: () => Promise<bigint>;
  getFreeMints: () => Promise<number>;
  isPending: boolean;
  isConfirming: boolean;
  error: string | null;
}

export function useNFTMint(userAddress: `0x${string}` | undefined): UseNFTMintReturn {
  const [error, setError] = useState<string | null>(null);

  // Write contract hook
  const { 
    writeContractAsync, 
    isPending,
    data: txHash,
  } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Read mint fee
  const { refetch: refetchMintFee } = useReadContract({
    address: VOICE_NOTE_NFT_ADDRESS,
    abi: VOICE_NOTE_NFT_ABI,
    functionName: 'getMintFee',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: false, // Manual fetch only
    },
  });

  // Read free mints remaining
  const { refetch: refetchFreeMints } = useReadContract({
    address: VOICE_NOTE_NFT_ADDRESS,
    abi: VOICE_NOTE_NFT_ABI,
    functionName: 'getFreeMintRemaining',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: false,
    },
  });

  const getMintFee = useCallback(async (): Promise<bigint> => {
    if (!userAddress) return BigInt(0);
    try {
      const result = await refetchMintFee();
      console.log('[useNFTMint] getMintFee result:', result);
      
      if (result.data !== undefined && result.data !== null) {
        return result.data as bigint;
      }
      // If we can't read the fee, assume paid mint
      console.warn('[useNFTMint] Could not read mint fee, using default');
      return parseEther('0.001');
    } catch (err) {
      console.error('[useNFTMint] Failed to get mint fee:', err);
      return parseEther('0.001'); // Default fee
    }
  }, [userAddress, refetchMintFee]);

  const getFreeMints = useCallback(async (): Promise<number> => {
    if (!userAddress) return 0;
    try {
      const result = await refetchFreeMints();
      console.log('[useNFTMint] getFreeMints result:', result);
      return Number(result.data ?? 0);
    } catch (err) {
      console.error('[useNFTMint] Failed to get free mints:', err);
      return 0;
    }
  }, [userAddress, refetchFreeMints]);

  const mint = useCallback(async (
    noteId: string, 
    metadataUrl: string
  ): Promise<MintResult> => {
    setError(null);
    
    if (!userAddress) {
      setError('Wallet not connected');
      return { txHash: '', success: false, error: 'Wallet not connected' };
    }

    console.log('[useNFTMint] Starting mint...', { noteId, metadataUrl, userAddress });

    try {
      // Get mint fee
      const mintFee = await getMintFee();
      console.log('[useNFTMint] Mint fee:', mintFee.toString());

      // Call mint function - using type assertion to fix wagmi typing
      const hash = await writeContractAsync({
        address: VOICE_NOTE_NFT_ADDRESS,
        abi: VOICE_NOTE_NFT_ABI,
        functionName: 'mint',
        args: [userAddress, noteId, metadataUrl],
        value: mintFee,
        chain: mantleSepolia,
        account: userAddress,
      } as any);

      console.log('[useNFTMint] Transaction submitted:', hash);

      return {
        txHash: hash,
        success: true,
      };
    } catch (err: any) {
      console.error('[useNFTMint] Mint failed:', err);
      
      // Parse common errors
      let errorMessage = 'Minting failed';
      if (err.message?.includes('User rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient MNT for gas';
      } else if (err.shortMessage) {
        errorMessage = err.shortMessage;
      }
      
      setError(errorMessage);
      return { txHash: '', success: false, error: errorMessage };
    }
  }, [userAddress, getMintFee, writeContractAsync]);

  return {
    mint,
    getMintFee,
    getFreeMints,
    isPending,
    isConfirming,
    error,
  };
}
