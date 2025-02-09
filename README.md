# token-examples

This repository provides educational examples of how to interact with **ERC20** and **ERC721** smart contracts using **Ethers.js**. The scripts include:
- Deploying ERC20 & ERC721 contracts
- Transferring ERC20 tokens
- Approving ERC20 token transfers and executing `transferFrom`
- Querying blockchain events (`Transfer`, `Approval`)
- Interacting with ERC721 NFTs

These scripts are designed for **local blockchain environments**.

---

## 🚀 Getting Started

### **1️⃣ Install Dependencies**
Make sure you have **Node.js** and **npm/yarn** installed.

Clone the repository and install the required dependencies:

```sh
git clone https://github.com/zsystm/token-examples.git
cd token-examples
npm install
```

### 📌 Configuration 
1. Set up a local Ethereum JSON-RPC node (e.g., kurtosis)
2. Update your .env file with private keys:
```
ETH_RPC_URL="http://localhost:59997"
SENDER_PRIVATE_KEY="0xbcdf20249abf0ed6d944c0288fad489e33f66b3960d9e6229c1cd214ed3bbe31"
RECIPIENT_PRIVATE_KEY="39725efee3fb28614de3bacaffe4cc4bd8c436257e2c8bb887c4b5c4be45e76d"
```

## 📜 ERC20.js: ERC20 Token Interaction
### Features
- Deploys an ERC20 contract on the network.
- Transfers ERC20 tokens to a recipient.
- Approves a spender to transfer tokens on behalf of the owner.
- Executes transferFrom after approval.
- Queries Transfer and Approval event logs.

### Run the Script
`node erc20.js`

## 🎨 ERC721.js: NFT Interaction
### Features
- Deploys an ERC721 (NFT) contract.
- Mints an NFT to an address.
- Transfers NFT ownership to another user.
- Approves an operator for an NFT.
- Executes safeTransferFrom after approval.
- Queries Transfer and ApprovalForAll events.

`node erc721.js`

### 📝 Educational Notes
- ERC20 Basics: Fungible tokens, balances, approvals, transfer vs transferFrom.
- ERC721 Basics: Non-fungible tokens (NFTs), ownership, safeTransferFrom.
- Ethers.js Usage: Sending transactions, calling contracts, filtering events.

## 📢 Contributing
Pull requests and improvements are welcome! This project is meant to be a hands-on learning experience for blockchain development.
