import { PinataSDK } from 'pinata';
import { readFile } from 'fs/promises';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export interface IPFSUploadResult {
  audioHash: string;
  metadataHash: string;
  audioUrl: string;
  metadataUrl: string;
}

export interface NFTMetadata {
  noteId: string;
  duration: number;
  moodColor: string;
  waveform: number[];
  broadcaster: string;
  timestamp: number;
}

export class IPFSService {
  private pinata: PinataSDK;
  private gateway: string;

  constructor() {
    this.pinata = new PinataSDK({
      pinataJwt: env.PINATA_JWT,
    });
    this.gateway = env.PINATA_GATEWAY;
  }

  /**
   * Upload audio file and metadata to IPFS
   */
  async upload(audioPath: string, metadata: NFTMetadata): Promise<IPFSUploadResult> {
    logger.info({ noteId: metadata.noteId }, 'Starting IPFS upload');

    // Step 1: Upload audio file
    const audioHash = await this.uploadAudio(audioPath, metadata.noteId);
    logger.info({ noteId: metadata.noteId, audioHash }, 'Audio uploaded to IPFS');

    // Step 2: Create and upload NFT metadata JSON
    const nftMetadata = this.createNFTMetadata(metadata, audioHash);
    const metadataHash = await this.uploadMetadata(nftMetadata, metadata.noteId);
    logger.info({ noteId: metadata.noteId, metadataHash }, 'Metadata uploaded to IPFS');

    return {
      audioHash,
      metadataHash,
      audioUrl: `${this.gateway}/ipfs/${audioHash}`,
      metadataUrl: `${this.gateway}/ipfs/${metadataHash}`,
    };
  }

  /**
   * Upload audio file to IPFS using Pinata SDK v2
   */
  private async uploadAudio(filePath: string, noteId: string): Promise<string> {
    const fileBuffer = await readFile(filePath);
    const file = new File([fileBuffer], `${noteId}.mp3`, { type: 'audio/mpeg' });

    // Pinata SDK v2 uses upload.public.file() for public IPFS
    const result = await this.pinata.upload.public.file(file);
    return result.cid;
  }

  /**
   * Create NFT metadata following OpenSea standard
   */
  private createNFTMetadata(metadata: NFTMetadata, audioHash: string): object {
    return {
      name: `Midnight Transmission #${metadata.noteId.slice(0, 8)}`,
      description: 'A voice note broadcast into the digital void. This transmission will fade after 24 hours, but the NFT remains as proof of its existence.',
      image: 'ipfs://QmDefaultMidnightRadioImage', // Default image for audio NFTs
      animation_url: `ipfs://${audioHash}`,
      external_url: `https://midnightradio.app/note/${metadata.noteId}`,
      attributes: [
        { trait_type: 'Duration', value: `${metadata.duration}s` },
        { trait_type: 'Mood', value: metadata.moodColor },
        { trait_type: 'Broadcaster', value: metadata.broadcaster.slice(0, 10) + '...' },
        { trait_type: 'Transmission Time', value: new Date(metadata.timestamp).toISOString() },
      ],
      properties: {
        waveform: metadata.waveform,
        duration: metadata.duration,
        moodColor: metadata.moodColor,
        fullBroadcaster: metadata.broadcaster,
      },
    };
  }

  /**
   * Upload metadata JSON to IPFS using Pinata SDK v2
   */
  private async uploadMetadata(metadata: object, noteId: string): Promise<string> {
    // Convert metadata to JSON string and create a file
    const jsonString = JSON.stringify(metadata);
    const file = new File([jsonString], `${noteId}.json`, { type: 'application/json' });
    
    const result = await this.pinata.upload.public.file(file);
    return result.cid;
  }

  /**
   * Unpin a file from IPFS (for 24hr audio expiry)
   * Uses the files API in Pinata SDK v2
   */
  async unpin(cid: string): Promise<void> {
    try {
      // In Pinata v2, we delete files by CID
      const files = await this.pinata.files.public.list().cid(cid);
      if (files.files && files.files.length > 0) {
        await this.pinata.files.public.delete([files.files[0].id]);
      }
      logger.info({ cid }, 'Unpinned from IPFS');
    } catch (err) {
      logger.warn({ cid, err }, 'Failed to unpin from IPFS');
    }
  }

  /**
   * Test connection to Pinata
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.pinata.testAuthentication();
      logger.info('Pinata connection successful');
      return true;
    } catch (err) {
      logger.error({ err }, 'Pinata connection failed');
      return false;
    }
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();
