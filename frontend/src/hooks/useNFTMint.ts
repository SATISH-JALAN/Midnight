/**
 * Hook for minting Voice Note NFTs
 * Multi-chain support: Uses wagmi for client-side transaction signing
 * Dynamically uses the currently connected chain's contract address
 */

import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { useState, useCallback, useMemo } from 'react';
import { VOICE_NOTE_NFT_ABI } from '@/lib/contracts';
import { getVoiceNoteNFTAddress } from '@/lib/contracts';
import { getChainById } from '@/lib/wagmi';
import { getChainConfig } from '@/lib/chains';

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
  chainId: number;
  nativeCurrency: string;
}

export function useNFTMint(userAddress: `0x${string}` | undefined): UseNFTMintReturn {
  const [error, setError] = useState<string | null>(null);
  const chainId = useChainId();
  
  // Get dynamic contract address based on current chain
  const nftAddress = useMemo(() => getVoiceNoteNFTAddress(chainId), [chainId]);
  const chain = useMemo(() => getChainById(chainId), [chainId]);
  const chainConfig = useMemo(() => getChainConfig(chainId), [chainId]);

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

  // Read mint fee - using dynamic address
  const { refetch: refetchMintFee } = useReadContract({
    address: nftAddress,
    abi: VOICE_NOTE_NFT_ABI,
    functionName: 'getMintFee',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: false, // Manual fetch only
    },
  });

  // Read free mints remaining - using dynamic address
  const { refetch: refetchFreeMints } = useReadContract({
    address: nftAddress,
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

      
      if (result.data !== undefined && result.data !== null) {
        return result.data as bigint;
      }
      // If we can't read the fee, assume paid mint
      console.warn('[useNFTMint] Could not read mint fee, using default');
      return parseEther('0.01');
    } catch (err) {
      console.error('[useNFTMint] Failed to get mint fee:', err);
      return parseEther('0.01'); // Default fee
    }
  }, [userAddress, refetchMintFee, chainId]);

  const getFreeMints = useCallback(async (): Promise<number> => {
    if (!userAddress) return 0;
    try {
      const result = await refetchFreeMints();

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



    try {
      // Get mint fee
      const mintFee = await getMintFee();


      // Call mint function - uses current chain
      const hash = await writeContractAsync({
        address: nftAddress,
        abi: VOICE_NOTE_NFT_ABI,
        functionName: 'mint',
        args: [userAddress, noteId, metadataUrl],
        value: mintFee,
        chain: chain,
        account: userAddress,
      } as any);

      console.log('[useNFTMint] Transaction submitted:', hash, 'on chain:', chainId);

      return {
        txHash: hash,
        success: true,
      };
    } catch (err: any) {
      console.error('[useNFTMint] Mint failed:', err);
      
      // Parse common errors with chain-aware messaging
      let errorMessage = 'Minting failed';
      if (err.message?.includes('User rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = `Insufficient ${chainConfig.nativeCurrency.symbol} for gas`;
      } else if (err.shortMessage) {
        errorMessage = err.shortMessage;
      }
      
      setError(errorMessage);
      return { txHash: '', success: false, error: errorMessage };
    }
  }, [userAddress, getMintFee, writeContractAsync, nftAddress, chain, chainId, chainConfig]);

  return {
    mint,
    getMintFee,
    getFreeMints,
    isPending,
    isConfirming,
    error,
    chainId,
    nativeCurrency: chainConfig.nativeCurrency.symbol,
  };
}
