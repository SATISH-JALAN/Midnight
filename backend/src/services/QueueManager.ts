import { Note } from '../types/index.js';
import { logger } from '../config/logger.js';

/**
 * QueueManager - In-memory storage for active voice notes
 * Notes expire after 24 hours and are removed from the queue
 */
export class QueueManager {
  private queue: Note[] = [];
  private readonly MAX_QUEUE_SIZE = 100;

  /**
   * Add a new note to the queue
   */
  addNote(note: Note): void {
    // Remove oldest if at capacity
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      const removed = this.queue.pop();
      logger.info({ removedNoteId: removed?.noteId }, 'Queue at capacity, removed oldest note');
    }

    // Add to beginning (newest first)
    this.queue.unshift(note);
    logger.info({ noteId: note.noteId, queueSize: this.queue.length }, 'Note added to queue');
  }

  /**
   * Remove a note from the queue
   */
  removeNote(noteId: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(n => n.noteId !== noteId);
    
    const removed = this.queue.length < initialLength;
    if (removed) {
      logger.info({ noteId }, 'Note removed from queue');
    }
    return removed;
  }

  /**
   * Get all active (non-expired) notes
   */
  getActiveQueue(): Note[] {
    const now = Date.now();
    return this.queue.filter(n => n.expiresAt > now);
  }

  /**
   * Get a specific note by ID
   */
  getNote(noteId: string): Note | undefined {
    return this.queue.find(n => n.noteId === noteId);
  }

  /**
   * Update tip count for a note
   */
  updateTips(tokenId: number, amount: number): boolean {
    const note = this.queue.find(n => n.tokenId === tokenId);
    if (note) {
      note.tips += amount;
      logger.info({ tokenId, newTips: note.tips }, 'Tips updated');
      return true;
    }
    return false;
  }

  /**
   * Increment echo count for a note
   */
  incrementEchoes(noteId: string): boolean {
    const note = this.queue.find(n => n.noteId === noteId);
    if (note) {
      note.echoes++;
      logger.info({ noteId, newEchoes: note.echoes }, 'Echoes incremented');
      return true;
    }
    return false;
  }

  /**
   * Get queue statistics
   */
  getStats(): { total: number; active: number } {
    const now = Date.now();
    const active = this.queue.filter(n => n.expiresAt > now).length;
    return { total: this.queue.length, active };
  }

  /**
   * Clean up expired notes (call periodically)
   */
  cleanupExpired(): number {
    const now = Date.now();
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(n => n.expiresAt > now);
    const removed = initialLength - this.queue.length;
    
    if (removed > 0) {
      logger.info({ removedCount: removed }, 'Expired notes cleaned up');
    }
    return removed;
  }
}

// Export singleton instance
export const queueManager = new QueueManager();
