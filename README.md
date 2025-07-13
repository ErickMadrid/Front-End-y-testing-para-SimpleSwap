# SimpleSwap - Module 4

## 🧠 Description
Project that implements a simple DEX (like Uniswap) which allows users to add/remove liquidity and swap between two ERC-20 tokens.

## 📦 Contracts
- Network: Ethereum Sepolia  
- SimpleSwap Contract: `0x342Cac67789e7dCD349B7c3Ba64476d656A16372`  
- Token A (TakoA): `0x37B5706A91465a44C728D32d4A53e808D56f2fF7`  
- Token B (TakoB): `0x4e92ee90964d7A2096b607f78aE9c5d1F2f4E1D9
`  

## 🚀 Front-end
- [View on Vercel](https://front-end-y-testing-para-simple-swa.vercel.app/)

Features:
- Connect wallet (MetaMask)
- Swap Token A ↔ Token B
- View current price

## 🧪 Tests
- Test coverage was attempted using Hardhat + `solidity-coverage`
- Functional verification was done via the front-end

## 📁 Repository Structure
- `/backend`: contracts, tests, and scripts (Hardhat)
- `/frontend`: React + Vite-based front-end interface

## 🔧 How to run locally

### Backend

```bash
cd backend
npm install
npx hardhat compile
npx hardhat test
