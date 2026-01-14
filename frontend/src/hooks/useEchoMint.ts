/**
 * Hook for registering echo replies on-chain
 * User pays the echo fee (split 20% to broadcaster, 80% to platform)
 * Multi-chain support via wagmi
 */

import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi';
import { useState, useCallback, useMemo } from 'react';
import { getChainById } from '@/lib/wagmi';
import { getChainConfig } from '@/lib/chains';

// EchoRegistry ABI (minimal for what we need)
const ECHO_REGISTRY_ABI = [
  {
    inputs: [
      { name: 'parentNoteId', type: 'string' },
      { name: 'echoNoteId', type: 'string' },
      { name: 'metadataUrl', type: 'string' },
      { name: 'parentBroadcaster', type: 'address' },
    ],
    name: 'registerEcho',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getEchoFee',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface EchoMintResult {
  txHash: string;
  success: boolean;
  error?: string;
}

export interface UseEchoMintReturn {
  registerEcho: (
    parentNoteId: string,
    echoNoteId: string,
    metadataUrl: string,
    parentBroadcaster: string
  ) => Promise<EchoMintResult>;
  getEchoFee: () => Promise<bigint>;
  isPending: boolean;
  isConfirming: boolean;
  error: string | null;
  chainId: number;
  nativeCurrency: string;
}

export function useEchoMint(userAddress: `0x${string}` | undefined): UseEchoMintReturn {
  const [error, setError] = useState<string | null>(null);
  const chainId = useChainId();
  
  // Get dynamic contract address based on current chain
  const echoAddress = useMemo(() => {
    const config = getChainConfig(chainId);
    return config.contracts.echoRegistry as `0x${string}`;
  }, [chainId]);
  
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

  // Read echo fee
  const { refetch: refetchEchoFee } = useReadContract({
    address: echoAddress,
    abi: ECHO_REGISTRY_ABI,
    functionName: 'getEchoFee',
    query: {
      enabled: false, // Manual fetch only
    },
  });

  const getEchoFee = useCallback(async (): Promise<bigint> => {
    try {
      const result = await refetchEchoFee();
      if (result.data !== undefined && result.data !== null) {
        return result.data as bigint;
      }
      // Default echo fee (0.001 MNT/ETH)
      console.warn('[useEchoMint] Could not read echo fee, using default');
      return BigInt(1000000000000000); // 0.001 ether
    } catch (err) {
      console.error('[useEchoMint] Failed to get echo fee:', err);
      return BigInt(1000000000000000); // Default 0.001
    }
  }, [refetchEchoFee]);

  const registerEcho = useCallback(async (
    parentNoteId: string,
    echoNoteId: string,
    metadataUrl: string,
    parentBroadcaster: string
  ): Promise<EchoMintResult> => {
    setError(null);
    
    if (!userAddress) {
      setError('Wallet not connected');
      return { txHash: '', success: false, error: 'Wallet not connected' };
    }

    try {
      // Get echo fee
      const echoFee = await getEchoFee();

      // Call registerEcho function
      const hash = await writeContractAsync({
        address: echoAddress,
        abi: ECHO_REGISTRY_ABI,
        functionName: 'registerEcho',
        args: [parentNoteId, echoNoteId, metadataUrl, parentBroadcaster as `0x${string}`],
        value: echoFee,
        chain: chain,
        account: userAddress,
      } as any);

      return {
        txHash: hash,
        success: true,
      };
    } catch (err: any) {
      console.error('[useEchoMint] Echo registration failed:', err);
      
      // Parse common errors
      let errorMessage = 'Echo registration failed';
      if (err.message?.includes('User rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = `Insufficient ${chainConfig.nativeCurrency.symbol} for echo fee`;
      } else if (err.shortMessage) {
        errorMessage = err.shortMessage;
      }
      
      setError(errorMessage);
      return { txHash: '', success: false, error: errorMessage };
    }
  }, [userAddress, getEchoFee, writeContractAsync, echoAddress, chain, chainId, chainConfig]);

  return {
    registerEcho,
    getEchoFee,
    isPending,
    isConfirming,
    error,
    chainId,
    nativeCurrency: chainConfig.nativeCurrency.symbol,
  };
}
