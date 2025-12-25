# 🚀 Deployment Guide

This guide covers deploying the **Backend to Render** and the **Frontend to Vercel**.

---

## 🏗️ 1. Backend Deployment (Render)

Render supports Bun natively. We will deploy the `backend` folder as a **Web Service**.

### Steps:
1.  **Push your code** to GitHub.
2.  Go to [dashboard.render.com](https://dashboard.render.com) -> **New** -> **Web Service**.
3.  Connect your GitHub repository `Midnight`.
4.  **Configuration**:
    | Setting | Value |
    |---------|-------|
    | **Name** | `midnight-backend` |
    | **Root Directory** | `backend` |
    | **Runtime** | `Bun` |
    | **Build Command** | `bun install` |
    | **Start Command** | `bun run start` |

5.  **Environment Variables** (from `backend/.env.example`):
    | Variable | Description |
    |----------|-------------|
    | `PORT` | `3001` (Render may auto-assign) |
    | `NODE_ENV` | `production` |
    | `FRONTEND_URL` | Your Vercel URL (add after frontend deploy) |
    | `PINATA_JWT` | Your Pinata JWT token |
    | `PINATA_GATEWAY` | `https://gateway.pinata.cloud` |
    | `RPC_URL` | `https://rpc.sepolia.mantle.xyz` |
    | `PRIVATE_KEY` | Your platform wallet private key |
    | `NFT_CONTRACT_ADDRESS` | `0x0b118a0F67D6F2329ad993A844549aED4cEa0E15` |
    | `TIPPING_CONTRACT_ADDRESS` | `0x3543243e2dD9027d8f7Ad53373f31d155ffc410F` |

### ✅ Success Check:
Once deployed, Render will give you a URL like `https://midnight-backend.onrender.com`.
*   Visit: `https://midnight-backend.onrender.com/health` -> Should return `{"status":"ok"}`.

---

## 🎨 2. Frontend Deployment (Vercel)

Vercel is perfect for Vite + React apps.

### Steps:
1.  Go to [vercel.com](https://vercel.com) -> **Add New** -> **Project**.
2.  Import your GitHub repository `Midnight`.
3.  **Project Configuration**:
    | Setting | Value |
    |---------|-------|
    | **Framework Preset** | Vite (Auto-detected) |
    | **Root Directory** | `frontend` |
    | **Build Command** | `npm run build` (or leave default) |
    | **Output Directory** | `dist` |

4.  **Environment Variables** (from `frontend/.env.example`):
    | Variable | Description |
    |----------|-------------|
    | `VITE_API_URL` | Your Render backend URL (e.g., `https://midnight-dyoq.onrender.com`) |
    | `VITE_WS_URL` | WebSocket URL (e.g., `wss://midnight-backend.onrender.com/ws`) |
    | `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Project ID |

### ⚠️ Important:
*   Deploy **Backend first** to get the Render URL.
*   Use `wss://` (not `ws://`) for WebSocket in production.
*   After frontend deploys, go back to Render and update `FRONTEND_URL` for CORS.

---

## 🔗 3. Smart Contracts
(No deployment action needed)

Your contracts are already deployed on **Mantle Sepolia** and **Arbitrum Sepolia**. The addresses are hardcoded in `frontend/src/lib/chains.ts`. You do not need to deploy the `contracts` folder to any server.

---

## 4. Final Verification
1.  Open your **Vercel URL**.
2.  Check the "Status" in the HUD. It should verify connection to the Backend.
3.  Connect Wallet -> Record -> Upload.
4.  If the upload works, your full stack is live! 🚀
