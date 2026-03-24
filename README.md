# 🎮 Sui Loot Box System: Verifiable Randomness & Pity Mechanism

A secure, verifiable, and visually stunning loot box game built on the Sui blockchain for the **Alkimi Hackathon**.

## 🚀 Overview

This project implements a decentralized "mystery box" system where players can purchase containers and receive randomly generated in-game items (NFTs) with varying rarity levels. It leverage's Sui’s native on-chain randomness to ensure absolute fairness and transparency.

### ✨ Key Features
- **Secure Randomness**: Uses `sui::random` (Native Beacon) for tamper-proof outcomes.
- **Bonus Pity System**: Guarantees a **Legendary** drop after 30 consecutive non-legendary opens—a premium feature for player retention.
- **NFT Rarity Tiers**: Unique attributes across Common, Rare, Epic, and Legendary tiers.
- **Premium Frontend**: High-fidelity React dashboard with Glassmorphism, real-time blockchain feedback, and cinematic reveal animations.
- **Admin Control**: Complete governance over pricing, rarity weights, and treasury management.

---

## 🛠️ Tech Stack
**Sui Move, React, Vite, TypeScript, Tailwind CSS v4, Framer Motion, @mysten/dapp-kit, @mysten/sui SDK, Lucide React**

---

## 🏗️ Project Structure
- `sources/`: Core Sui Move smart contract logic.
- `tests/`: Comprehensive test suite with 13 unit tests.
- `frontend/`: React-based dashboard for interacting with the contract.
- `README.md`: Project documentation and guides.

---

## 📖 Getting Started

### 1. Smart Contract (Move)
Navigate to the root directory and build the contract:
```powershell
# Build the package
sui move build

# Run unit tests
sui move test
```

#### Deployment to Testnet:
```powershell
sui client publish --gas-budget 200000000
```
*Note: After publishing, call `init_game` to set up the shared configuration.*

### 2. Frontend (React)
1. Navigate to the `frontend` folder: `cd frontend`
2. Install dependencies: `npm install`
3. Update `src/constants.ts` with your **Package ID** and **GameConfig ID**.
4. Start the dev server: `npm run dev`
5. Open `http://localhost:5173` in your browser.

---

## 🔐 Security & Methodology
- **Entry Function Protection**: The `open_loot_box` function is strictly an `entry` function to prevent external Move contracts from "gaming" the randomness beacon.
- **Dynamic Field Optimization**: Player-specific "pity counts" are stored as dynamic fields, ensuring a scalable and efficient data model on the Sui ledger.
- **Verifiable Fair Play**: Every random outcome is derived from the network's consensus-based randomness beacon, making it trustless and transparent.

---




