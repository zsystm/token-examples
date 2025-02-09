require("dotenv").config();
const fs = require("fs");
const { Wallet, ethers } = require("ethers");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function deployAndExecuteNFTContract() {
  // Load contract ABI and Bytecode
  const abi = JSON.parse(fs.readFileSync("contracts/erc721.abi", "utf8"));
  let bytecode = fs
    .readFileSync("contracts/erc721.bytecode", "utf8")
    .replace(/\n/g, "");

  // Setup Provider & Wallet
  const privateKey = process.env.SENDER_PRIVATE_KEY;
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.ETH_RPC_URL || "http://localhost:8545"
  );
  const wallet = new Wallet(privateKey, provider);
  const sender = wallet.address;

  console.log(`🟢 Sender Address: ${sender}`);

  // Deploy Contract
  console.log(`🚀 Deploying MyToken (ERC721) contract...`);
  const contractFactory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await contractFactory.deploy({ gasLimit: 5000000 });

  console.log(`⏳ Waiting for contract deployment...`);
  await contract.deployTransaction.wait();
  console.log(`✅ Contract deployed at: ${contract.address}`);

  await delay(5000);

  // Query Deploy Transaction Receipt
  const deployReceipt = await provider.getTransactionReceipt(
    contract.deployTransaction.hash
  );
  console.log(`📜 Deploy TX Receipt:`, deployReceipt);

  // Define recipient and token ID
  const recipientWallet = new Wallet(
    process.env.RECIPIENT_PRIVATE_KEY,
    provider
  );
  const recipient = recipientWallet.address;
  const tokenId = 0; // First minted NFT

  // Check Initial NFT Ownership
  let owner = await contract.ownerOf(tokenId);
  console.log(`🔹 Owner of Token ID ${tokenId}: ${owner}`);

  if (owner !== sender) {
    console.error(`❌ Unexpected NFT owner. Expected ${sender}, but got ${owner}.`);
    return;
  }

  // Approve Recipient for NFT Transfer
  console.log(`🔹 Approving ${recipient} to transfer Token ID ${tokenId}`);
  const approveTx = await contract.approve(recipient, tokenId, {
    gasLimit: 100000,
  });
  await approveTx.wait();
  console.log(`✅ Approval TX Hash: ${approveTx.hash}`);

  // Fetch Approval Event Logs
  const approvalEvents = await contract.queryFilter(
    contract.filters.Approval(sender, recipient)
  );
  approvalEvents.forEach((event) => {
    console.log(
      `📩 Approval Event: Owner ${event.args.owner} → Approved ${event.args.approved}, Token ID: ${event.args.tokenId.toString()}`
    );
  });

  const newRecipient = "0x614561D2d143621E126e87831AEF287678B442b8";
  // Execute Transfer as Recipient
  console.log(`📤 ${recipient} attempting to transfer NFT Token ID ${tokenId} to ${newRecipient}`);

  const recipientContract = contract.connect(recipientWallet);
  const transferTx = await recipientContract["safeTransferFrom(address,address,uint256)"](
    sender,
    recipient,
    tokenId,
    { gasLimit: 100000 }
  );
  await transferTx.wait();
  console.log(`✅ Transfer TX Hash: ${transferTx.hash}`);

  // Fetch Transfer Event Logs
  const transferEvents = await contract.queryFilter(
    contract.filters.Transfer(sender, recipient)
  );
  transferEvents.forEach((event) => {
    console.log(
      `📩 Transfer Event: ${event.args.from} → ${event.args.to}, Token ID: ${event.args.tokenId.toString()}`
    );
  });

  // Check Final Owner
  const finalOwner = await contract.ownerOf(tokenId);
  console.log(`🔹 Final Owner of Token ID ${tokenId}: ${finalOwner}`);
}

deployAndExecuteNFTContract();
