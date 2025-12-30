import { ethers } from 'ethers';
import { env, getChainEnvConfig, DEFAULT_CHAIN_ID } from '../config/env.js';
import { logger } from '../config/logger.js';

// VoiceNoteNFT ABI (includes read functions for blockchain queries)
const VOICE_NOTE_NFT_ABI = [
  // Write functions
  'function mint(address to, string noteId, string metadataUri) external payable returns (uint256)',
  // Read functions
  'function getMintFee(address user) external view returns (uint256)',
  'function getFreeMintRemaining(address user) external view returns (uint256)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function notes(uint256 tokenId) external view returns (string noteId, address broadcaster, uint256 createdAt, uint256 expiresAt, bool isGhost)',
  // Events
  'event VoiceNoteMinted(uint256 indexed tokenId, string noteId, address indexed broadcaster, uint256 expiresAt)',
];

// TippingPool ABI
const TIPPING_POOL_ABI = [
  'function tip(uint256 tokenId, address broadcaster) external payable',
  'function getTotalTips(uint256 tokenId) external view returns (uint256)',
  'event TipReceived(uint256 indexed tokenId, address indexed tipper, address indexed broadcaster, uint256 tipAmount, uint256 platformFee, uint256 broadcasterAmount)',
];

// EchoRegistry ABI - Updated to include metadataUrl for persistence
const ECHO_REGISTRY_ABI = [
  'function registerEcho(string parentNoteId, string echoNoteId, string metadataUrl, address parentBroadcaster) external payable',
  'function getEchoFee() external pure returns (uint256)',
  'function getEchoCount(string parentNoteId) external view returns (uint256)',
  'function checkIsEcho(string noteId) external view returns (bool)',
  'function getParent(string echoNoteId) external view returns (string)',
  'function getEchoes(string parentNoteId) external view returns (tuple(string echoNoteId, string parentNoteId, string metadataUrl, address echoBroadcaster, address parentBroadcaster, uint256 timestamp)[])',
  'event EchoRegistered(string indexed parentNoteId, string indexed echoNoteId, address echoBroadcaster, address parentBroadcaster, uint256 timestamp, uint256 creatorPayment, uint256 platformPayment)',
];

export interface MintResult {
  tokenId: number;
  txHash: string;
  expiresAt: number;
}

// NFT data structure returned from blockchain queries
export interface NFTData {
  tokenId: string;
  noteId: string;
  owner: string;
  tokenURI: string;
  metadata: any | null;
  tips: number;
  echoes: number;
  audioUrl?: string;
  duration?: number;
  moodColor?: string;
  sector?: string;
  waveform?: number[];
  createdAt?: string;
  expiresAt?: string;
  isGhost?: boolean;
  chainId?: number;
}

// Chain-specific contracts
interface ChainContracts {
  provider: ethers.JsonRpcProvider;
  wallet: ethers.Wallet;
  nftContract: ethers.Contract;
  tippingContract: ethers.Contract;
  echoContract: ethers.Contract;
  readOnlyNftContract: ethers.Contract;
  readOnlyTippingContract: ethers.Contract;
  readOnlyEchoContract: ethers.Contract;
}

export class BlockchainService {
  private chains: Map<number, ChainContracts> = new Map();
  private defaultChainId: number = DEFAULT_CHAIN_ID;

  constructor() {
    // Initialize Mantle Sepolia (primary chain)
    const mantleConfig = getChainEnvConfig(5003);
    if (mantleConfig) {
      this.initChain(5003, mantleConfig);
    }

    // Initialize Arbitrum Sepolia (if configured)
    const arbitrumConfig = getChainEnvConfig(421614);
    if (arbitrumConfig) {
      this.initChain(421614, arbitrumConfig);
      logger.info('Arbitrum Sepolia chain initialized');
    }
  }

  /**
   * Initialize contracts for a specific chain
   */
  private initChain(chainId: number, config: { rpc: string; nft: string; tipping: string; echo: string }) {
    const provider = new ethers.JsonRpcProvider(config.rpc);
    const wallet = new ethers.Wallet(env.PRIVATE_KEY, provider);

    const contracts: ChainContracts = {
      provider,
      wallet,
      // Contracts with wallet (for write operations)
      nftContract: new ethers.Contract(config.nft, VOICE_NOTE_NFT_ABI, wallet),
      tippingContract: new ethers.Contract(config.tipping, TIPPING_POOL_ABI, wallet),
      echoContract: new ethers.Contract(config.echo, ECHO_REGISTRY_ABI, wallet),
      // Read-only contracts (for queries - uses provider directly)
      readOnlyNftContract: new ethers.Contract(config.nft, VOICE_NOTE_NFT_ABI, provider),
      readOnlyTippingContract: new ethers.Contract(config.tipping, TIPPING_POOL_ABI, provider),
      readOnlyEchoContract: new ethers.Contract(config.echo, ECHO_REGISTRY_ABI, provider),
    };

    this.chains.set(chainId, contracts);

    logger.info({
      chainId,
      nftContract: config.nft,
      tippingContract: config.tipping,
      echoContract: config.echo,
      wallet: wallet.address,
    }, `BlockchainService initialized for chain ${chainId}`);
  }

  /**
   * Get contracts for a specific chain
   * Falls back to default chain if not specified or not found
   */
  private getChain(chainId?: number): ChainContracts {
    const id = chainId || this.defaultChainId;
    const chain = this.chains.get(id);
    
    if (!chain) {
      // Fall back to default
      const defaultChain = this.chains.get(this.defaultChainId);
      if (!defaultChain) {
        throw new Error(`No blockchain configured for chain ${id} or default`);
      }
      logger.warn({ requestedChain: id, fallbackChain: this.defaultChainId }, 'Chain not configured, using default');
      return defaultChain;
    }
    
    return chain;
  }

  /**
   * Check if a chain is supported
   */
  isChainSupported(chainId: number): boolean {
    return this.chains.has(chainId);
  }

  /**
   * Get list of supported chains
   */
  getSupportedChains(): number[] {
    return Array.from(this.chains.keys());
  }

  /**
   * Mint a new voice note NFT
   */
  async mintNFT(
    broadcasterAddress: string,
    noteId: string,
    metadataUri: string,
    chainId?: number
  ): Promise<MintResult> {
    const { nftContract } = this.getChain(chainId);
    logger.info({ noteId, broadcasterAddress, chainId: chainId || this.defaultChainId }, 'Minting NFT');

    try {
      // Get mint fee for the broadcaster
      const mintFee = await nftContract.getMintFee(broadcasterAddress);
      logger.debug({ noteId, mintFee: mintFee.toString() }, 'Mint fee calculated');

      // Mint the NFT
      const tx = await nftContract.mint(
        broadcasterAddress,
        noteId,
        metadataUri,
        { value: mintFee }
      );

      logger.info({ noteId, txHash: tx.hash }, 'Mint transaction sent');

      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Parse the VoiceNoteMinted event to get tokenId
      const mintEvent = receipt.logs
        .map((log: any) => {
          try {
            return nftContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.name === 'VoiceNoteMinted');

      if (!mintEvent) {
        throw new Error('VoiceNoteMinted event not found');
      }

      const tokenId = Number(mintEvent.args.tokenId);
      const expiresAt = Number(mintEvent.args.expiresAt) * 1000; // Convert to milliseconds

      logger.info({ noteId, tokenId, txHash: tx.hash, chainId: chainId || this.defaultChainId }, 'NFT minted successfully');

      return {
        tokenId,
        txHash: tx.hash,
        expiresAt,
      };
    } catch (err: any) {
      logger.error({ err, noteId }, 'Failed to mint NFT');
      throw new Error(`NFT minting failed: ${err.message}`);
    }
  }

  /**
   * Get remaining free mints for a user today
   */
  async getFreeMintRemaining(userAddress: string, chainId?: number): Promise<number> {
    const { nftContract } = this.getChain(chainId);
    try {
      const remaining = await nftContract.getFreeMintRemaining(userAddress);
      return Number(remaining);
    } catch (err: any) {
      logger.error({ err, userAddress }, 'Failed to get free mint remaining');
      return 0;
    }
  }

  /**
   * Get mint fee for a user (0 if free mints available)
   */
  async getMintFee(userAddress: string, chainId?: number): Promise<string> {
    const { nftContract } = this.getChain(chainId);
    try {
      const fee = await nftContract.getMintFee(userAddress);
      return ethers.formatEther(fee);
    } catch (err: any) {
      logger.error({ err, userAddress }, 'Failed to get mint fee');
      return '0';
    }
  }

  /**
   * Get total tips for a token
   */
  async getTotalTips(tokenId: number, chainId?: number): Promise<string> {
    const { tippingContract } = this.getChain(chainId);
    try {
      const tips = await tippingContract.getTotalTips(tokenId);
      return ethers.formatEther(tips);
    } catch (err: any) {
      logger.error({ err, tokenId }, 'Failed to get total tips');
      return '0';
    }
  }

  /**
   * Listen for tip events (for real-time updates)
   */
  onTipReceived(callback: (tokenId: number, amount: string, tipper: string) => void, chainId?: number): void {
    const { tippingContract } = this.getChain(chainId);
    tippingContract.on('TipReceived', (tokenId, tipper, broadcaster, tipAmount) => {
      callback(
        Number(tokenId),
        ethers.formatEther(tipAmount),
        tipper
      );
    });
    logger.info({ chainId: chainId || this.defaultChainId }, 'Listening for TipReceived events');
  }

  /**
   * Check connection to blockchain
   */
  async testConnection(chainId?: number): Promise<boolean> {
    const { provider, wallet } = this.getChain(chainId);
    try {
      const blockNumber = await provider.getBlockNumber();
      const balance = await provider.getBalance(wallet.address);
      logger.info({
        blockNumber,
        walletBalance: ethers.formatEther(balance),
        chainId: chainId || this.defaultChainId,
      }, 'Blockchain connection successful');
      return true;
    } catch (err: any) {
      logger.error({ err, chainId }, 'Blockchain connection failed');
      return false;
    }
  }

  // ============================================
  // BLOCKCHAIN READING METHODS (for Collection)
  // ============================================

  /**
   * Get all NFTs owned by an address using event logs
   * Uses VoiceNoteMinted events since contract lacks ERC721Enumerable
   */
  async getNFTsByOwner(address: string, chainId?: number): Promise<NFTData[]> {
    const { provider, readOnlyNftContract } = this.getChain(chainId);
    const resolvedChainId = chainId || this.defaultChainId;
    
    try {
      logger.info({ address, chainId: resolvedChainId }, 'Fetching NFTs for owner via blockchain events');

      // Query VoiceNoteMinted events filtered by broadcaster (indexed param)
      const filter = readOnlyNftContract.filters.VoiceNoteMinted(null, null, address, null);
      
      // Get current block and query last 9000 blocks (leave buffer for finalization)
      const currentBlock = await provider.getBlockNumber();
      const toBlock = currentBlock - 10;
      const fromBlock = Math.max(0, toBlock - 9000);
      const events = await readOnlyNftContract.queryFilter(filter, fromBlock, toBlock);

      logger.info({ address, eventCount: events.length }, 'Found VoiceNoteMinted events');

      const nfts: NFTData[] = [];

      for (const event of events) {
        try {
          const tokenId = (event as any).args.tokenId;
          
          // Verify still owned by this address
          const currentOwner = await readOnlyNftContract.ownerOf(tokenId);
          if (currentOwner.toLowerCase() !== address.toLowerCase()) {
            continue;
          }

          const nft = await this.getNFTData(tokenId, chainId);
          if (nft) {
            nfts.push(nft);
          }
        } catch (err) {
          logger.warn({ tokenId: (event as any).args?.tokenId?.toString() }, 'Failed to get NFT data');
        }
      }

      logger.info({ address, nftCount: nfts.length, chainId: resolvedChainId }, 'NFTs fetched from blockchain');
      return nfts;
    } catch (err) {
      logger.error({ err, address }, 'Failed to get NFTs by owner from blockchain');
      return [];
    }
  }

  /**
   * Get data for a specific NFT token from blockchain
   */
  async getNFTData(tokenId: bigint | number, chainId?: number): Promise<NFTData | null> {
    const { readOnlyNftContract, readOnlyTippingContract } = this.getChain(chainId);
    const resolvedChainId = chainId || this.defaultChainId;
    
    try {
      const tokenIdBigInt = BigInt(tokenId);
      
      // Get owner
      const owner = await readOnlyNftContract.ownerOf(tokenIdBigInt);
      
      // Get tokenURI (metadata URL)
      const tokenURI = await readOnlyNftContract.tokenURI(tokenIdBigInt);

      // Get note data from contract storage
      let noteData: any = null;
      try {
        noteData = await readOnlyNftContract.notes(tokenIdBigInt);
      } catch {
        // notes() might fail if token doesn't exist
      }
      
      // Get tips from tipping contract
      let tips = 0;
      try {
        const tipsWei = await readOnlyTippingContract.getTotalTips(tokenIdBigInt);
        tips = parseFloat(ethers.formatEther(tipsWei));
      } catch {
        // Tips might not exist for this token
      }

      // Fetch metadata from IPFS/HTTP
      let metadata: any = null;
      try {
        let metadataUrl = tokenURI;
        if (tokenURI.startsWith('ipfs://')) {
          metadataUrl = tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
        }
        
        const response = await fetch(metadataUrl, { 
          signal: AbortSignal.timeout(10000)
        });
        if (response.ok) {
          metadata = await response.json();
        }
      } catch (err) {
        logger.warn({ tokenId: tokenId.toString() }, 'Failed to fetch metadata from IPFS');
      }

      // Helper to convert IPFS URLs to HTTP gateway
      const toGatewayUrl = (url: string | undefined): string | undefined => {
        if (!url) return undefined;
        if (url.startsWith('ipfs://')) {
          return url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
        }
        return url;
      };

      const rawAudioUrl = metadata?.audioUrl || metadata?.animation_url;
      const audioUrl = toGatewayUrl(rawAudioUrl);

      return {
        tokenId: tokenId.toString(),
        noteId: noteData?.noteId || metadata?.noteId || `note_${tokenId}`,
        owner,
        tokenURI,
        metadata,
        tips,
        echoes: 0,
        audioUrl,
        duration: metadata?.duration || metadata?.properties?.duration,
        moodColor: metadata?.moodColor || metadata?.properties?.moodColor,
        sector: metadata?.attributes?.find((a: any) => a.trait_type === 'Sector')?.value,
        waveform: metadata?.waveform || metadata?.properties?.waveform,
        createdAt: noteData ? new Date(Number(noteData.createdAt) * 1000).toISOString() : metadata?.createdAt,
        expiresAt: noteData ? new Date(Number(noteData.expiresAt) * 1000).toISOString() : metadata?.expiresAt,
        isGhost: noteData?.isGhost || false,
        chainId: resolvedChainId,
      };
    } catch (err) {
      logger.error({ err, tokenId: tokenId.toString() }, 'Failed to get NFT data');
      return null;
    }
  }

  /**
   * Get all NFTs from blockchain (for explore/stream page)
   * Used for persistence across server restarts
   * Uses chunked queries to work within RPC provider limits
   */
  async getAllNFTs(limit: number = 50, chainId?: number): Promise<NFTData[]> {
    const { provider, readOnlyNftContract } = this.getChain(chainId);
    const resolvedChainId = chainId || this.defaultChainId;
    
    try {
      logger.info({ limit, chainId: resolvedChainId }, 'Fetching all NFTs via blockchain events');

      const filter = readOnlyNftContract.filters.VoiceNoteMinted();
      
      const currentBlock = await provider.getBlockNumber();
      
      // Total range we want to cover (~24 hours on L2)
      const totalBlocksToQuery = 50000;
      // Chunk size that works with all RPC providers (Arbitrum: 10k, Mantle: 30k)
      const chunkSize = 9000;
      
      const toBlock = currentBlock;
      const fromBlock = Math.max(0, currentBlock - totalBlocksToQuery);
      
      logger.info({ fromBlock, toBlock, totalBlocksToQuery, chunkSize }, 'Querying block range in chunks');
      
      // Query in chunks and merge results
      const allEvents: any[] = [];
      let currentFrom = fromBlock;
      
      while (currentFrom < toBlock) {
        const currentTo = Math.min(currentFrom + chunkSize, toBlock);
        
        try {
          const chunkEvents = await readOnlyNftContract.queryFilter(filter, currentFrom, currentTo);
          allEvents.push(...chunkEvents);
          logger.debug({ from: currentFrom, to: currentTo, found: chunkEvents.length }, 'Chunk query complete');
        } catch (chunkErr) {
          logger.warn({ from: currentFrom, to: currentTo, err: chunkErr }, 'Chunk query failed, skipping');
        }
        
        currentFrom = currentTo + 1;
      }

      logger.info({ eventCount: allEvents.length }, 'Found total VoiceNoteMinted events');

      const nfts: NFTData[] = [];
      const processedTokenIds = new Set<string>();
      const now = new Date();
      
      // Take most recent events up to limit
      const recentEvents = allEvents.slice(-limit).reverse();

      for (const event of recentEvents) {
        try {
          const tokenId = (event as any).args.tokenId;
          const tokenIdStr = tokenId.toString();
          
          if (processedTokenIds.has(tokenIdStr)) continue;
          processedTokenIds.add(tokenIdStr);

          const nft = await this.getNFTData(tokenId, chainId);
          if (nft) {
            // Filter out expired notes (older than 24 hours)
            if (nft.expiresAt && new Date(nft.expiresAt) < now) {
              logger.debug({ tokenId: tokenIdStr, expiresAt: nft.expiresAt }, 'Skipping expired note');
              continue;
            }
            nfts.push(nft);
          }
        } catch (err) {
          logger.warn({ err }, 'Failed to get NFT from event');
        }
      }

      logger.info({ nftCount: nfts.length, chainId: resolvedChainId }, 'All NFTs fetched from blockchain (non-expired)');
      return nfts;
    } catch (err) {
      logger.error({ err }, 'Failed to get all NFTs from blockchain');
      return [];
    }
  }

  // ============= ECHO METHODS =============

  /**
   * Register an echo on the blockchain
   */
  async registerEcho(
    parentNoteId: string,
    echoNoteId: string,
    metadataUrl: string,
    parentBroadcaster: string,
    echoBroadcaster: string,
    chainId?: number
  ): Promise<{ txHash: string }> {
    const { echoContract, readOnlyEchoContract } = this.getChain(chainId);
    logger.info({ parentNoteId, echoNoteId, metadataUrl, parentBroadcaster, chainId: chainId || this.defaultChainId }, 'Registering echo on blockchain');

    try {
      const echoFee = await readOnlyEchoContract.getEchoFee();

      const tx = await echoContract.registerEcho(
        parentNoteId,
        echoNoteId,
        metadataUrl,
        parentBroadcaster,
        { value: echoFee }
      );

      const receipt = await tx.wait();

      logger.info({ 
        txHash: receipt.hash, 
        echoNoteId, 
        parentNoteId 
      }, 'Echo registered successfully');

      return { txHash: receipt.hash };
    } catch (err) {
      logger.error({ err, parentNoteId, echoNoteId }, 'Failed to register echo');
      throw err;
    }
  }

  /**
   * Get echo count for a note
   */
  async getEchoCount(noteId: string, chainId?: number): Promise<number> {
    const { readOnlyEchoContract } = this.getChain(chainId);
    try {
      const count = await readOnlyEchoContract.getEchoCount(noteId);
      return Number(count);
    } catch (err) {
      logger.warn({ err, noteId }, 'Failed to get echo count');
      return 0;
    }
  }

  /**
   * Get the echo fee
   */
  async getEchoFee(chainId?: number): Promise<string> {
    const { readOnlyEchoContract } = this.getChain(chainId);
    try {
      const fee = await readOnlyEchoContract.getEchoFee();
      return ethers.formatEther(fee);
    } catch (err) {
      logger.warn({ err }, 'Failed to get echo fee');
      return '0.001';
    }
  }

  /**
   * Check if a note is an echo
   */
  async checkIsEcho(noteId: string, chainId?: number): Promise<boolean> {
    const { readOnlyEchoContract } = this.getChain(chainId);
    try {
      return await readOnlyEchoContract.checkIsEcho(noteId);
    } catch (err) {
      logger.warn({ err, noteId }, 'Failed to check if note is echo');
      return false;
    }
  }

  /**
   * Get the parent note ID for an echo
   */
  async getParentNoteId(echoNoteId: string, chainId?: number): Promise<string | null> {
    const { readOnlyEchoContract } = this.getChain(chainId);
    try {
      const parentId = await readOnlyEchoContract.getParent(echoNoteId);
      return parentId;
    } catch (err) {
      logger.warn({ err, echoNoteId }, 'Failed to get parent note ID');
      return null;
    }
  }

  /**
   * Get all echoes for a parent note from blockchain (persistent)
   */
  async getEchoesFromBlockchain(parentNoteId: string, chainId?: number): Promise<{
    echoNoteId: string;
    parentNoteId: string;
    metadataUrl: string;
    echoBroadcaster: string;
    parentBroadcaster: string;
    timestamp: number;
  }[]> {
    const { readOnlyEchoContract } = this.getChain(chainId);
    try {
      logger.info({ parentNoteId }, 'Fetching echoes from blockchain');
      
      const echoes = await readOnlyEchoContract.getEchoes(parentNoteId);
      
      return echoes.map((echo: any) => ({
        echoNoteId: echo.echoNoteId,
        parentNoteId: echo.parentNoteId,
        metadataUrl: echo.metadataUrl,
        echoBroadcaster: echo.echoBroadcaster,
        parentBroadcaster: echo.parentBroadcaster,
        timestamp: Number(echo.timestamp),
      }));
    } catch (err) {
      logger.error({ err, parentNoteId }, 'Failed to get echoes from blockchain');
      return [];
    }
  }

  /**
   * Get all tips made by a user from TipReceived events
   */
  async getTipsByUser(userAddress: string, chainId?: number): Promise<{
    tokenId: string;
    tipper: string;
    broadcaster: string;
    tipAmount: string;
    platformFee: string;
    broadcasterAmount: string;
    txHash: string;
    blockNumber: number;
    timestamp?: number;
  }[]> {
    const { provider, readOnlyTippingContract } = this.getChain(chainId);
    try {
      logger.info({ userAddress }, 'Fetching tips by user');
      
      const filter = readOnlyTippingContract.filters.TipReceived(
        null,
        userAddress,
        null
      );
      
      const currentBlock = await provider.getBlockNumber();
      const toBlock = currentBlock - 10;
      const fromBlock = Math.max(0, toBlock - 9000);
      const events = await readOnlyTippingContract.queryFilter(filter, fromBlock, toBlock);
      
      const tips = await Promise.all(
        events.map(async (event) => {
          const block = await event.getBlock();
          const args = (event as any).args;
          return {
            tokenId: args?.tokenId?.toString() || '0',
            tipper: args?.tipper || userAddress,
            broadcaster: args?.broadcaster || '',
            tipAmount: ethers.formatEther(args?.tipAmount || 0),
            platformFee: ethers.formatEther(args?.platformFee || 0),
            broadcasterAmount: ethers.formatEther(args?.broadcasterAmount || 0),
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: block?.timestamp,
          };
        })
      );
      
      logger.info({ userAddress, tipCount: tips.length }, 'Tips fetched');
      return tips.sort((a, b) => b.blockNumber - a.blockNumber);
    } catch (err) {
      logger.error({ err, userAddress }, 'Failed to get tips by user');
      return [];
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
