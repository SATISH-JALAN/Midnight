import { ethers } from 'ethers';
import { env } from '../config/env.js';
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
}

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private nftContract: ethers.Contract;
  private tippingContract: ethers.Contract;
  private echoContract: ethers.Contract;
  // Read-only contracts (for blockchain queries without signing)
  private readOnlyNftContract: ethers.Contract;
  private readOnlyTippingContract: ethers.Contract;
  private readOnlyEchoContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(env.RPC_URL);
    this.wallet = new ethers.Wallet(env.PRIVATE_KEY, this.provider);
    
    // Contracts with wallet (for write operations)
    this.nftContract = new ethers.Contract(
      env.NFT_CONTRACT_ADDRESS,
      VOICE_NOTE_NFT_ABI,
      this.wallet
    );

    this.tippingContract = new ethers.Contract(
      env.TIPPING_CONTRACT_ADDRESS,
      TIPPING_POOL_ABI,
      this.wallet
    );

    this.echoContract = new ethers.Contract(
      env.ECHO_CONTRACT_ADDRESS,
      ECHO_REGISTRY_ABI,
      this.wallet
    );

    // Read-only contracts (for queries - uses provider directly)
    this.readOnlyNftContract = new ethers.Contract(
      env.NFT_CONTRACT_ADDRESS,
      VOICE_NOTE_NFT_ABI,
      this.provider
    );

    this.readOnlyTippingContract = new ethers.Contract(
      env.TIPPING_CONTRACT_ADDRESS,
      TIPPING_POOL_ABI,
      this.provider
    );

    this.readOnlyEchoContract = new ethers.Contract(
      env.ECHO_CONTRACT_ADDRESS,
      ECHO_REGISTRY_ABI,
      this.provider
    );

    logger.info({
      nftContract: env.NFT_CONTRACT_ADDRESS,
      tippingContract: env.TIPPING_CONTRACT_ADDRESS,
      echoContract: env.ECHO_CONTRACT_ADDRESS,
      wallet: this.wallet.address,
    }, 'BlockchainService initialized');
  }


  /**
   * Mint a new voice note NFT
   */
  async mintNFT(
    broadcasterAddress: string,
    noteId: string,
    metadataUri: string
  ): Promise<MintResult> {
    logger.info({ noteId, broadcasterAddress }, 'Minting NFT');

    try {
      // Get mint fee for the broadcaster
      const mintFee = await this.nftContract.getMintFee(broadcasterAddress);
      logger.debug({ noteId, mintFee: mintFee.toString() }, 'Mint fee calculated');

      // Mint the NFT
      const tx = await this.nftContract.mint(
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
            return this.nftContract.interface.parseLog(log);
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

      logger.info({ noteId, tokenId, txHash: tx.hash }, 'NFT minted successfully');

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
  async getFreeMintRemaining(userAddress: string): Promise<number> {
    try {
      const remaining = await this.nftContract.getFreeMintRemaining(userAddress);
      return Number(remaining);
    } catch (err: any) {
      logger.error({ err, userAddress }, 'Failed to get free mint remaining');
      return 0;
    }
  }

  /**
   * Get mint fee for a user (0 if free mints available)
   */
  async getMintFee(userAddress: string): Promise<string> {
    try {
      const fee = await this.nftContract.getMintFee(userAddress);
      return ethers.formatEther(fee);
    } catch (err: any) {
      logger.error({ err, userAddress }, 'Failed to get mint fee');
      return '0';
    }
  }

  /**
   * Get total tips for a token
   */
  async getTotalTips(tokenId: number): Promise<string> {
    try {
      const tips = await this.tippingContract.getTotalTips(tokenId);
      return ethers.formatEther(tips);
    } catch (err: any) {
      logger.error({ err, tokenId }, 'Failed to get total tips');
      return '0';
    }
  }

  /**
   * Listen for tip events (for real-time updates)
   */
  onTipReceived(callback: (tokenId: number, amount: string, tipper: string) => void): void {
    this.tippingContract.on('TipReceived', (tokenId, tipper, broadcaster, tipAmount) => {
      callback(
        Number(tokenId),
        ethers.formatEther(tipAmount),
        tipper
      );
    });
    logger.info('Listening for TipReceived events');
  }

  /**
   * Check connection to blockchain
   */
  async testConnection(): Promise<boolean> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const balance = await this.provider.getBalance(this.wallet.address);
      logger.info({
        blockNumber,
        walletBalance: ethers.formatEther(balance),
      }, 'Blockchain connection successful');
      return true;
    } catch (err: any) {
      logger.error({ err }, 'Blockchain connection failed');
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
  async getNFTsByOwner(address: string): Promise<NFTData[]> {
    try {
      logger.info({ address }, 'Fetching NFTs for owner via blockchain events');

      // Query VoiceNoteMinted events filtered by broadcaster (indexed param)
      // Event: VoiceNoteMinted(uint256 indexed tokenId, string noteId, address indexed broadcaster, uint256 expiresAt)
      // In ethers v6, filter args must include ALL event params (use null for non-indexed)
      const filter = this.readOnlyNftContract.filters.VoiceNoteMinted(null, null, address, null);
      
      // Get current block and query last 9000 blocks (leave buffer for finalization)
      const currentBlock = await this.provider.getBlockNumber();
      const toBlock = currentBlock - 10; // Buffer for block finalization
      const fromBlock = Math.max(0, toBlock - 9000);
      const events = await this.readOnlyNftContract.queryFilter(filter, fromBlock, toBlock);

      logger.info({ address, eventCount: events.length }, 'Found VoiceNoteMinted events');

      const nfts: NFTData[] = [];

      for (const event of events) {
        try {
          const tokenId = (event as any).args.tokenId;
          
          // Verify still owned by this address (in case of transfer)
          const currentOwner = await this.readOnlyNftContract.ownerOf(tokenId);
          if (currentOwner.toLowerCase() !== address.toLowerCase()) {
            continue; // NFT was transferred to someone else
          }

          const nft = await this.getNFTData(tokenId);
          if (nft) {
            nfts.push(nft);
          }
        } catch (err) {
          logger.warn({ tokenId: (event as any).args?.tokenId?.toString() }, 'Failed to get NFT data');
        }
      }

      logger.info({ address, nftCount: nfts.length }, 'NFTs fetched from blockchain');
      return nfts;
    } catch (err) {
      logger.error({ err, address }, 'Failed to get NFTs by owner from blockchain');
      return [];
    }
  }

  /**
   * Get data for a specific NFT token from blockchain
   */
  async getNFTData(tokenId: bigint | number): Promise<NFTData | null> {
    try {
      const tokenIdBigInt = BigInt(tokenId);
      
      // Get owner
      const owner = await this.readOnlyNftContract.ownerOf(tokenIdBigInt);
      
      // Get tokenURI (metadata URL)
      const tokenURI = await this.readOnlyNftContract.tokenURI(tokenIdBigInt);

      // Get note data from contract storage
      let noteData: any = null;
      try {
        noteData = await this.readOnlyNftContract.notes(tokenIdBigInt);
      } catch {
        // notes() might fail if token doesn't exist
      }
      
      // Get tips from tipping contract
      let tips = 0;
      try {
        const tipsWei = await this.readOnlyTippingContract.getTotalTips(tokenIdBigInt);
        tips = parseFloat(ethers.formatEther(tipsWei));
      } catch {
        // Tips might not exist for this token
      }

      // Fetch metadata from IPFS/HTTP
      let metadata: any = null;
      try {
        let metadataUrl = tokenURI;
        // Convert IPFS URL to HTTP gateway
        if (tokenURI.startsWith('ipfs://')) {
          metadataUrl = tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
        }
        
        const response = await fetch(metadataUrl, { 
          signal: AbortSignal.timeout(10000) // 10 second timeout
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

      // Get audio URL from metadata (convert IPFS to gateway)
      const rawAudioUrl = metadata?.audioUrl || metadata?.animation_url;
      const audioUrl = toGatewayUrl(rawAudioUrl);

      return {
        tokenId: tokenId.toString(),
        noteId: noteData?.noteId || metadata?.noteId || `note_${tokenId}`,
        owner,
        tokenURI,
        metadata,
        tips,
        echoes: 0, // Could be calculated from events if needed
        audioUrl,
        duration: metadata?.duration || metadata?.properties?.duration,
        moodColor: metadata?.moodColor || metadata?.properties?.moodColor,
        sector: metadata?.attributes?.find((a: any) => a.trait_type === 'Sector')?.value,
        waveform: metadata?.waveform || metadata?.properties?.waveform,
        createdAt: noteData ? new Date(Number(noteData.createdAt) * 1000).toISOString() : metadata?.createdAt,
        expiresAt: noteData ? new Date(Number(noteData.expiresAt) * 1000).toISOString() : metadata?.expiresAt,
        isGhost: noteData?.isGhost || false,
      };
    } catch (err) {
      logger.error({ err, tokenId: tokenId.toString() }, 'Failed to get NFT data');
      return null;
    }
  }

  /**
   * Get all NFTs from blockchain (for explore/stream page)
   * Queries all VoiceNoteMinted events and fetches data
   */
  async getAllNFTs(limit: number = 50): Promise<NFTData[]> {
    try {
      logger.info({ limit }, 'Fetching all NFTs via blockchain events');

      // Query all VoiceNoteMinted events (no filter)
      const filter = this.readOnlyNftContract.filters.VoiceNoteMinted();
      
      // Get current block and query last 9000 blocks (leave buffer for finalization)
      const currentBlock = await this.provider.getBlockNumber();
      const toBlock = currentBlock - 10; // Buffer for block finalization
      const fromBlock = Math.max(0, toBlock - 9000);
      const events = await this.readOnlyNftContract.queryFilter(filter, fromBlock, toBlock);

      logger.info({ eventCount: events.length }, 'Found total VoiceNoteMinted events');

      const nfts: NFTData[] = [];
      const processedTokenIds = new Set<string>();
      
      // Process most recent first (reverse order)
      const recentEvents = events.slice(-limit).reverse();

      for (const event of recentEvents) {
        try {
          const tokenId = (event as any).args.tokenId;
          const tokenIdStr = tokenId.toString();
          
          // Skip duplicates
          if (processedTokenIds.has(tokenIdStr)) continue;
          processedTokenIds.add(tokenIdStr);

          const nft = await this.getNFTData(tokenId);
          if (nft) {
            nfts.push(nft);
          }
        } catch (err) {
          logger.warn({ err }, 'Failed to get NFT from event');
        }
      }

      logger.info({ nftCount: nfts.length }, 'All NFTs fetched from blockchain');
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
    echoBroadcaster: string
  ): Promise<{ txHash: string }> {
    logger.info({ parentNoteId, echoNoteId, metadataUrl, parentBroadcaster }, 'Registering echo on blockchain');

    try {
      // Get the echo fee from contract
      const echoFee = await this.readOnlyEchoContract.getEchoFee();

      // Register echo with payment (now includes metadataUrl)
      const tx = await this.echoContract.registerEcho(
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
  async getEchoCount(noteId: string): Promise<number> {
    try {
      const count = await this.readOnlyEchoContract.getEchoCount(noteId);
      return Number(count);
    } catch (err) {
      logger.warn({ err, noteId }, 'Failed to get echo count');
      return 0;
    }
  }

  /**
   * Get the echo fee
   */
  async getEchoFee(): Promise<string> {
    try {
      const fee = await this.readOnlyEchoContract.getEchoFee();
      return ethers.formatEther(fee);
    } catch (err) {
      logger.warn({ err }, 'Failed to get echo fee');
      return '0.001'; // Default fallback
    }
  }

  /**
   * Check if a note is an echo
   */
  async checkIsEcho(noteId: string): Promise<boolean> {
    try {
      return await this.readOnlyEchoContract.checkIsEcho(noteId);
    } catch (err) {
      logger.warn({ err, noteId }, 'Failed to check if note is echo');
      return false;
    }
  }

  /**
   * Get the parent note ID for an echo
   */
  async getParentNoteId(echoNoteId: string): Promise<string | null> {
    try {
      const parentId = await this.readOnlyEchoContract.getParent(echoNoteId);
      return parentId;
    } catch (err) {
      logger.warn({ err, echoNoteId }, 'Failed to get parent note ID');
      return null;
    }
  }

  /**
   * Get all echoes for a parent note from blockchain (persistent)
   */
  async getEchoesFromBlockchain(parentNoteId: string): Promise<{
    echoNoteId: string;
    parentNoteId: string;
    metadataUrl: string;
    echoBroadcaster: string;
    parentBroadcaster: string;
    timestamp: number;
  }[]> {
    try {
      logger.info({ parentNoteId }, 'Fetching echoes from blockchain');
      
      const echoes = await this.readOnlyEchoContract.getEchoes(parentNoteId);
      
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
  async getTipsByUser(userAddress: string): Promise<{
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
    try {
      logger.info({ userAddress }, 'Fetching tips by user');
      
      // Query TipReceived events where tipper is the user
      const filter = this.readOnlyTippingContract.filters.TipReceived(
        null, // any tokenId
        userAddress, // tipper
        null // any broadcaster
      );
      
      // Get current block and query last 9000 blocks (leave buffer for finalization)
      const currentBlock = await this.provider.getBlockNumber();
      const toBlock = currentBlock - 10; // Buffer for block finalization
      const fromBlock = Math.max(0, toBlock - 9000);
      const events = await this.readOnlyTippingContract.queryFilter(filter, fromBlock, toBlock);
      
      const tips = await Promise.all(
        events.map(async (event) => {
          const block = await event.getBlock();
          const args = (event as any).args; // Cast to access event args
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
      return tips.sort((a, b) => b.blockNumber - a.blockNumber); // Most recent first
    } catch (err) {
      logger.error({ err, userAddress }, 'Failed to get tips by user');
      return [];
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
