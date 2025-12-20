import type { ServerWebSocket } from 'bun';
import { logger } from '../config/logger.js';
import type { Note, WSMessage } from '../types/index.js';

/**
 * Client data stored with each WebSocket connection
 */
interface WSClientData {
  clientId: string;
  connectedAt: number;
}

/**
 * WebSocketManager - Handles real-time connections and broadcasting
 * Uses Bun's native WebSocket for maximum performance
 */
class WebSocketManagerClass {
  private clients = new Map<string, ServerWebSocket<WSClientData>>();

  /**
   * Bun WebSocket handlers - pass to Bun.serve()
   */
  get handlers() {
    return {
      open: (ws: ServerWebSocket<WSClientData>) => {
        const clientId = this.generateClientId();
        ws.data = { clientId, connectedAt: Date.now() };
        this.clients.set(clientId, ws);

        logger.info({ clientId, totalClients: this.clients.size }, 'Client connected');

        // Send welcome message
        this.send(ws, {
          type: 'connected',
          data: { 
            clientId, 
            listenerCount: this.clients.size,
            serverTime: Date.now(),
          },
        });

        // Broadcast updated listener count to all
        this.broadcastListenerCount();
      },

      message: (ws: ServerWebSocket<WSClientData>, message: string | Buffer) => {
        try {
          const msg = JSON.parse(message.toString()) as WSMessage;
          this.handleMessage(ws, msg);
        } catch (err) {
          logger.warn({ err }, 'Invalid WebSocket message');
        }
      },

      close: (ws: ServerWebSocket<WSClientData>) => {
        if (ws.data?.clientId) {
          this.clients.delete(ws.data.clientId);
          logger.info({ clientId: ws.data.clientId, totalClients: this.clients.size }, 'Client disconnected');
          this.broadcastListenerCount();
        }
      },

      error: (ws: ServerWebSocket<WSClientData>, error: Error) => {
        logger.error({ clientId: ws.data?.clientId, error }, 'WebSocket error');
      },
    };
  }

  /**
   * Handle incoming messages from clients
   */
  private handleMessage(ws: ServerWebSocket<WSClientData>, msg: WSMessage): void {
    switch (msg.type) {
      case 'ping':
        this.send(ws, { type: 'pong' });
        break;
      default:
        logger.debug({ type: msg.type }, 'Unhandled message type');
    }
  }

  /**
   * Send message to a specific client
   */
  private send(ws: ServerWebSocket<WSClientData>, message: WSMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch (err) {
      logger.warn({ clientId: ws.data?.clientId, err }, 'Failed to send message');
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: WSMessage): void {
    const json = JSON.stringify(message);
    let sent = 0;
    let failed = 0;

    for (const [clientId, ws] of this.clients) {
      try {
        ws.send(json);
        sent++;
      } catch (err) {
        failed++;
        this.clients.delete(clientId);
      }
    }

    logger.debug({ type: message.type, sent, failed }, 'Broadcast complete');
  }

  /**
   * Broadcast when a new note is uploaded
   */
  broadcastNewNote(note: Note): void {
    this.broadcast({
      type: 'newNote',
      data: note,
    });
  }

  /**
   * Broadcast when a note expires
   */
  broadcastNoteExpired(noteId: string, tokenId: number): void {
    this.broadcast({
      type: 'noteExpired',
      data: { noteId, tokenId },
    });
  }

  /**
   * Broadcast when a tip is received
   */
  broadcastTipReceived(tokenId: number, amount: number, tipper: string): void {
    this.broadcast({
      type: 'tipReceived',
      data: { tokenId, amount, tipper },
    });
  }

  /**
   * Broadcast when an echo is added to a note
   */
  broadcastEchoAdded(data: {
    echoNoteId: string;
    parentNoteId: string;
    broadcaster: string;
    audioUrl: string;
    duration: number;
  }): void {
    this.broadcast({
      type: 'echoAdded',
      data,
    });
  }

  /**
   * Broadcast updated listener count
   */
  broadcastListenerCount(): void {
    this.broadcast({
      type: 'listenerCount',
      data: { count: this.clients.size },
    });
  }

  /**
   * Get current listener count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Export singleton instance
export const wsManager = new WebSocketManagerClass();
