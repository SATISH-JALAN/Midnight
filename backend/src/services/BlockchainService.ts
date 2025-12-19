import { ethers } from 'ethers';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

// VoiceNoteNFT ABI (only the functions we need)
const VOICE_NOTE_NFT_ABI = [
  'function mint(address to, string noteId, string metadataUri) external payable returns (uint256)',
  'function getMintFee(address user) external view returns (uint256)',
  'function getFreeMintRemaining(address user) external view returns (uint256)',
  'event VoiceNoteMinted(uint256 indexed tokenId, string noteId, address indexed broadcaster, uint256 expiresAt)',
];

// TippingPool ABI
const TIPPING_POOL_ABI = [
  'function tip(uint256 tokenId, address broadcaster) external payable',
  'function getTotalTips(uint256 tokenId) external view returns (uint256)',
  'event TipReceived(uint256 indexed tokenId, address indexed tipper, address indexed broadcaster, uint256 tipAmount, uint256 platformFee, uint256 broadcasterAmount)',
];

export interface MintResult {
  tokenId: number;
  txHash: string;
  expiresAt: number;
}

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private nftContract: ethers.Contract;
  private tippingContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(env.RPC_URL);
    this.wallet = new ethers.Wallet(env.PRIVATE_KEY, this.provider);
    
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

    logger.info({
      nftContract: env.NFT_CONTRACT_ADDRESS,
      tippingContract: env.TIPPING_CONTRACT_ADDRESS,
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
}

// Export singleton instance
export const blockchainService = new BlockchainService();
