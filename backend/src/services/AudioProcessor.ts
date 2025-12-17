import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuid } from 'uuid';
import { unlink, mkdir } from 'fs/promises';
import path from 'path';
import { logger } from '../config/logger.js';

export interface ProcessResult {
  noteId: string;
  outputPath: string;
  duration: number;
  waveform: number[];
}

export class AudioProcessor {
  private tempDir = './uploads/temp';
  private outputDir = './uploads/notes';

  constructor() {
    // Ensure directories exist
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    await mkdir(this.tempDir, { recursive: true }).catch(() => {});
    await mkdir(this.outputDir, { recursive: true }).catch(() => {});
  }

  /**
   * Main processing pipeline
   * @param inputBuffer - Raw audio buffer from frontend (webm)
   * @param originalFilename - Original filename for reference
   */
  async process(inputBuffer: Buffer, originalFilename: string): Promise<ProcessResult> {
    const noteId = uuid();
    const tempPath = path.join(this.tempDir, `${noteId}_input.webm`);
    const outputPath = path.join(this.outputDir, `${noteId}.mp3`);

    logger.info({ noteId, originalFilename }, 'Starting audio processing');

    // Save input buffer to temp file
    await Bun.write(tempPath, inputBuffer);

    try {
      // Step 1: Get duration and validate
      const duration = await this.getDuration(tempPath);
      logger.info({ noteId, duration }, 'Audio duration validated');

      if (duration < 5) {
        throw new Error(`Audio too short: ${duration}s (minimum 5s)`);
      }
      if (duration > 90) {
        throw new Error(`Audio too long: ${duration}s (maximum 90s)`);
      }

      // Step 2: Convert to MP3 with normalization
      await this.convertToMP3(tempPath, outputPath);
      logger.info({ noteId }, 'Audio converted to MP3');

      // Step 3: Generate waveform data
      const waveform = await this.generateWaveform(outputPath);
      logger.info({ noteId, waveformPoints: waveform.length }, 'Waveform generated');

      return {
        noteId,
        outputPath,
        duration: Math.round(duration),
        waveform,
      };
    } finally {
      // Cleanup temp file
      await unlink(tempPath).catch(() => {});
    }
  }

  /**
   * Get audio duration using ffprobe
   */
  private getDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          logger.error({ err, filePath }, 'ffprobe error');
          reject(new Error('Failed to analyze audio file'));
        } else {
          const duration = metadata.format.duration || 0;
          resolve(duration);
        }
      });
    });
  }

  /**
   * Convert audio to MP3 with normalization
   * - 128kbps bitrate
   * - Mono channel
   * - 44100 Hz sample rate
   * - Loudness normalization
   */
  private convertToMP3(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec('libmp3lame')
        .audioBitrate(128)
        .audioChannels(1)
        .audioFrequency(44100)
        .audioFilters('loudnorm=I=-14:LRA=11:TP=-1')
        .output(outputPath)
        .on('start', (cmd) => {
          logger.debug({ cmd }, 'FFmpeg started');
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (err) => {
          logger.error({ err }, 'FFmpeg conversion error');
          reject(new Error('Audio conversion failed'));
        })
        .run();
    });
  }

  /**
   * Generate waveform data (100 amplitude points)
   * For now, uses a simplified approach - can be enhanced with audiowaveform later
   */
  private async generateWaveform(filePath: string): Promise<number[]> {
    // Simplified waveform generation using volume detection
    // In production, consider using audiowaveform binary for accurate data
    return new Promise((resolve) => {
      const amplitudes: number[] = [];
      
      ffmpeg(filePath)
        .audioFilters('astats=metadata=1:reset=1')
        .format('null')
        .on('stderr', (line) => {
          // Parse RMS level from stderr
          const match = line.match(/RMS level dB: (-?\d+\.?\d*)/);
          if (match) {
            const db = parseFloat(match[1]);
            // Convert dB to 0-1 range (assuming -60dB to 0dB range)
            const normalized = Math.max(0, Math.min(1, (db + 60) / 60));
            amplitudes.push(normalized);
          }
        })
        .on('end', () => {
          // Resample to exactly 100 points
          const resampled = this.resampleArray(amplitudes, 100);
          resolve(resampled);
        })
        .on('error', () => {
          // Fallback: generate random waveform if analysis fails
          logger.warn({ filePath }, 'Waveform analysis failed, using fallback');
          resolve(this.generateFallbackWaveform());
        })
        .output('-')
        .run();
    });
  }

  /**
   * Resample an array to a target length
   */
  private resampleArray(arr: number[], targetLength: number): number[] {
    if (arr.length === 0) {
      return this.generateFallbackWaveform();
    }
    if (arr.length === targetLength) {
      return arr;
    }

    const result: number[] = [];
    const ratio = arr.length / targetLength;

    for (let i = 0; i < targetLength; i++) {
      const index = Math.floor(i * ratio);
      result.push(arr[Math.min(index, arr.length - 1)]);
    }

    return result;
  }

  /**
   * Generate a natural-looking fallback waveform
   */
  private generateFallbackWaveform(): number[] {
    return Array.from({ length: 100 }, (_, i) => {
      // Create a somewhat natural-looking waveform
      const base = 0.3 + Math.random() * 0.4;
      const wave = Math.sin(i / 10) * 0.1;
      return Math.max(0, Math.min(1, base + wave));
    });
  }

  /**
   * Delete a processed audio file
   */
  async deleteAudio(noteId: string): Promise<void> {
    const filePath = path.join(this.outputDir, `${noteId}.mp3`);
    await unlink(filePath).catch(() => {});
    logger.info({ noteId }, 'Audio file deleted');
  }
}

// Export singleton instance
export const audioProcessor = new AudioProcessor();
