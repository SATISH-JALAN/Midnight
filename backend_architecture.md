# **MIDNIGHT RADIO - COMPLETE BACKEND ARCHITECTURE** ⚙️

---

## **📋 TABLE OF CONTENTS**

1. [Backend Overview](#1-backend-overview)
2. [System Architecture](#2-system-architecture)
3. [Request Flow Diagrams](#3-request-flow-diagrams)
4. [Service Layer Architecture](#4-service-layer-architecture)
5. [Data Flow & Processing](#5-data-flow--processing)
6. [WebSocket Architecture](#6-websocket-architecture)
7. [Blockchain Integration](#7-blockchain-integration)
8. [Storage Architecture](#8-storage-architecture)
9. [Scheduling & Background Jobs](#9-scheduling--background-jobs)
10. [Error Handling Strategy](#10-error-handling-strategy)
11. [Caching Strategy](#11-caching-strategy)
12. [Security Architecture](#12-security-architecture)

---

## **1. BACKEND OVERVIEW**

### **1.1 Core Backend Responsibilities**

```
Backend Responsibilities:
├── HTTP API Server
│   ├── Handle file uploads (audio)
│   ├── Serve audio files via streaming
│   ├── Provide REST endpoints for data
│   ├── Validate requests & authentication
│   └── Return JSON responses
│
├── WebSocket Server
│   ├── Manage real-time connections
│   ├── Broadcast events to all listeners
│   ├── Track active connections
│   ├── Handle connection lifecycle
│   └── Distribute updates instantly
│
├── Audio Processing Pipeline
│   ├── Convert audio formats (FFmpeg)
│   ├── Validate audio duration/quality
│   ├── Normalize audio levels
│   ├── Generate waveform data
│   └── Extract metadata
│
├── Blockchain Integration
│   ├── Interact with smart contracts
│   ├── Mint NFTs on Mantle
│   ├── Listen for blockchain events
│   ├── Sign transactions with platform wallet
│   └── Verify transaction status
│
├── IPFS Integration
│   ├── Upload audio files to IPFS
│   ├── Upload metadata JSON to IPFS
│   ├── Generate IPFS hashes
│   ├── Manage pinning lifecycle
│   └── Unpin after 24 hours
│
├── Queue Management
│   ├── Maintain active note queue
│   ├── Add/remove notes dynamically
│   ├── Handle echo relationships
│   ├── Update tips and statistics
│   └── Broadcast queue changes
│
├── Scheduling System
│   ├── Schedule 24-hour deletions
│   ├── Handle time-locked notes
│   ├── Execute cleanup tasks
│   ├── Manage timer lifecycle
│   └── Handle server restarts
│
├── AI/ML Services (Optional)
│   ├── Transcribe audio (Whisper API)
│   ├── Analyze sentiment
│   ├── Detect mood/emotion
│   └── Map to color values
│
└── Monitoring & Logging
    ├── Log all operations
    ├── Track metrics (uploads, tips, etc.)
    ├── Monitor performance
    ├── Alert on errors
    └── Generate reports
```

### **1.2 Technology Stack**

```
Runtime & Framework:
├── Bun (JavaScript/TypeScript runtime)
│   ├── Fast startup time
│   ├── Built-in WebSocket support
│   ├── Native TypeScript support
│   └── High performance I/O

Core Libraries:
├── HTTP Server: Bun.serve()
├── WebSocket: Built-in ws module
├── Audio Processing: fluent-ffmpeg
├── Blockchain: ethers.js
├── IPFS: @pinata/sdk
├── AI: openai (Whisper API)
└── Logging: winston

External Services:
├── Pinata (IPFS storage)
├── Mantle Network (blockchain)
├── OpenAI API (transcription - optional)
└── Monitoring services (optional)
```

---

## **2. SYSTEM ARCHITECTURE**

### **2.1 High-Level Backend Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET / USERS                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS/WSS
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  LOAD BALANCER (Nginx)                      │
│  - SSL Termination                                          │
│  - Rate Limiting                                            │
│  - Request Routing                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │
            ┌────────────┴────────────┐
            │                         │
┌───────────▼──────────┐   ┌─────────▼────────────┐
│   HTTP SERVER        │   │  WEBSOCKET SERVER    │
│   Port: 3000         │   │  Port: 3001          │
│   (Bun Process)      │   │  (Same Bun Process)  │
└───────────┬──────────┘   └─────────┬────────────┘
            │                         │
            │                         │
            └────────────┬────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    ROUTING LAYER                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │   Upload   │  │   Stream   │  │   Audio    │          │
│  │   Routes   │  │   Routes   │  │   Routes   │          │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘          │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   MIDDLEWARE LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   CORS      │  │Rate Limit   │  │Validation   │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Auth      │  │Error Handler│  │   Logger    │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   SERVICE LAYER                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ AudioProcessor   │  │ BlockchainSvc    │               │
│  │ - FFmpeg ops     │  │ - Contract calls │               │
│  │ - Validation     │  │ - Event listening│               │
│  │ - Waveform gen   │  │ - TX signing     │               │
│  └──────────────────┘  └──────────────────┘               │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ IPFSUploader     │  │ QueueManager     │               │
│  │ - Upload files   │  │ - Note queue     │               │
│  │ - Metadata gen   │  │ - Echo linking   │               │
│  │ - Unpinning      │  │ - Statistics     │               │
│  └──────────────────┘  └──────────────────┘               │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ SentimentAnalyzer│  │ Scheduler        │               │
│  │ - Transcription  │  │ - 24hr deletion  │               │
│  │ - Sentiment calc │  │ - Time locks     │               │
│  │ - Mood mapping   │  │ - Cleanup tasks  │               │
│  └──────────────────┘  └──────────────────┘               │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ WebSocketManager │  │ CacheManager     │               │
│  │ - Connections    │  │ - Memory cache   │               │
│  │ - Broadcasting   │  │ - Redis (opt)    │               │
│  │ - Event handling │  │ - TTL management │               │
│  └──────────────────┘  └──────────────────┘               │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
┌─────────────▼──────────┐   ┌─────────▼────────────────────┐
│   FILE SYSTEM          │   │  IN-MEMORY STORAGE           │
│   /uploads/            │   │  ┌────────────────────────┐ │
│   ├── notes/           │   │  │ Active Queue          │ │
│   │   ├── note_1.mp3   │   │  │ {                     │ │
│   │   └── note_2.mp3   │   │  │   notes: [...],       │ │
│   └── echoes/          │   │  │   listeners: Map(),   │ │
│       ├── echo_1.mp3   │   │  │   timers: Map()       │ │
│       └── echo_2.mp3   │   │  │ }                     │ │
│                        │   │  └────────────────────────┘ │
└────────────────────────┘   └──────────────────────────────┘
```

### **2.2 Process Architecture**

```
Main Bun Process (PID: 1234)
├── HTTP Server Thread
│   ├── Handles REST API requests
│   ├── Serves static files
│   └── Streams audio files
│
├── WebSocket Server Thread
│   ├── Manages active connections
│   ├── Broadcasts events
│   └── Handles real-time updates
│
├── Background Workers (Event Loop)
│   ├── Audio Processing Queue
│   ├── IPFS Upload Queue
│   ├── Blockchain Transaction Queue
│   └── Deletion Scheduler
│
└── Event Listeners
    ├── Smart Contract Events
    ├── WebSocket Connection Events
    └── File System Events
```

### **2.3 Service Communication**

```
How Services Talk to Each Other:

Upload Route
    ↓ calls
AudioProcessor
    ↓ emits event "audioProcessed"
IPFSUploader (listening)
    ↓ uploads to IPFS
    ↓ emits event "ipfsUploaded"
BlockchainService (listening)
    ↓ mints NFT
    ↓ emits event "nftMinted"
QueueManager (listening)
    ↓ adds to queue
    ↓ emits event "noteAdded"
WebSocketManager (listening)
    ↓ broadcasts to clients
Scheduler (listening)
    ↓ schedules deletion

Pattern: Event-Driven Architecture
- Services don't call each other directly
- Services emit events when tasks complete
- Other services listen and react
- Loose coupling, easy to test
```

---

## **3. REQUEST FLOW DIAGRAMS**

### **3.1 Upload Flow (Complete Journey)**

```
CLIENT SENDS UPLOAD REQUEST
         ↓
┌────────────────────────────────────────┐
│ 1. NGINX (Load Balancer)               │
│    - Receives HTTPS request            │
│    - Checks SSL certificate            │
│    - Applies rate limiting             │
│    - Forwards to Bun server            │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 2. HTTP SERVER (Bun)                   │
│    - POST /api/upload received         │
│    - Extract multipart/form-data       │
│    - Parse: audio file, walletAddress  │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 3. MIDDLEWARE CHAIN                    │
│    A. CORS Check                       │
│       - Verify origin allowed          │
│       - Set CORS headers               │
│    B. Rate Limit                       │
│       - Check IP request count         │
│       - Allow if under limit           │
│    C. Authentication (optional)        │
│       - Verify JWT if present          │
│    D. Validation                       │
│       - Check file type (audio/*)      │
│       - Check file size (<10MB)        │
│       - Validate wallet address        │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 4. UPLOAD ROUTE HANDLER                │
│    - Generate unique noteId (UUID)     │
│    - Save file temporarily             │
│      /uploads/temp/{noteId}.webm       │
│    - Log: "Processing upload: {noteId}"│
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 5. AUDIO PROCESSOR SERVICE             │
│    A. Validation Phase                 │
│       - Get file duration via ffprobe  │
│       - Check: 30s ≤ duration ≤ 90s    │
│       - If invalid: throw error        │
│                                        │
│    B. Conversion Phase                 │
│       - Input: /temp/{noteId}.webm     │
│       - FFmpeg: convert to MP3         │
│       - Settings: 128kbps, mono, 44.1k │
│       - Output: /temp/{noteId}_conv.mp3│
│                                        │
│    C. Normalization Phase              │
│       - Input: {noteId}_conv.mp3       │
│       - FFmpeg: apply loudnorm filter  │
│       - Balance audio levels           │
│       - Output: /notes/{noteId}.mp3    │
│                                        │
│    D. Waveform Generation              │
│       - Analyze audio file             │
│       - Extract amplitude data         │
│       - Generate 100 data points       │
│       - Return: [0.2, 0.5, 0.8, ...]   │
│                                        │
│    E. Cleanup                          │
│       - Delete /temp/{noteId}.webm     │
│       - Delete {noteId}_conv.mp3       │
│                                        │
│    Result: {                           │
│      outputPath: "/notes/{id}.mp3",    │
│      duration: 45,                     │
│      waveform: [...]                   │
│    }                                   │
│                                        │
│    Emit Event: "audioProcessed"        │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 6. SENTIMENT ANALYZER (Optional)       │
│    A. Transcription                    │
│       - Read audio file                │
│       - Call OpenAI Whisper API        │
│       - POST to api.openai.com/v1/audio│
│       - Get transcript text            │
│                                        │
│    B. Sentiment Analysis               │
│       - Analyze transcript             │
│       - Calculate sentiment score      │
│       - Range: -1 (sad) to +1 (happy)  │
│                                        │
│    C. Mood Mapping                     │
│       - If score < -0.3: Purple        │
│       - If score -0.3 to 0.3: Blue     │
│       - If score > 0.3: Orange         │
│                                        │
│    Result: {                           │
│      transcript: "...",                │
│      score: 0.15,                      │
│      moodColor: "#0EA5E9"              │
│    }                                   │
│                                        │
│    If fails: Default to blue           │
│    Emit Event: "sentimentAnalyzed"     │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 7. IPFS UPLOADER SERVICE               │
│    A. Upload Audio File                │
│       - Read: /notes/{noteId}.mp3      │
│       - Create ReadStream              │
│       - Call Pinata.pinFileToIPFS()    │
│       - Set metadata: {                │
│           name: "audio_{timestamp}",   │
│           keyvalues: {noteId}          │
│         }                              │
│       - Receive: QmAbc123... (CID)     │
│       - Audio URL: ipfs://QmAbc123     │
│                                        │
│    B. Create Metadata JSON             │
│       metadata = {                     │
│         name: "Voice Note #{noteId}",  │
│         description: "A transmission", │
│         audio: "ipfs://QmAbc123...",   │
│         attributes: [                  │
│           {trait: "Duration", val: 45},│
│           {trait: "Mood", val: "Blue"},│
│           {trait: "Timestamp", ...}    │
│         ],                             │
│         properties: {                  │
│           waveform: [...],             │
│           duration: 45,                │
│           moodColor: "#0EA5E9"         │
│         }                              │
│       }                                │
│                                        │
│    C. Upload Metadata JSON             │
│       - Call Pinata.pinJSONToIPFS()    │
│       - Receive: QmDef456... (CID)     │
│       - Metadata URL: ipfs://QmDef456  │
│                                        │
│    Result: {                           │
│      audioIPFS: "QmAbc123...",         │
│      metadataIPFS: "QmDef456...",      │
│      audioUrl: "https://gateway..."    │
│    }                                   │
│                                        │
│    Emit Event: "ipfsUploaded"          │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 8. BLOCKCHAIN SERVICE                  │
│    A. Connect to Mantle                │
│       - RPC: https://rpc.mantle.xyz    │
│       - Load platform wallet           │
│       - privateKey from env            │
│                                        │
│    B. Prepare Transaction              │
│       contract = VoiceNoteNFT          │
│       function = mintVoiceNote()       │
│       params = [                       │
│         ipfsHash: "QmDef456...",       │
│         duration: 45,                  │
│         moodColor: "#0EA5E9",          │
│         audioIPFS: "QmAbc123..."       │
│       ]                                │
│                                        │
│    C. Estimate Gas                     │
│       gasEstimate = contract.estimate  │
│       gasLimit = estimate * 1.2        │
│       gasPrice = provider.getGasPrice()│
│                                        │
│    D. Send Transaction                 │
│       tx = await contract.mintVoiceNote│
│       txHash = tx.hash                 │
│       Log: "TX sent: {txHash}"         │
│                                        │
│    E. Wait for Confirmation            │
│       receipt = await tx.wait()        │
│       status = receipt.status (1=success)│
│       blockNumber = receipt.blockNumber│
│                                        │
│    F. Extract Token ID                 │
│       Find "VoiceNoteMinted" event     │
│       tokenId = event.args.tokenId     │
│                                        │
│    Result: {                           │
│      tokenId: 4523,                    │
│      txHash: "0xabc...",               │
│      blockNumber: 12345678             │
│    }                                   │
│                                        │
│    Emit Event: "nftMinted"             │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 9. QUEUE MANAGER SERVICE               │
│    A. Create Note Object               │
│       note = {                         │
│         noteId: "uuid-123",            │
│         tokenId: 4523,                 │
│         audioUrl: "https://gateway...",│
│         metadataUrl: "https://...",    │
│         duration: 45,                  │
│         moodColor: "#0EA5E9",          │
│         waveform: [...],               │
│         timestamp: Date.now(),         │
│         expiresAt: now + 24hrs,        │
│         broadcaster: "0x7B3f...",      │
│         sector: "7G-Delta",            │
│         tips: 0,                       │
│         echoes: 0,                     │
│         isExpired: false               │
│       }                                │
│                                        │
│    B. Add to Queue                     │
│       if (scheduledFor) {              │
│         timeLockQueue.set(time, note)  │
│       } else {                         │
│         noteQueue.unshift(note)        │
│         // Add to beginning            │
│       }                                │
│                                        │
│    C. Save to Cache                    │
│       memoryCache.set("noteQueue", queue)│
│                                        │
│    D. Update Statistics                │
│       totalNotes++                     │
│       activeBroadcasters.add(address)  │
│                                        │
│    Emit Event: "noteAdded"             │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 10. SCHEDULER SERVICE                  │
│     A. Schedule 24hr Deletion          │
│        timer = setTimeout(() => {      │
│          deleteNote(noteId)            │
│          markNFTExpired(tokenId)       │
│          unpinFromIPFS(ipfsHash)       │
│          broadcastExpiration()         │
│        }, 24 * 60 * 60 * 1000)         │
│                                        │
│     B. Store Timer Reference           │
│        deletionTimers.set(noteId, timer)│
│                                        │
│     C. Persist Timer Info              │
│        // In case server restarts      │
│        save({                          │
│          noteId,                       │
│          expiresAt: timestamp          │
│        })                              │
│                                        │
│     If scheduledFor exists:            │
│       Schedule release timer           │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 11. WEBSOCKET MANAGER SERVICE          │
│     A. Prepare Broadcast Message       │
│        message = {                     │
│          type: "newNote",              │
│          data: {                       │
│            noteId: "uuid-123",         │
│            tokenId: 4523,              │
│            audioUrl: "...",            │
│            duration: 45,               │
│            moodColor: "#0EA5E9",       │
│            waveform: [...],            │
│            sector: "7G-Delta",         │
│            broadcaster: "0x...",       │
│            timestamp: 1234567890       │
│          }                             │
│        }                               │
│                                        │
│     B. Broadcast to All Clients        │
│        for (client of activeClients) { │
│          if (client.readyState === OPEN)│
│            client.send(JSON.stringify(msg))│
│        }                               │
│                                        │
│     C. Log Broadcast                   │
│        Log: "Broadcast to {count} listeners"│
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 12. RESPONSE TO CLIENT                 │
│     HTTP 200 OK                        │
│     Content-Type: application/json     │
│     Body: {                            │
│       success: true,                   │
│       data: {                          │
│         noteId: "uuid-123",            │
│         tokenId: 4523,                 │
│         audioUrl: "https://...",       │
│         duration: 45,                  │
│         moodColor: "#0EA5E9",          │
│         expiresAt: 1234567890,         │
│         txHash: "0xabc..."             │
│       }                                │
│     }                                  │
│                                        │
│     Total Time: 3-5 seconds            │
└────────────────────────────────────────┘

ALL CONNECTED CLIENTS RECEIVE WEBSOCKET EVENT
Frontend updates queue in real-time
```

### **3.2 Stream Request Flow**

```
CLIENT REQUESTS STREAM
         ↓
┌────────────────────────────────────────┐
│ 1. HTTP GET /api/stream                │
│    - Simple GET request                │
│    - No body, no file upload           │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 2. MIDDLEWARE                          │
│    - CORS check ✓                      │
│    - Rate limit check ✓                │
│    - No auth needed (public endpoint)  │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 3. STREAM ROUTE HANDLER                │
│    - Call QueueManager.getQueue()      │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 4. QUEUE MANAGER                       │
│    A. Get Current Queue                │
│       queue = this.noteQueue           │
│                                        │
│    B. Filter Expired Notes             │
│       now = Date.now()                 │
│       activeNotes = queue.filter(      │
│         note => note.expiresAt > now   │
│       )                                │
│                                        │
│    C. Sort by Timestamp                │
│       sorted = activeNotes.sort(       │
│         (a,b) => b.timestamp - a.timestamp│
│       )                                │
│                                        │
│    D. Get Listener Count               │
│       count = wsManager.getClientCount()│
│                                        │
│    Return: {                           │
│      notes: sorted,                    │
│      totalListeners: count,            │
│      serverTime: Date.now()            │
│    }                                   │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 5. RESPONSE TO CLIENT                  │
│    HTTP 200 OK                         │
│    Body: {                             │
│      success: true,                    │
│      data: {                           │
│        notes: [...],                   │
│        totalListeners: 47,             │
│        serverTime: 1234567890          │
│      }                                 │
│    }                                   │
│                                        │
│    Total Time: <100ms                  │
└────────────────────────────────────────┘
```

### **3.3 Audio Streaming Flow**

```
CLIENT REQUESTS AUDIO FILE
         ↓
┌────────────────────────────────────────┐
│ 1. HTTP GET /api/audio/{noteId}        │
│    Headers:                            │
│      Range: bytes=0-1023 (optional)    │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 2. AUDIO ROUTE HANDLER                 │
│    A. Extract noteId from URL          │
│       noteId = params.noteId           │
│                                        │
│    B. Construct File Path              │
│       path = `/uploads/notes/${noteId}.mp3`│
│                                        │
│    C. Check File Exists                │
│       exists = await fileExists(path)  │
│       if (!exists) return 404          │
│                                        │
│    D. Get File Stats                   │
│       stats = await stat(path)         │
│       fileSize = stats.size            │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 3. RANGE REQUEST HANDLING              │
│    Check if Range header present       │
│                                        │
│    IF RANGE REQUESTED:                 │
│      A. Parse Range Header             │
│         "bytes=0-1023"                 │
│         start = 0                      │
│         end = 1023                     │
│                                        │
│      B. Calculate Chunk Size           │
│         chunkSize = (end - start) + 1  │
│                                        │
│      C. Create File Slice              │
│         file = Bun.file(path)          │
│         stream = file.slice(start, end+1)│
│                                        │
│      D. Return Partial Response        │
│         Status: 206 Partial Content    │
│         Headers: {                     │
│           Content-Range: "bytes 0-1023/fileSize"│
│           Accept-Ranges: "bytes",      │
│           Content-Length: chunkSize,   │
│           Content-Type: "audio/mpeg"   │
│         }                              │
│         Body: stream                   │
│                                        │
│    IF NO RANGE:                        │
│      A. Stream Entire File             │
│         file = Bun.file(path)          │
│                                        │
│      B. Return Full Response           │
│         Status: 200 OK                 │
│         Headers: {                     │
│           Content-Type: "audio/mpeg",  │
│           Content-Length: fileSize,    │
│           Accept-Ranges: "bytes"       │
│         }                              │
│         Body: file                     │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 4. STREAMING TO CLIENT                 │
│    - Bun handles streaming automatically│
│    - Client can seek (sends new Range) │
│    - Efficient memory usage            │
│    - Supports pause/resume             │
└────────────────────────────────────────┘

Benefits of Range
Requests:
- Enables seeking in audio player
- Reduces bandwidth for partial playback
- Faster initial load
- Better mobile experience
```

### **3.4 Tip Transaction Flow**

```
CLIENT SENDS TIP (from Frontend)
         ↓
┌────────────────────────────────────────┐
│ 1. FRONTEND TRIGGERS                   │
│    - User clicks "Tip" button          │
│    - Selects amount: 0.5 MNT           │
│    - Confirms transaction              │
│    - MetaMask popup appears            │
│    - User approves in MetaMask         │
│                                        │
│    Frontend calls contract directly:   │
│    TippingPool.tipNote(tokenId, {      │
│      value: parseEther("0.5")          │
│    })                                  │
│                                        │
│    Transaction sent to Mantle Network  │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 2. SMART CONTRACT EXECUTES             │
│    (On Mantle Blockchain)              │
│                                        │
│    TippingPool.tipNote() runs:         │
│    - Validates: value > 0              │
│    - Gets broadcaster address          │
│    - Calculates fees:                  │
│      * Platform: 0.025 MNT (5%)        │
│      * Broadcaster: 0.475 MNT (95%)    │
│    - Transfers to broadcaster          │
│    - Updates totalTips mapping         │
│    - Calls VoiceNoteNFT.updateTipAmount│
│    - Emits "TipSent" event             │
│                                        │
│    Transaction confirmed (2-3 seconds) │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 3. BACKEND EVENT LISTENER              │
│    (BlockchainService monitoring events)│
│                                        │
│    A. Detect "TipSent" Event           │
│       event = {                        │
│         tokenId: 4523,                 │
│         tipper: "0xAbc...",            │
│         broadcaster: "0xDef...",       │
│         amount: "500000000000000000",  │
│         platformFee: "25000...",       │
│         broadcasterAmount: "475000..." │
│       }                                │
│                                        │
│    B. Parse Event Data                 │
│       tokenId = event.tokenId          │
│       amount = formatEther(event.amount)│
│       // "0.5"                         │
│                                        │
│    C. Update Queue Manager             │
│       queueManager.updateTipAmount(    │
│         tokenId,                       │
│         parseFloat(amount)             │
│       )                                │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 4. QUEUE MANAGER UPDATES               │
│    A. Find Note by Token ID            │
│       note = queue.find(               │
│         n => n.tokenId === tokenId     │
│       )                                │
│                                        │
│    B. Update Tip Amount                │
│       note.tips += amount              │
│       // Old: 2.3, New: 2.8            │
│                                        │
│    C. Save to Cache                    │
│       memoryCache.set("noteQueue", queue)│
│                                        │
│    Emit Event: "tipUpdated"            │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 5. WEBSOCKET BROADCAST                 │
│    A. Prepare Message                  │
│       message = {                      │
│         type: "tipReceived",           │
│         data: {                        │
│           tokenId: 4523,               │
│           amount: "0.5",               │
│           newTotal: "2.8",             │
│           tipper: "0xAbc..."           │
│         }                              │
│       }                                │
│                                        │
│    B. Broadcast to All Clients         │
│       wsManager.broadcast(message)     │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 6. ALL CLIENTS UPDATE UI               │
│    - Receive WebSocket event           │
│    - Update tip amount on NFT card     │
│    - Show flash animation              │
│    - Update leaderboard if needed      │
└────────────────────────────────────────┘

Note: Backend doesn't handle the transaction
      It only listens for events and updates state
```

### **3.5 Echo Recording Flow**

```
CLIENT RECORDS ECHO
         ↓
┌────────────────────────────────────────┐
│ 1. POST /api/echo/{parentNoteId}       │
│    - FormData with echo audio file     │
│    - walletAddress                     │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 2. VALIDATION                          │
│    - Check parent note exists          │
│    - Validate audio file (max 30s)     │
│    - Check wallet address              │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 3. PROCESS ECHO AUDIO                  │
│    (Similar to main upload)            │
│    - Save temp file                    │
│    - Convert to MP3                    │
│    - Validate duration ≤ 30s           │
│    - Generate echoId (UUID)            │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 4. UPLOAD TO IPFS                      │
│    - Upload echo audio                 │
│    - Create echo metadata              │
│    - Link to parent tokenId            │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 5. MINT ECHO NFT                       │
│    - Call VoiceNoteNFT.mintVoiceNote() │
│    - Get echo tokenId                  │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 6. REGISTER ECHO RELATIONSHIP          │
│    - Call EchoRegistry.registerEcho(   │
│        parentTokenId,                  │
│        echoTokenId                     │
│      )                                 │
│    - Links echo to parent on-chain     │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 7. UPDATE QUEUE MANAGER                │
│    - Find parent note in queue         │
│    - Increment echo count              │
│    - Store echo relationship           │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 8. BROADCAST ECHO EVENT                │
│    WebSocket: "echoAdded"              │
│    - All clients see new echo          │
│    - Parent note shows +1 echo         │
└────────────────────────────────────────┘
```

---

## **4. SERVICE LAYER ARCHITECTURE**

### **4.1 AudioProcessor Service**

**Purpose:** Handle all audio file processing

**Responsibilities:**
```
AudioProcessor
├── File Validation
│   ├── Check file type (MIME)
│   ├── Check file size
│   ├── Verify it's actual audio (not renamed)
│   └── Extract duration via ffprobe
│
├── Format Conversion
│   ├── Accept: webm, wav, mp3, ogg
│   ├── Output: MP3 (128kbps, mono, 44.1kHz)
│   ├── Use FFmpeg child process
│   └── Handle conversion errors
│
├── Audio Normalization
│   ├── Apply loudnorm filter
│   ├── Balance audio levels
│   ├── Prevent clipping
│   └── Ensure consistent volume
│
├── Waveform Generation
│   ├── Analyze audio samples
│   ├── Calculate amplitude per segment
│   ├── Generate 100 data points
│   └── Normalize values (0-1 range)
│
└── Cleanup
    ├── Delete temporary files
    ├── Handle process errors
    └── Free system resources
```

**Internal Flow:**
```
Input: audioFile (Buffer/Stream)
  ↓
validate() → Check type, size, duration
  ↓
convertToMP3() → FFmpeg conversion
  ↓
normalize() → Apply loudnorm filter
  ↓
generateWaveform() → Extract amplitude data
  ↓
cleanup() → Delete temp files
  ↓
Output: {
  outputPath: string,
  duration: number,
  waveform: number[]
}
```

**Error Handling:**
- Invalid file type → Throw "Invalid audio format"
- Duration < 30s → Throw "Audio too short"
- Duration > 90s → Throw "Audio too long"
- FFmpeg fails → Throw "Audio processing failed"
- Cleanup errors → Log but don't fail

**Events Emitted:**
- `audioProcessed` → When complete
- `audioError` → On failure

---

### **4.2 IPFSUploader Service**

**Purpose:** Manage IPFS uploads and lifecycle

**Responsibilities:**
```
IPFSUploader
├── Audio Upload
│   ├── Read file as stream
│   ├── Call Pinata API
│   ├── Set pinning options
│   ├── Return IPFS CID
│   └── Generate gateway URL
│
├── Metadata Upload
│   ├── Create metadata JSON
│   ├── Upload as JSON to Pinata
│   ├── Return metadata CID
│   └── Ensure proper formatting
│
├── Unpinning
│   ├── Unpin after 24 hours
│   ├── Call Pinata unpin API
│   ├── Handle unpin errors
│   └── Log unpin operations
│
└── Error Recovery
    ├── Retry failed uploads (3x)
    ├── Exponential backoff
    ├── Log all operations
    └── Alert on persistent failures
```

**Upload Flow:**
```
uploadAudio(filePath)
  ↓
Create ReadStream
  ↓
Call pinata.pinFileToIPFS(stream, {
  pinataMetadata: {
    name: "audio_123",
    keyvalues: { noteId: "..." }
  },
  pinataOptions: {
    cidVersion: 1
  }
})
  ↓
Receive: { IpfsHash: "QmAbc123..." }
  ↓
Generate URL: "https://gateway.pinata.cloud/ipfs/QmAbc123"
  ↓
Return: {
  ipfsHash: "QmAbc123...",
  gatewayUrl: "https://..."
}
```

**Metadata Structure:**
```json
{
  "name": "Voice Note #4523",
  "description": "A midnight transmission from Sector 7G-Delta",
  "external_url": "https://midnightradio.xyz/note/4523",
  "audio": "ipfs://QmAbc123...",
  "attributes": [
    { "trait_type": "Duration", "value": "45s" },
    { "trait_type": "Mood", "value": "Calm" },
    { "trait_type": "Color", "value": "#0EA5E9" },
    { "trait_type": "Sector", "value": "7G-Delta" },
    { "trait_type": "Timestamp", "value": 1704902400 },
    { "trait_type": "Expires", "value": 1704988800 }
  ],
  "properties": {
    "waveform": [0.2, 0.5, 0.8, ...],
    "duration": 45,
    "moodColor": "#0EA5E9"
  }
}
```

**Events Emitted:**
- `ipfsUploaded` → When both audio + metadata uploaded
- `ipfsError` → On upload failure
- `unpinned` → After 24hr unpin

---

### **4.3 BlockchainService**

**Purpose:** Interface with Mantle smart contracts

**Responsibilities:**
```
BlockchainService
├── Connection Management
│   ├── Connect to Mantle RPC
│   ├── Load platform wallet
│   ├── Maintain provider instance
│   └── Handle connection errors
│
├── Contract Interaction
│   ├── Load contract ABIs
│   ├── Create contract instances
│   ├── Call contract functions
│   ├── Sign transactions
│   └── Wait for confirmations
│
├── Event Listening
│   ├── Listen to VoiceNoteMinted
│   ├── Listen to TipSent
│   ├── Listen to EchoRegistered
│   ├── Listen to VoiceNoteExpired
│   └── Parse event data
│
├── Transaction Management
│   ├── Estimate gas
│   ├── Set gas limit (estimate * 1.2)
│   ├── Get current gas price
│   ├── Handle nonce management
│   └── Retry failed transactions
│
└── Error Handling
    ├── Catch revert reasons
    ├── Handle insufficient gas
    ├── Detect nonce issues
    └── Log all transactions
```

**Minting Flow:**
```
mintVoiceNote(ipfsHash, duration, moodColor, audioIPFS)
  ↓
Load Contract
  contract = new ethers.Contract(
    VOICE_NOTE_NFT_ADDRESS,
    ABI,
    platformWallet
  )
  ↓
Estimate Gas
  gasEstimate = await contract.estimateGas.mintVoiceNote(...)
  gasLimit = Math.floor(gasEstimate * 1.2)
  ↓
Get Gas Price
  gasPrice = await provider.getGasPrice()
  ↓
Send Transaction
  tx = await contract.mintVoiceNote(
    ipfsHash,
    duration,
    moodColor,
    audioIPFS,
    { gasLimit, gasPrice }
  )
  ↓
Log Transaction
  logger.info(`TX sent: ${tx.hash}`)
  ↓
Wait for Confirmation
  receipt = await tx.wait()
  ↓
Check Status
  if (receipt.status !== 1) throw "TX failed"
  ↓
Parse Events
  mintEvent = receipt.logs.find(
    log => log.fragment.name === 'VoiceNoteMinted'
  )
  tokenId = mintEvent.args.tokenId.toNumber()
  ↓
Return: {
  tokenId,
  txHash: receipt.hash,
  blockNumber: receipt.blockNumber
}
```

**Event Listening Setup:**
```
Start Event Listeners on Server Boot:

voiceNoteNFT.on("VoiceNoteMinted", (tokenId, broadcaster, ipfsHash, timestamp) => {
  // Usually handled during upload flow
  // But catch any external mints
  logger.info(`External mint detected: ${tokenId}`)
})

tippingPool.on("TipSent", (tokenId, tipper, broadcaster, amount, fee) => {
  // Update queue manager
  const amountMNT = ethers.formatEther(amount)
  queueManager.updateTipAmount(tokenId, parseFloat(amountMNT))
  
  // Broadcast to WebSocket clients
  wsManager.broadcast({
    type: "tipReceived",
    data: { tokenId, amount: amountMNT, tipper }
  })
})

echoRegistry.on("EchoRegistered", (parentTokenId, echoTokenId, echoBroadcaster) => {
  // Update parent note echo count
  queueManager.addEcho(parentTokenId, echoTokenId)
  
  // Broadcast to clients
  wsManager.broadcast({
    type: "echoAdded",
    data: { parentTokenId, echoTokenId }
  })
})

voiceNoteNFT.on("VoiceNoteExpired", (tokenId, expiredAt) => {
  // Usually handled by scheduler
  // But catch any external expirations
  logger.info(`Note expired: ${tokenId}`)
})
```

**Error Handling:**
```
Try-Catch Patterns:

try {
  const result = await blockchainService.mintVoiceNote(...)
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    throw new Error("Platform wallet has insufficient MNT")
  }
  
  if (error.code === 'NONCE_EXPIRED') {
    // Retry with fresh nonce
    return retryWithNewNonce()
  }
  
  if (error.reason) {
    // Contract revert reason
    throw new Error(`Contract reverted: ${error.reason}`)
  }
  
  throw new Error(`Blockchain error: ${error.message}`)
}
```

**Events Emitted:**
- `nftMinted` → When mint succeeds
- `tipReceived` → When tip event detected
- `echoRegistered` → When echo linked
- `blockchainError` → On any error

---

### **4.4 QueueManager Service**

**Purpose:** Manage active voice note queue and relationships

**Responsibilities:**
```
QueueManager
├── Queue Management
│   ├── Add notes to queue
│   ├── Remove expired notes
│   ├── Sort by timestamp
│   ├── Limit queue size (100 max)
│   └── Handle overflow
│
├── Echo Management
│   ├── Link echoes to parents
│   ├── Track echo relationships
│   ├── Update echo counts
│   └── Retrieve echo chains
│
├── Statistics Tracking
│   ├── Count total notes
│   ├── Track active notes
│   ├── Sum total tips
│   ├── Count total echoes
│   └── Generate reports
│
├── Cache Synchronization
│   ├── Save queue to memory cache
│   ├── Load on server start
│   ├── Persist critical data
│   └── Handle cache invalidation
│
└── Event Broadcasting
    ├── Emit noteAdded
    ├── Emit noteRemoved
    ├── Emit tipUpdated
    └── Emit echoAdded
```

**Internal Data Structure:**
```
QueueManager {
  private noteQueue: Note[] = []
  private echoMap: Map<tokenId, Echo[]> = new Map()
  private readonly MAX_QUEUE_SIZE = 100
  
  // In-memory note structure
  Note {
    noteId: string
    tokenId: number
    audioUrl: string
    metadataUrl: string
    duration: number
    moodColor: string
    waveform: number[]
    timestamp: number
    expiresAt: number
    broadcaster: string
    sector: string
    tips: number
    echoes: number
    isExpired: boolean
  }
}
```

**Key Operations:**
```
addNote(note)
  ↓
Check queue size
  if (queue.length >= MAX_QUEUE_SIZE) {
    Remove oldest note
    Log: "Queue full, removed oldest"
  }
  ↓
Add to beginning (newest first)
  noteQueue.unshift(note)
  ↓
Save to cache
  memoryCache.set("noteQueue", noteQueue, 86400)
  ↓
Emit event
  this.emit("noteAdded", note)
  ↓
Log
  logger.info(`Note added: ${note.noteId}, Queue: ${queue.length}`)

---

removeNote(noteId)
  ↓
Filter queue
  noteQueue = noteQueue.filter(n => n.noteId !== noteId)
  ↓
Save to cache
  ↓
Emit event
  this.emit("noteRemoved", noteId)

---

updateTipAmount(tokenId, amount)
  ↓
Find note
  note = noteQueue.find(n => n.tokenId === tokenId)
  ↓
Update tips
  note.tips += amount
  ↓
Save to cache
  ↓
Emit event
  this.emit("tipUpdated", { tokenId, amount })

---

addEcho(parentNoteId, echoTokenId)
  ↓
Find parent note
  note = noteQueue.find(n => n.noteId === parentNoteId)
  ↓
Increment echo count
  note.echoes++
  ↓
Store echo relationship
  if (!echoMap.has(parentTokenId)) {
    echoMap.set(parentTokenId, [])
  }
  echoMap.get(parentTokenId).push(echoTokenId)
  ↓
Save to cache
  ↓
Emit event
  this.emit("echoAdded", { parentNoteId, echoTokenId })

---

cleanup()
  (Runs every 10 minutes)
  ↓
Get current time
  now = Date.now()
  ↓
Filter expired notes
  noteQueue = noteQueue.filter(note => note.expiresAt > now)
  ↓
Log if any removed
  if (removed > 0) {
    logger.info(`Cleaned up ${removed} expired notes`)
  }
  ↓
Save to cache
```

**Cache Persistence:**
```
saveToCache()
  memoryCache.set("noteQueue", this.noteQueue, 86400) // 24hrs TTL
  memoryCache.set("echoMap", Array.from(this.echoMap.entries()), 86400)

loadFromCache() // On server start
  const cachedQueue = memoryCache.get("noteQueue")
  if (cachedQueue) {
    this.noteQueue = cachedQueue
    logger.info(`Loaded ${this.noteQueue.length} notes from cache`)
  }
  
  const cachedEchoes = memoryCache.get("echoMap")
  if (cachedEchoes) {
    this.echoMap = new Map(cachedEchoes)
  }
```

**Events Emitted:**
- `noteAdded` → New note in queue
- `noteRemoved` → Note removed
- `tipUpdated` → Tip amount changed
- `echoAdded` → Echo linked to parent

---

### **4.5 WebSocketManager Service**

**Purpose:** Manage real-time WebSocket connections and broadcasting

**Responsibilities:**
```
WebSocketManager
├── Connection Management
│   ├── Accept new connections
│   ├── Track active clients
│   ├── Handle disconnections
│   ├── Maintain client map
│   └── Implement heartbeat/ping-pong
│
├── Message Handling
│   ├── Parse incoming messages
│   ├── Validate message format
│   ├── Route to handlers
│   └── Send responses
│
├── Broadcasting
│   ├── Send to all clients
│   ├── Send to specific client
│   ├── Handle broadcast errors
│   └── Queue messages if needed
│
├── Listener Tracking
│   ├── Count active connections
│   ├── Track peak listeners
│   ├── Generate statistics
│   └── Broadcast count updates
│
└── Cleanup
    ├── Remove dead connections
    ├── Clear stale data
    ├── Handle memory leaks
    └── Log connection lifecycle
```

**Internal Structure:**
```
WebSocketManager {
  private clients: Map<clientId, WebSocket> = new Map()
  private heartbeatInterval: NodeJS.Timeout
  
  // Track client info
  ClientInfo {
    id: string
    connectedAt: number
    lastPing: number
    metadata: any
  }
}
```

**Connection Lifecycle:**
```
On Connection:
  ↓
Generate unique clientId
  clientId = `user_${randomString()}`
  ↓
Store WebSocket
  clients.set(clientId, ws)
  ↓
Send welcome message
  ws.send(JSON.stringify({
    type: "connected",
    data: { clientId, listenerCount: clients.size }
  }))
  ↓
Broadcast listener count update
  broadcast({
    type: "listenerCount",
    data: { count: clients.size }
  })
  ↓
Start heartbeat for this client
  startHeartbeat(ws)
  ↓
Listen for messages
  ws.on("message", (data) => handleMessage(ws, data))
  ↓
Handle disconnection
  ws.on("close", () => handleDisconnect(clientId))

---

On Message Received:
  ↓
Parse JSON
  try {
    message = JSON.parse(data)
  } catch {
    send error
  }
  ↓
Route by type
  switch (message.type) {
    case "join":
      handleJoin(ws, message.data)
      break
    case "ping":
      handlePing(ws)
      break
    default:
      send error: "Unknown message type"
  }

---

On Disconnection:
  ↓
Remove from clients map
  clients.delete(clientId)
  ↓
Clear heartbeat
  clearInterval(heartbeat)
  ↓
Broadcast updated count
  broadcast({
    type: "listenerCount",
    data: { count: clients.size }
  })
  ↓
Log
  logger.info(`Client disconnected: ${clientId}`)
```

**Broadcasting:**
```
broadcast(message)
  ↓
Serialize message
  json = JSON.stringify(message)
  ↓
Iterate all clients
  for (const [id, ws] of clients.entries()) {
    ↓
    Check connection state
    if (ws.readyState === WebSocket.OPEN) {
      ↓
      Send message
      ws.send(json)
    } else {
      ↓
      Mark for removal
      deadClients.push(id)
    }
  }
  ↓
Cleanup dead connections
  deadClients.forEach(id => clients.delete(id))
  ↓
Log
  logger.info(`Broadcast to ${clients.size} listeners`)

---

sendToClient(clientId, message)
  ↓
Get client WebSocket
  ws = clients.get(clientId)
  ↓
Check exists and open
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  } else {
    logger.warn(`Client ${clientId} not reachable`)
  }
```

**Heartbeat (Keep-Alive):**
```
Start Heartbeat Interval (every 30 seconds):
  setInterval(() => {
    for (const [id, ws] of clients.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping() // Built-in WebSocket ping
      } else {
        clients.delete(id)
      }
    }
  }, 30000)

Client responds with pong automatically (browser WebSocket API handles this)
```

**Event Types Sent to Clients:**
```
{
  type: "newNote",
  data: {
    noteId, tokenId, audioUrl, duration,
    moodColor, waveform, sector, broadcaster, timestamp
  }
}

{
  type: "echoAdded",
  data: {
    echoId, echoTokenId, parentNoteId,
    parentTokenId, audioUrl, duration, broadcaster
  }
}

{
  type: "listenerCount",
  data: { count: number }
}

{
  type: "noteExpired",
  data: { tokenId, noteId }
}

{
  type: "tipReceived",
  data: {
    tokenId, amount, newTotal, tipper
  }
}

{
  type: "noteReleased",
  data: { /* full note object for time-locked note */ }
}

{
  type: "error",
  data: { code: string, message: string }
}
```

**Error Handling:**
```
try {
  ws.send(message)
} catch (error) {
  logger.error(`Failed to send to ${clientId}: ${error.message}`)
  clients.delete(clientId)
}
```

---

### **4.6 Scheduler Service**

**Purpose:** Handle time-based operations (deletions, time-locks, cleanup)

**Responsibilities:**
```
Scheduler
├── 24-Hour Deletion
│   ├── Schedule deletion timer
│   ├── Delete audio file
│   ├── Unpin from IPFS
│   ├── Mark NFT as expired
│   └── Broadcast expiration event
│
├── Time-Locked Notes
│   ├── Store scheduled notes
│   ├── Release at specified time
│   ├── Add to active queue
│   └── Broadcast release event
│
├── Cleanup Tasks
│   ├── Remove orphaned files
│   ├── Clear expired cache
│   ├── Prune old logs
│   └── Run maintenance tasks
│
├── Timer Persistence
│   ├── Save timer info to disk
│   ├── Restore on server restart
│   ├── Resume pending timers
│   └── Handle edge cases
│
└── Monitoring
    ├── Track active timers
    ├── Log all operations
    ├── Alert on failures
    └── Generate reports
```

**Internal Structure:**
```
Scheduler {
  private deletionTimers: Map<noteId, NodeJS.Timeout> = new Map()
  private timeLockQueue: Map<timestamp, Note[]> = new Map()
  private persistenceFile = "timers.json"
  
  DeletionInfo {
    noteId: string
    tokenId: number
    audioIPFS: string
    metadataIPFS: string
    expiresAt: number
  }
}
```

**Scheduling Deletion:**
```
scheduleDeletion(noteId, tokenId, audioIPFS, metadataIPFS)
  ↓
Calculate delay
  expiresAt = Date.now() + (24 * 60 * 60 * 1000)
  delay = expiresAt - Date.now()
  ↓
Create timer
  timer = setTimeout(async () => {
    ↓
    Delete audio file
    await fs.unlink(`/uploads/notes/${noteId}.mp3`)
    ↓
    Unpin from IPFS
    await ipfsUploader.unpin(audioIPFS)
    await ipfsUploader.unpin(metadataIPFS)
    ↓
    Mark NFT expired on blockchain
    await blockchainService.markExpired(tokenId)
    ↓
    Remove from queue
    queueManager.removeNote(noteId)
    ↓
    Broadcast expiration
    wsManager.broadcast({
      type: "noteExpired",
      data: { tokenId, noteId }
    })
    ↓
    Remove timer reference
    deletionTimers.delete(noteId)
    ↓
    Log
    logger.info(`Note ${noteId} deleted and expired`)
    
  }, delay)
  ↓
Store timer reference
  deletionTimers.set(noteId, timer)
  ↓
Persist timer info
  await savePersistence({
    noteId,
    tokenId,
    audioIPFS,
    metadataIPFS,
    expiresAt
  })
  ↓
Log
  logger.info(`Scheduled deletion for ${noteId} in ${delay}ms`)
```

**Time-Lock Handling:**
```
scheduleTimeLock(note, releaseTimestamp)
  ↓
Calculate delay
delay = releaseTimestamp - Date.now()
  ↓
Create timer
  timer = setTimeout(() => {
    ↓
    Add to active queue
    queueManager.addNote(note)
    ↓
    Broadcast release
    wsManager.broadcast({
      type: "noteReleased",
      data: note
    })
    ↓
    Log
    logger.info(`Time-locked note ${note.noteId} released`)
    
  }, delay)
  ↓
Store in time-lock queue
  if (!timeLockQueue.has(releaseTimestamp)) {
    timeLockQueue.set(releaseTimestamp, [])
  }
  timeLockQueue.get(releaseTimestamp).push(note)
```

**Persistence (Survive Server Restarts):**
```
savePersistence(info)
  ↓
Load existing data
  let data = []
  if (fs.existsSync(persistenceFile)) {
    data = JSON.parse(fs.readFileSync(persistenceFile))
  }
  ↓
Add new entry
  data.push(info)
  ↓
Write to file
  fs.writeFileSync(persistenceFile, JSON.stringify(data, null, 2))

---

loadPersistence() // On server start
  ↓
Check file exists
  if (!fs.existsSync(persistenceFile)) return
  ↓
Read file
  data = JSON.parse(fs.readFileSync(persistenceFile))
  ↓
Filter still pending
  now = Date.now()
  pending = data.filter(item => item.expiresAt > now)
  ↓
Reschedule each
  for (const item of pending) {
    delay = item.expiresAt - now
    scheduleDeletion(item.noteId, item.tokenId, item.audioIPFS, item.metadataIPFS)
    logger.info(`Restored deletion timer for ${item.noteId}`)
  }
  ↓
Clean up expired entries
  fs.writeFileSync(persistenceFile, JSON.stringify(pending, null, 2))
```

**Cleanup Tasks (Run Daily):**
```
runDailyCleanup()
  setInterval(async () => {
    ↓
    Find orphaned files
    (files in /uploads but not in queue)
    ↓
    Delete orphaned files
    for (const file of orphanedFiles) {
      await fs.unlink(file)
      logger.info(`Deleted orphaned file: ${file}`)
    }
    ↓
    Clear expired cache entries
    memoryCache.cleanup()
    ↓
    Prune old logs (keep last 7 days)
    ↓
    Log cleanup stats
    logger.info(`Cleanup complete: ${orphanedFiles.length} files removed`)
    
  }, 24 * 60 * 60 * 1000) // Every 24 hours
```

**Events Emitted:**
- `deletionScheduled` → Timer created
- `noteDeleted` → File deleted
- `noteReleased` → Time-lock released
- `cleanupComplete` → Daily cleanup done

---

### **4.7 SentimentAnalyzer Service (Optional)**

**Purpose:** Analyze audio sentiment and map to mood colors

**Responsibilities:**
```
SentimentAnalyzer
├── Audio Transcription
│   ├── Send audio to Whisper API
│   ├── Receive transcript text
│   ├── Handle API errors
│   └── Cache results
│
├── Sentiment Analysis
│   ├── Analyze transcript text
│   ├── Calculate sentiment score
│   ├── Detect emotion keywords
│   └── Determine confidence level
│
├── Mood Mapping
│   ├── Map score to color
│   ├── Apply color palette
│   ├── Return hex color
│   └── Provide fallback colors
│
└── Caching
    ├── Cache transcriptions
    ├── Avoid re-analyzing
    ├── TTL: 7 days
    └── Clear old cache
```

**Analysis Flow:**
```
analyze(audioFilePath)
  ↓
Check cache
  cached = memoryCache.get(`sentiment:${noteId}`)
  if (cached) return cached
  ↓
Transcribe Audio
  transcript = await transcribeAudio(audioFilePath)
  ↓
Analyze Sentiment
  score = calculateSentiment(transcript)
  ↓
Map to Color
  moodColor = scoreToColor(score)
  ↓
Cache result
  memoryCache.set(`sentiment:${noteId}`, {
    transcript,
    score,
    moodColor
  }, 604800) // 7 days
  ↓
Return
  {
    transcript: string,
    score: number, // -1 to 1
    moodColor: string // hex
  }
```

**Transcription (Whisper API):**
```
transcribeAudio(filePath)
  ↓
Read file
  audioBuffer = fs.readFileSync(filePath)
  ↓
Call OpenAI API
  response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "multipart/form-data"
    },
    body: {
      file: audioBuffer,
      model: "whisper-1",
      language: "en"
    }
  })
  ↓
Parse response
  data = await response.json()
  transcript = data.text
  ↓
Return transcript
```

**Sentiment Calculation:**
```
calculateSentiment(text)
  ↓
Use sentiment library
  import Sentiment from 'sentiment'
  sentiment = new Sentiment()
  ↓
Analyze text
  result = sentiment.analyze(text)
  ↓
Get score
  score = result.score
  comparative = result.comparative
  ↓
Normalize to -1 to 1
  normalizedScore = Math.max(-1, Math.min(1, comparative))
  ↓
Return normalizedScore
```

**Color Mapping:**
```
scoreToColor(score)
  ↓
Map ranges:
  if (score < -0.3) return "#7C3AED" // Purple (sad)
  if (score >= -0.3 && score <= 0.3) return "#0EA5E9" // Blue (calm)
  if (score > 0.3) return "#F59E0B" // Orange (excited)
```

**Error Handling:**
```
If Whisper API fails:
  - Log error
  - Return default: { score: 0, moodColor: "#0EA5E9" }
  - Don't fail the upload

If sentiment analysis fails:
  - Return default mood
  - Log warning
  - Continue processing
```

---

## **5. DATA FLOW & PROCESSING**

### **5.1 Complete Upload Data Flow**

```
AUDIO FILE (Frontend)
         ↓
[Binary Data, ~2MB]
         ↓
HTTP POST /api/upload
         ↓
┌────────────────────────┐
│ MIDDLEWARE VALIDATION  │
│ - Check file type      │
│ - Check file size      │
│ - Rate limit check     │
└────────┬───────────────┘
         ↓
[Validated File]
         ↓
┌────────────────────────┐
│ SAVE TEMPORARY FILE    │
│ /uploads/temp/uuid.webm│
└────────┬───────────────┘
         ↓
[File Path]
         ↓
┌────────────────────────┐
│ AUDIO PROCESSOR        │
│ Input: .webm file      │
│ Output: .mp3 + metadata│
└────────┬───────────────┘
         ↓
[Processed Audio + Waveform]
         ↓
        ┌┴┐
        │ ├──────────────────────┐
        │ │                      │
        │ ▼                      ▼
┌───────────────┐        ┌────────────────┐
│ IPFS UPLOADER │        │ SENTIMENT (opt)│
│ Audio → CID1  │        │ Text → Score   │
│ Metadata → CID2│        │ Score → Color  │
└───────┬───────┘        └────────┬───────┘
        │                         │
        └───────────┬─────────────┘
                    ↓
        [IPFS Hashes + Mood Color]
                    ↓
┌────────────────────────────────┐
│ BLOCKCHAIN SERVICE             │
│ Mint NFT with metadata         │
└────────────┬───────────────────┘
             ↓
    [Token ID + TX Hash]
             ↓
┌────────────────────────────────┐
│ QUEUE MANAGER                  │
│ Create note object             │
│ Add to active queue            │
└────────────┬───────────────────┘
             ↓
    [Note in Queue]
             ↓
        ┌───┴───┐
        │       │
        ▼       ▼
┌──────────┐  ┌──────────────┐
│SCHEDULER │  │ WEBSOCKET    │
│24hr timer│  │ Broadcast    │
└──────────┘  └──────────────┘
        │             │
        │             ↓
        │     [All Clients Receive]
        │
        ↓ (after 24 hours)
┌────────────────────────────────┐
│ CLEANUP                        │
│ - Delete MP3 file              │
│ - Unpin from IPFS              │
│ - Mark NFT expired             │
│ - Remove from queue            │
│ - Broadcast expiration         │
└────────────────────────────────┘
```

### **5.2 Data Transformations**

**Audio File Journey:**
```
Original File:
  Format: webm (browser MediaRecorder output)
  Size: 2.3 MB
  Duration: 45s
  Bitrate: Variable
  Channels: Stereo
  Sample Rate: 48000 Hz

     ↓ [FFmpeg Conversion]

Converted File:
  Format: MP3
  Size: 0.7 MB (compressed)
  Duration: 45s
  Bitrate: 128 kbps (constant)
  Channels: Mono
  Sample Rate: 44100 Hz

     ↓ [FFmpeg Normalization]

Normalized File:
  Format: MP3
  Size: 0.7 MB
  Duration: 45s
  Bitrate: 128 kbps
  Channels: Mono
  Sample Rate: 44100 Hz
  Loudness: Normalized to -14 LUFS

     ↓ [Waveform Generation]

Waveform Data:
  Type: Array<number>
  Length: 100 points
  Values: 0.0 to 1.0 (normalized amplitude)
  Example: [0.1, 0.3, 0.5, 0.7, 0.9, ...]

     ↓ [IPFS Upload]

IPFS Reference:
  Audio CID: QmAbc123...
  Gateway URL: https://gateway.pinata.cloud/ipfs/QmAbc123...
  Size: 0.7 MB
  Pin Status: Pinned

     ↓ [Metadata Creation]

NFT Metadata:
  Format: JSON
  Size: ~2 KB
  Content: {name, description, audio, attributes, properties}
  Metadata CID: QmDef456...

     ↓ [Blockchain Mint]

On-Chain NFT:
  Token ID: 4523
  Contract: VoiceNoteNFT (0xAbc...)
  Owner: Broadcaster address
  Metadata URI: ipfs://QmDef456...
  Blockchain: Mantle Network
  Block: 12345678

     ↓ [Queue Addition]

In-Memory Note Object:
  Type: JavaScript Object
  Size: ~1 KB in memory
  Fields: noteId, tokenId, audioUrl, duration, etc.
  Location: QueueManager.noteQueue[]
  Cached: memoryCache with 24hr TTL
```

---

## **6. WEBSOCKET ARCHITECTURE**

### **6.1 WebSocket Server Setup**

```
Server Initialization (on Bun boot):

import { Server } from 'socket.io'

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
})

io.on('connection', (socket) => {
  handleConnection(socket)
})

function handleConnection(socket) {
  const clientId = generateClientId()
  
  // Add to active clients
  activeClients.set(clientId, socket)
  
  // Send welcome
  socket.emit('connected', {
    clientId,
    listenerCount: activeClients.size
  })
  
  // Broadcast updated count
  io.emit('listenerCount', {
    count: activeClients.size
  })
  
  // Handle events
  socket.on('join', (data) => handleJoin(socket, data))
  socket.on('ping', () => handlePing(socket))
  
  // Handle disconnect
  socket.on('disconnect', () => {
    activeClients.delete(clientId)
    io.emit('listenerCount', {
      count: activeClients.size
    })
  })
}
```

### **6.2 Event Flow**

```
When Upload Completes:
  QueueManager emits "noteAdded"
        ↓
  WebSocketManager listens
        ↓
  Prepare broadcast message:
    {
      type: "newNote",
      data: {noteId, tokenId, audioUrl, ...}
    }
        ↓
  io.emit("newNote", data)
        ↓
  All connected clients receive event
        ↓
  Clients update UI (add to queue)

---

When Tip Received:
  BlockchainService detects "TipSent" event
        ↓
  QueueManager updates tip amount
        ↓
  Emits "tipUpdated"
        ↓
  WebSocketManager listens
        ↓
  io.emit("tipReceived", {
    tokenId,
    amount,
    newTotal,
    tipper
  })
        ↓
  All clients see updated tip amount

---

When Note Expires:
  Scheduler timeout triggers
        ↓
  Deletes file, marks expired
        ↓
  QueueManager removes note
        ↓
  Emits "noteRemoved"
        ↓
  WebSocketManager listens
        ↓
  io.emit("noteExpired", {
    tokenId,
    noteId
  })
        ↓
  Clients remove from queue, show as ghost
```

### **6.3 Connection Management**

```
Heartbeat System:

Client automatically sends ping every 25s
        ↓
Server responds with pong
        ↓
If no pong received in 60s:
        ↓
Client connection marked as dead
        ↓
Server removes from activeClients
        ↓
Updates listener count

---

Reconnection:

Client disconnects (network issue)
        ↓
Socket.io automatically attempts reconnect
        ↓
Exponential backoff: 1s, 2s, 4s, 8s...
        ↓
Max attempts: 5
        ↓
If successful:
  - Re-emit "join"
  - Fetch current stream
  - Resume listening
        ↓
If all attempts fail:
  - Show "Connection lost" banner
  - User can manually refresh
```

---

## **7. BLOCKCHAIN INTEGRATION**

### **7.1 Smart Contract Connection**

```
On Server Start:

1. Load Environment Variables
   - RPC_URL
   - PRIVATE_KEY (platform wallet)
   - CONTRACT_ADDRESSES

2. Initialize Provider
   provider = new ethers.JsonRpcProvider(RPC_URL)

3. Create Wallet Instance
   wallet = new ethers.Wallet(PRIVATE_KEY, provider)

4. Load Contract ABIs
   voiceNoteNFTABI = JSON.parse(fs.readFileSync('./abis/VoiceNoteNFT.json'))
   tippingPoolABI = JSON.parse(fs.readFileSync('./abis/TippingPool.json'))
   echoRegistryABI = JSON.parse(fs.readFileSync('./abis/EchoRegistry.json'))

5. Create Contract Instances
   voiceNoteNFT = new ethers.Contract(
     VOICE_NOTE_NFT_ADDRESS,
     voiceNoteNFTABI,
     wallet
   )
   
   tippingPool = new ethers.Contract(
     TIPPING_POOL_ADDRESS,
     tippingPoolABI,
     wallet
   )
   
   echoRegistry = new ethers.Contract(
     ECHO_REGISTRY_ADDRESS,
     echoRegistryABI,
     wallet
   )

6. Start Event Listeners
   setupEventListeners()

7. Verify Connection
   blockNumber = await provider.getBlockNumber()
   logger.info(`Connected to Mantle at block ${blockNumber}`)
```

### **7.2 Transaction Management**

```
Nonce Management:

Global nonce tracker:
  currentNonce = await wallet.getTransactionCount('pending')

Before each transaction:
  nonce = currentNonce++

If transaction fails:
  currentNonce-- // Rollback
  
Periodically sync:
  setInterval(async () => {
    currentNonce = await wallet.getTransactionCount('pending')
  }, 60000) // Every minute

---

Gas Management:

For each transaction:
  1. Estimate Gas
     gasEstimate = await contract.estimateGas.functionName(...)
  
  2. Add Buffer (20%)
     gasLimit = Math.floor(gasEstimate * 1.2)
  
  3. Get Current Gas Price
     gasPrice = await provider.getGasPrice()
     // Or use fixed price on Mantle (usually stable)
  
  4. Include in Transaction
     tx = await contract.functionName(..., {
       gasLimit,
       gasPrice,
       nonce
     })

---

Retry Logic:

async function mintWithRetry(params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await blockchainService.mintVoiceNote(params)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      if (error.code === 'NONCE_EXPIRED') {
        // Sync nonce and retry
        await syncNonce()
        continue
      }
      
      if (error.code === 'REPLACEMENT_UNDERPRICED') {
        // Increase gas price and retry
        params.gasPrice = params.gasPrice * 1.1
        continue
      }
      
      // Wait before retry
      await sleep(1000 * (i + 1))
    }
  }
}
```

### **7.3 Event Listening Strategy**

```
Event Listener Setup:

voiceNoteNFT.on("VoiceNoteMinted", async (tokenId, broadcaster, ipfsHash, timestamp, event) => {
  logger.info(`NFT Minted: Token ${tokenId} by ${broadcaster}`)
  
  // Usually handled in upload flow, but catch external mints
  const note = await buildNoteFromEvent(event)
  if (note) {
    queueManager.addNote(note)
  }
})

tippingPool.on("TipSent", async (tokenId, tipper, broadcaster, amount, platformFee, event) => {
  logger.info(`Tip Received: ${ethers.formatEther(amount)} MNT to Token ${tokenId}`)
  
  const amountMNT = parseFloat(ethers.formatEther(amount))
  
  // Update queue
  queueManager.updateTipAmount(tokenId.toNumber(), amountMNT)
  
  // Broadcast to clients
  wsManager.broadcast({
    type: "tipReceived",
    data: {
      tokenId: tokenId.toNumber(),
      amount: amountMNT.toString(),
      newTotal: queueManager.getNote(tokenId).tips.toString(),
      tipper
    }
  })
})

echoRegistry.on("EchoRegistered", async (parentTokenId, echoTokenId, echoBroadcaster, timestamp, event) => {
  logger.info(`Echo Registered: Token ${echoTokenId} → Parent ${parentTokenId}`)
  
  // Update parent note
  queueManager.addEcho(parentTokenId.toNumber(), echoTokenId.toNumber())
  
  // Broadcast
  wsManager.broadcast({
    type: "echoAdded",
    data: {
      parentTokenId: parentTokenId.toNumber(),
      echoTokenId: echoTokenId.toNumber(),
      echoBroadcaster
    }
  })
})

voiceNoteNFT.on("VoiceNoteExpired", async (tokenId, expiredAt, event) => {
  logger.info(`NFT Expired: Token ${tokenId}`)
  
  // Usually handled by scheduler, but log if external
})

---

Error Handling for Event Listeners:

Each listener wrapped in try-catch:

voiceNoteNFT.on("event", async (...args) => {
  try {
    // Handle event
  } catch (error) {
    logger.error(`Event handler error: ${error.message}`)
    // Don't crash server
  }
})

---

Reconnection for Event Listeners:

provider.on("error", (error) => {
  logger.error(`Provider error: ${error.message}`)
  reconnectProvider()
})

async function reconnectProvider() {
  try {
    // Create new provider
    provider = new ethers.JsonRpcProvider(RPC_URL)
    wallet = new ethers.Wallet(PRIVATE_KEY, provider)
    
    // Recreate contracts
    voiceNoteNFT = new ethers.Contract(...)
    
    // Restart listeners
    setupEventListeners()
    
    logger.info("Provider reconnected successfully")
  } catch (error) {
    logger.error("Reconnection failed, retrying in 10s...")
    setTimeout(reconnectProvider, 10000)
  }
}
```

---

## **8. STORAGE ARCHITECTURE**

### **8.1 File System Organization**

```
/var/www/midnight-radio-backend/
├── uploads/
│   ├── temp/                    # Temporary uploads
│   │   ├── uuid-1.webm          # Original upload
│   │   ├── uuid-1_conv.mp3      # Converted file
│   │   └── (auto-deleted)
│   │
│   ├── notes/                   # Processed voice notes
│   │   ├── uuid-1.mp3           # Final audio files
│   │   ├── uuid-2.mp3
│   │   └── (deleted after 24h)
│   │
│   └── echoes/                  # Echo audio files
│       ├── echo-uuid-1.mp3
│       ├── echo-uuid-2.mp3
│       └── (deleted after parent expires)
│
├── logs/
│   ├── error.log
│   ├── combined.log
│   └── access.log
│
├── persistence/
│   ├── timers.json              # Scheduled deletions
│   └── config.json              # Server config
│
└── cache/
    └── (in-memory only, no files)
```

### **8.2 In-Memory Storage**

```
Memory Layout:

RAM Usage Breakdown:
├── Node Process: ~50MB base
├── Bun Runtime: ~30MB
├── Queue Manager Data: ~10MB
│   ├── Note Queue (100 notes × ~10KB): ~1MB
│   ├── Echo Map: ~2MB
│   └── Statistics: ~100KB
├── WebSocket Connections (1000 × ~5KB): ~5MB
├── Cache (memoryCache): ~20MB
│   ├── Note cache
│   ├── Sentiment cache
│   └── Temporary data
└── Other (buffers, strings, etc.): ~34MB

Total: ~150MB average
Peak: ~300MB (during heavy load)

---

Cache TTLs:

memoryCache.set(key, value, ttl)

Note Queue: 24 hours (86400s)
Sentiment Results: 7 days (604800s)
API Responses: 5 minutes (300s)
Temporary Data: 1 hour (3600s)

---

Cache Eviction:

Automatic cleanup every minute:
setInterval(() => {
  memoryCache.cleanup() // Removes expired entries
}, 60000)

Manual cleanup on low memory:
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    memoryCache.clear()
    logger.warn("Memory cleared due to warning")
  }
})
```

### **8.3 IPFS Storage Strategy**

```
Upload Strategy:

1. Upload Audio
   - Pin immediately
   - Keep pinned for 24 hours
   - After 24h: Unpin
   - File remains accessible via gateway cache (temporary)

2. Upload Metadata
   - Pin permanently
   - Never unpin
   - Needed for NFT forever

---

Pinning Management:

Track pinned files:
  pinnedFiles = new Map<noteId, {audioHash, metadataHash, pinnedAt}>()

Schedule unpinning:
  setTimeout(async () => {
    await ipfsUploader.unpin(audioHash)
    pinnedFiles.delete(noteId)
  }, 24 * 60 * 60 * 1000)

---

Cost Management:

Pinata Free Tier: 1GB storage
Average audio file: 0.7MB
Average metadata: 2KB

Max files per GB: ~1400 audio files
With 24h rotation: ~1400 concurrent files
Daily uploads supported: ~1400

If exceeding:
  - Upgrade to Pinata Pro ($20/month for 100GB)
  - Or implement own IPFS node
```

---

## **9. SCHEDULING & BACKGROUND JOBS**

### **9.1 Job Types**

```
Job Categories:

1. Time-Critical Jobs (Exact timing)
   ├── 24-hour note deletion
   ├── Time-locked note release
   └── NFT expiration marking

2. Periodic Jobs (Recurring)
   ├── Queue cleanup (every 10 min)
   ├── Daily file cleanup (every 24h)
   ├── Listener count broadcast (every 5s)
   └── Metrics collection (every 1 min)

3. On-Demand Jobs (Event-driven)
   ├── Audio processing
   ├── IPFS upload
   ├── NFT minting
   └── WebSocket broadcasting
```

### **9.2 Job Scheduler Implementation**

```
Scheduler Architecture:

┌──────────────────────────┐
│   Scheduler Service      │
├──────────────────────────┤
│                          │
│  deletionTimers: Map     │  ← setTimeout references
│  timeLockQueue: Map      │  ← Scheduled releases
│  periodicJobs: Map       │  ← setInterval references
│                          │
└──────────────────────────┘

---

Deletion Timer:

scheduleDeletion(noteId, expiresAt) {
  const delay = expiresAt - Date.now()
  
  const timer = setTimeout(async () => {
    await executeDelete(noteId)
  }, delay)
  
  deletionTimers.set(noteId, timer)
  
  // Persist for server restarts
  await savePersistence({noteId, expiresAt})
}

executeDelete(noteId) {
  // 1. Delete local file
  await fs.unlink(`/uploads/notes/${noteId}.mp3`)
  
  // 2. Unpin from IPFS
  await ipfsUploader.unpin(audioHash)
  
  // 3. Mark NFT expired
  await blockchainService.markExpired(tokenId)
  
  // 4. Remove from queue
  queueManager.removeNote(noteId)
  
  // 5. Broadcast
  wsManager.broadcast({type: "noteExpired", data: {noteId}})
  
  // 6. Cleanup timer
  deletionTimers.delete(noteId)
}

---

Periodic Jobs:

startPeriodicJobs() {
  // Queue cleanup every 10 minutes
  setInterval(() => {
    queueManager.cleanup()
  }, 10 * 60 * 1000)
  
  // Daily file cleanup
  setInterval(() => {
    runDailyCleanup()
  }, 24 * 60 * 60 * 1000)
  
  // Listener count broadcast every 5 seconds
  setInterval(() => {
    const count = wsManager.getClientCount()
    wsManager.broadcast({
      type: "listenerCount",
      data: {count}
    })
  }, 5000)
  
  // Metrics collection every minute
  setInterval(() => {
    collectMetrics()
  }, 60 * 1000)
}

---

Persistence:

On server shutdown:
  1. Save all pending timers to disk
  2. Store: {noteId, expiresAt, tokenId, ipfsHashes}
  3. Write to JSON file

On server startup:
  1. Read pending timers from disk
  2. Filter still valid (expiresAt > now)
  3. Reschedule each with remaining delay
  4. Clean up expired entries
```

### **9.3 Background Worker Pattern**

```
Worker Queue System:

For CPU-intensive tasks (audio processing):

import { Worker } from 'worker_threads'

const audioWorkerPool = []
const maxWorkers = 4

function processAudioAsync(filePath) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./workers/audioProcessor.js', {
      workerData: { filePath }
    })
    
    worker.on('message', (result) => {
      resolve(result)
      worker.terminate()
    })
    
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with code ${code}`))
      }
    })
  })
}

---

Job Queue (for async tasks):

Using in-memory queue:

const jobQueue = []
let processing = false

async function enqueueJob(job) {
  jobQueue.push(job)
  if (!processing) {
    processQueue()
  }
}

async function processQueue() {
  processing = true
  
  while (jobQueue.length > 0) {
    const job = jobQueue.shift()
    try {
      await executeJob(job)
    } catch (error) {
      logger.error(`Job failed: ${error.message}`)
      // Optionally retry or move to dead letter queue
    }
  }
  
  processing = false
}

---

For production with many jobs:
Consider using BullMQ (Redis-based queue):

import { Queue, Worker } from 'bullmq'

const uploadQueue = new Queue('uploads', {
  connection: redisConnection
})

// Add job
await uploadQueue.add('process-audio', {
  filePath: '/uploads/temp/uuid.webm',
  noteId: 'uuid-123'
})

// Process jobs
const worker = new Worker('uploads', async (job) => {
  const { filePath, noteId } = job.data
  return await audioProcessor.process(filePath)
}, {
  connection: redisConnection
})
```

---

## **10. ERROR
HANDLING STRATEGY**

### **10.1 Error Classification**

```
Error Categories:

1. Client Errors (4xx)
   ├── 400 Bad Request
   │   ├── Invalid file type
   │   ├── File too large
   │   ├── Invalid duration
   │   └── Missing parameters
   │
   ├── 401 Unauthorized
   │   ├── Invalid JWT token
   │   ├── Expired token
   │   └── Missing auth header
   │
   ├── 404 Not Found
   │   ├── Note not found
   │   ├── Audio file deleted
   │   └── Invalid endpoint
   │
   ├── 413 Payload Too Large
   │   └── File exceeds 10MB
   │
   └── 429 Too Many Requests
       └── Rate limit exceeded

2. Server Errors (5xx)
   ├── 500 Internal Server Error
   │   ├── Unhandled exceptions
   │   ├── Database errors
   │   └── Unknown failures
   │
   ├── 502 Bad Gateway
   │   ├── IPFS service down
   │   ├── Blockchain RPC down
   │   └── External API failures
   │
   └── 503 Service Unavailable
       ├── Server overloaded
       ├── Maintenance mode
       └── Resource exhaustion

3. Blockchain Errors
   ├── Transaction Failures
   │   ├── Insufficient gas
   │   ├── Nonce too low
   │   ├── Contract revert
   │   └── Network congestion
   │
   └── Connection Issues
       ├── RPC timeout
       ├── Network unavailable
       └── Provider error

4. External Service Errors
   ├── IPFS Errors
   │   ├── Upload timeout
   │   ├── Pin failure
   │   └── Gateway unavailable
   │
   ├── AI Service Errors
   │   ├── Whisper API timeout
   │   ├── Rate limit hit
   │   └── Invalid response
   │
   └── WebSocket Errors
       ├── Connection lost
       ├── Send failure
       └── Parse error
```

### **10.2 Error Handling Flow**

```
Request Error Handling:

try {
  // Main operation
  const result = await uploadService.process(file)
  
  res.status(200).json({
    success: true,
    data: result
  })
  
} catch (error) {
  handleError(error, req, res)
}

---

Error Handler Function:

function handleError(error, req, res) {
  // Log error with context
  logger.error({
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  })
  
  // Classify error
  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: error.message,
      details: error.details
    })
  }
  
  if (error instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: "Not found",
      message: error.message
    })
  }
  
  if (error instanceof RateLimitError) {
    return res.status(429).json({
      success: false,
      error: "Rate limit exceeded",
      message: "Too many requests, please try again later",
      retryAfter: error.retryAfter
    })
  }
  
  if (error instanceof BlockchainError) {
    return res.status(502).json({
      success: false,
      error: "Blockchain error",
      message: "Transaction failed, please try again",
      details: error.reason
    })
  }
  
  if (error instanceof IPFSError) {
    return res.status(502).json({
      success: false,
      error: "Storage error",
      message: "Failed to upload to IPFS, please try again"
    })
  }
  
  // Unknown error
  return res.status(500).json({
    success: false,
    error: "Internal server error",
    message: "An unexpected error occurred",
    requestId: generateRequestId()
  })
}
```

### **10.3 Retry Strategies**

```
Exponential Backoff:

async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      const delay = baseDelay * Math.pow(2, i)
      logger.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms`)
      await sleep(delay)
    }
  }
}

// Usage
const result = await retryWithBackoff(
  () => ipfsUploader.upload(file),
  3,
  1000
)

---

Circuit Breaker Pattern:

class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold
    this.timeout = timeout
    this.failures = 0
    this.state = 'CLOSED' // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now()
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN')
      }
      this.state = 'HALF_OPEN'
    }
    
    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  onSuccess() {
    this.failures = 0
    this.state = 'CLOSED'
  }
  
  onFailure() {
    this.failures++
    if (this.failures >= this.threshold) {
      this.state = 'OPEN'
      this.nextAttempt = Date.now() + this.timeout
      logger.error('Circuit breaker opened')
    }
  }
}

// Usage
const ipfsCircuitBreaker = new CircuitBreaker(5, 60000)

await ipfsCircuitBreaker.execute(async () => {
  return await ipfsUploader.upload(file)
})

---

Graceful Degradation:

async function processUpload(file) {
  try {
    // Try with sentiment analysis
    const sentiment = await sentimentAnalyzer.analyze(file)
    return { ...result, sentiment }
  } catch (error) {
    logger.warn("Sentiment analysis failed, using default")
    // Degrade gracefully - use default mood
    return { ...result, moodColor: "#0EA5E9" }
  }
}
```

### **10.4 Error Recovery**

```
Service Recovery Strategies:

1. Blockchain Service Recovery:

if (blockchainError) {
  // 1. Check if transaction actually succeeded
  const receipt = await provider.getTransactionReceipt(txHash)
  if (receipt && receipt.status === 1) {
    // Transaction succeeded despite error
    return extractTokenId(receipt)
  }
  
  // 2. Retry with higher gas
  gasPrice = gasPrice * 1.5
  return retry()
  
  // 3. Use alternative RPC
  switchToBackupRPC()
  return retry()
  
  // 4. Queue for manual processing
  addToManualQueue(data)
  notifyAdmin("Blockchain transaction failed")
}

---

2. IPFS Service Recovery:

if (ipfsError) {
  // 1. Try alternative gateway
  switchGateway()
  return retry()
  
  // 2. Reduce file size
  if (error.code === 'FILE_TOO_LARGE') {
    const compressed = await compress(file)
    return upload(compressed)
  }
  
  // 3. Store locally temporarily
  await storeLocally(file)
  scheduleRetry(file, 5 * 60 * 1000) // 5 minutes
  
  return { status: 'pending', retryAt: Date.now() + 300000 }
}

---

3. Database/Cache Recovery:

if (cacheError) {
  // 1. Try to rebuild from source
  const data = await fetchFromSource(key)
  memoryCache.set(key, data)
  return data
  
  // 2. Use stale data if available
  const stale = memoryCache.getStale(key)
  if (stale) {
    logger.warn("Using stale cache data")
    return stale
  }
  
  // 3. Return error but don't crash
  logger.error("Cache miss and source unavailable")
  return null
}

---

4. WebSocket Recovery:

wsManager.on('error', async (error) => {
  logger.error(`WebSocket error: ${error.message}`)
  
  // 1. Try to reconnect
  await reconnectWebSocket()
  
  // 2. Notify affected clients
  affectedClients.forEach(client => {
    client.emit('reconnecting', {
      message: "Connection lost, reconnecting..."
    })
  })
  
  // 3. Restore state after reconnection
  await restoreClientState()
})
```

---

## **11. CACHING STRATEGY**

### **11.1 Multi-Level Caching**

```
Cache Hierarchy:

Level 1: Application Memory (Fastest)
  ↓
Level 2: Redis (if implemented)
  ↓
Level 3: File System
  ↓
Level 4: IPFS Gateway Cache
  ↓
Level 5: Source (Blockchain, Database)
```

### **11.2 Cache Implementation**

```
Memory Cache:

class MemoryCache {
  private cache = new Map<string, CacheItem>()
  
  set(key: string, value: any, ttl: number) {
    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + (ttl * 1000)
    })
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  getStale(key: string): any | null {
    const item = this.cache.get(key)
    return item ? item.data : null
  }
  
  invalidate(pattern: string) {
    for (const [key, _] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
  
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

---

Cache Keys Strategy:

note:{noteId}           → Note object (TTL: 24h)
note:queue              → Full queue (TTL: 24h)
sentiment:{noteId}      → Sentiment result (TTL: 7d)
nft:{tokenId}          → NFT metadata (TTL: 1h)
user:{address}:nfts    → User's NFTs (TTL: 5m)
leaderboard:tips:24h   → Top tipped (TTL: 5m)
leaderboard:echoes:24h → Most echoed (TTL: 5m)

---

Cache Invalidation:

On note added:
  memoryCache.invalidate('note:queue')
  memoryCache.invalidate('leaderboard')

On tip received:
  memoryCache.invalidate(`note:${noteId}`)
  memoryCache.invalidate('leaderboard:tips')

On echo added:
  memoryCache.invalidate(`note:${parentNoteId}`)
  memoryCache.invalidate('leaderboard:echoes')

On note expired:
  memoryCache.delete(`note:${noteId}`)
  memoryCache.invalidate('note:queue')
  memoryCache.invalidate(`user:${broadcaster}:nfts`)

---

Cache-Aside Pattern:

async function getNote(noteId: string): Promise<Note | null> {
  // 1. Check cache
  const cached = memoryCache.get(`note:${noteId}`)
  if (cached) {
    logger.debug(`Cache HIT: note:${noteId}`)
    return cached
  }
  
  logger.debug(`Cache MISS: note:${noteId}`)
  
  // 2. Fetch from source
  const note = queueManager.getNote(noteId)
  if (!note) return null
  
  // 3. Store in cache
  memoryCache.set(`note:${noteId}`, note, 86400) // 24h
  
  return note
}

---

Write-Through Pattern:

async function updateTipAmount(noteId: string, amount: number) {
  // 1. Update source
  queueManager.updateTipAmount(noteId, amount)
  
  // 2. Update cache immediately
  const note = queueManager.getNote(noteId)
  memoryCache.set(`note:${noteId}`, note, 86400)
  
  // 3. Invalidate related caches
  memoryCache.invalidate('leaderboard:tips')
}
```

---

## **12. SECURITY ARCHITECTURE**

### **12.1 Security Layers**

```
Defense in Depth:

Layer 1: Network (Nginx)
  ├── Rate limiting: 100 req/min per IP
  ├── DDoS protection via Cloudflare
  ├── SSL/TLS encryption
  └── IP whitelisting for admin routes

Layer 2: Application (Bun)
  ├── CORS validation
  ├── Request validation (Zod schemas)
  ├── File type verification
  ├── Size limits enforcement
  └── Input sanitization

Layer 3: Business Logic
  ├── Duration validation
  ├── Wallet signature verification
  ├── Ownership checks
  └── Authorization rules

Layer 4: Data
  ├── No sensitive data stored
  ├── Encrypted environment variables
  ├── Secure file permissions
  └── IPFS content addressing

Layer 5: Blockchain
  ├── Smart contract access control
  ├── Reentrancy guards
  ├── Input validation on-chain
  └── Gas limit protections
```

### **12.2 Input Validation**

```
File Upload Validation:

function validateAudioFile(file: File): ValidationResult {
  // 1. MIME type check
  const allowedTypes = ['audio/webm', 'audio/mpeg', 'audio/wav', 'audio/mp3']
  if (!allowedTypes.includes(file.mimetype)) {
    throw new ValidationError("Invalid file type")
  }
  
  // 2. File size check
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new ValidationError("File too large")
  }
  
  // 3. Magic number verification (actual file type)
  const buffer = fs.readFileSync(file.path, { start: 0, end: 12 })
  const signature = buffer.toString('hex')
  
  const audioSignatures = [
    '1a45dfa3', // webm
    'fffb',     // mp3
    'fff3',     // mp3
    '494433',   // mp3 with ID3
    '52494646'  // WAV (RIFF)
  ]
  
  if (!audioSignatures.some(sig => signature.startsWith(sig))) {
    throw new ValidationError("File is not valid audio")
  }
  
  // 4. Duration check (via ffprobe)
  const duration = await getDuration(file.path)
  if (duration < 30 || duration > 90) {
    throw new ValidationError("Duration must be 30-90 seconds")
  }
  
  return { valid: true }
}

---

Request Validation (Zod):

import { z } from 'zod'

const uploadSchema = z.object({
  audio: z.instanceof(File),
  walletAddress: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  scheduledFor: z.number().optional()
    .refine(val => !val || val > Date.now(), "Must be future timestamp")
})

function validateUpload(req: Request) {
  try {
    uploadSchema.parse(req.body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0].message)
    }
  }
}

---

SQL Injection Prevention:

// Not using SQL database, but if using:
// NEVER concatenate user input
// BAD: `SELECT * FROM notes WHERE id = '${noteId}'`
// GOOD: Use parameterized queries

---

XSS Prevention:

// Sanitize any user input that might be displayed
function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

// Use in metadata generation
metadata.description = sanitizeInput(userDescription)
```

### **12.3 Rate Limiting**

```
Rate Limit Implementation:

const rateLimiters = new Map<string, RateLimiter>()

function rateLimit(requestsPerMinute: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown'
    
    if (!rateLimiters.has(ip)) {
      rateLimiters.set(ip, {
        count: 0,
        resetAt: Date.now() + 60000
      })
    }
    
    const limiter = rateLimiters.get(ip)!
    
    // Reset if time elapsed
    if (Date.now() > limiter.resetAt) {
      limiter.count = 0
      limiter.resetAt = Date.now() + 60000
    }
    
    limiter.count++
    
    if (limiter.count > requestsPerMinute) {
      return res.status(429).json({
        error: "Too many requests",
        retryAfter: Math.ceil((limiter.resetAt - Date.now()) / 1000)
      })
    }
    
    next()
  }
}

// Apply to routes
app.post('/api/upload', rateLimit(10), uploadHandler)
app.get('/api/stream', rateLimit(60), streamHandler)
```

### **12.4 Environment Security**

```
Environment Variables:

# .env (NEVER commit to git)
NODE_ENV=production
PORT=3000
WS_PORT=3001

# Blockchain
RPC_URL=https://rpc.mantle.xyz
PRIVATE_KEY=0x... # Platform wallet private key
VOICE_NOTE_NFT_ADDRESS=0x...
TIPPING_POOL_ADDRESS=0x...
ECHO_REGISTRY_ADDRESS=0x...

# IPFS
PINATA_API_KEY=...
PINATA_SECRET_KEY=...

# AI (Optional)
OPENAI_API_KEY=sk-...

# Security
JWT_SECRET=... # Long random string
CORS_ORIGIN=https://midnightradio.xyz

# Monitoring
LOGTAIL_TOKEN=...

---

Loading Safely:

import dotenv from 'dotenv'
dotenv.config()

// Validate required variables
const requiredVars = [
  'RPC_URL',
  'PRIVATE_KEY',
  'PINATA_API_KEY',
  'PINATA_SECRET_KEY'
]

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(`Missing required env var: ${varName}`)
  }
}

// Never log sensitive values
logger.info("Environment loaded", {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  // DO NOT LOG: PRIVATE_KEY, API_KEYS
})
```

---

## **🎯 BACKEND SUMMARY**

This complete backend architecture covers:

✅ **System Architecture** - Complete component layout
✅ **Request Flows** - Detailed step-by-step flows for all operations
✅ **Service Layer** - 7 core services with full specifications
✅ **Data Processing** - Audio, blockchain, IPFS pipelines
✅ **WebSocket** - Real-time connection management
✅ **Blockchain** - Smart contract integration details
✅ **Storage** - File system, memory, IPFS strategies
✅ **Scheduling** - Background jobs and timers
✅ **Error Handling** - Comprehensive error strategies
✅ **Caching** - Multi-level caching implementation
✅ **Security** - Defense-in-depth approach

**Total Backend Components:**
- 1 HTTP Server (Bun)
- 1 WebSocket Server
- 7 Core Services
- 15+ Route Handlers
- 10+ Middleware Functions
- 3 Smart Contract Integrations
- Multiple Background Workers

**Estimated Performance:**
- 1000+ concurrent WebSocket connections
- 100+ uploads per hour
- <3 second average processing time
- 99.9% uptime capability
- ~150MB average memory usage

**Ready to implement! No code needed to understand complete backend flow.** 🚀