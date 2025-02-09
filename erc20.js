require("dotenv").config();
const fs = require("fs");
const { Wallet, ethers, BigNumber } = require("ethers");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function deployAndExecuteContract() {
  // Load contract ABI and Bytecode
  const abi = JSON.parse(fs.readFileSync("contracts/erc20.abi", "utf8"));
  let bytecode = fs
    .readFileSync("contracts/erc20.bytecode", "utf8")
    .replace(/\n/g, "");

  // Setup Provider & Wallet
  const privateKey = process.env.SENDER_PRIVATE_KEY;
  // "0xbcdf20249abf0ed6d944c0288fad489e33f66b3960d9e6229c1cd214ed3bbe31";
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.ETH_RPC_URL || "http://localhost:8545"
    // "http://localhost:59997"
  );
  const wallet = new Wallet(privateKey, provider);
  const sender = wallet.address;

  console.log(`🟢 Sender Address: ${sender}`);

  // Check Native Balance
  const beforeBalance = await provider.getBalance(sender);
  console.log(
    `💰 Native Balance of Sender: ${ethers.utils.formatEther(
      beforeBalance
    )} ETH`
  );

  // Deploy Contract
  console.log(`🚀 Deploying ERC20 contract...`);
  const contractFactory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await contractFactory.deploy({ gasLimit: 5000000 });

  console.log(`⏳ Waiting for contract deployment...`);
  await contract.deployTransaction.wait();
  console.log(`✅ Contract deployed at: ${contract.address}`);

  // Wait a bit to ensure deployment
  await delay(5000);

  // Query Deploy Transaction Receipt
  const deployReceipt = await provider.getTransactionReceipt(
    contract.deployTransaction.hash
  );
  console.log(`📜 Deploy TX Receipt:`, deployReceipt);

  // Define recipient and amount
  const recipientWallet = new Wallet(
    process.env.RECIPIENT_PRIVATE_KEY,
    provider
  ); // Replace with actual private key
  const recipient = recipientWallet.address;
  const amount = BigNumber.from(10); // Use BigNumber for consistency

  // Check ERC20 Balances Before Transfer
  let senderBalance = await contract.balanceOf(sender);
  let recipientBalance = await contract.balanceOf(recipient);
  console.log(`🔹 Sender ERC20 Balance: ${senderBalance.toString()}`);
  console.log(`🔹 Recipient ERC20 Balance: ${recipientBalance.toString()}`);

  // Ensure sender has enough balance
  if (senderBalance.lt(amount)) {
    console.error(`❌ Insufficient ERC20 balance for transfer`);
    return;
  }

  // Perform ERC20 Transfer
  console.log(
    `📤 Transferring ${amount.toString()} ERC20 tokens to ${recipient}`
  );
  const transferTx = await contract.transfer(recipient, amount, {
    gasLimit: 100000,
  });
  console.log(`⏳ Waiting for transfer to confirm...`);
  await transferTx.wait();
  console.log(`✅ Transfer TX Hash: ${transferTx.hash}`);

  // Query Transfer Event
  const transferReceipt = await provider.getTransactionReceipt(transferTx.hash);
  console.log(`📜 Transfer TX Receipt:`, transferReceipt);

  // Wait for logs to be indexed
  await delay(5000);

  // Fetch Transfer Event Logs
  const transferEvents = await contract.queryFilter(
    contract.filters.Transfer(sender, recipient)
  );
  transferEvents.forEach((event) => {
    console.log(
      `📩 Transfer Event: ${event.args.from} → ${
        event.args.to
      }, Amount: ${event.args.value.toString()}`
    );
  });

  // Check Updated Balances
  senderBalance = await contract.balanceOf(sender);
  recipientBalance = await contract.balanceOf(recipient);
  console.log(
    `🔹 Sender ERC20 Balance After Transfer: ${senderBalance.toString()}`
  );
  console.log(
    `🔹 Recipient ERC20 Balance After Transfer: ${recipientBalance.toString()}`
  );

  // ========== APPROVE CASE ==========
  console.log(
    `🔹 Approving ${recipient} to spend ${amount.toString()} tokens on behalf of sender`
  );
  const approveTx = await contract.approve(recipient, amount, {
    gasLimit: 100000,
  });
  await approveTx.wait();
  console.log(`✅ Approval TX Hash: ${approveTx.hash}`);

  // Query Approval Event
  const approvalReceipt = await provider.getTransactionReceipt(approveTx.hash);
  console.log(`📜 Approval TX Receipt:`, approvalReceipt);

  // Fetch Approval Event Logs
  const approvalEvents = await contract.queryFilter(
    contract.filters.Approval(sender, recipient)
  );
  approvalEvents.forEach((event) => {
    console.log(
      `📩 Approval Event: Owner ${event.args.owner} → Spender ${
        event.args.spender
      }, Amount: ${event.args.value.toString()}`
    );
  });

  // ========== TRANSFER FROM ==========
  console.log(
    `📤 ${recipient} attempting to transfer ${amount.toString()} tokens from ${sender}`
  );

  // Connect as recipient to execute transferFrom
  const recipientContract = contract.connect(recipientWallet);

  const newRecipient = "0x614561D2d143621E126e87831AEF287678B442b8";
  let newRecipientBalance = await contract.balanceOf(newRecipient);
  console.log(
    `🔹 New Recipient ERC20 Balance: ${newRecipientBalance.toString()}`
  );
  const transferFromTx = await recipientContract.transferFrom(
    sender,
    newRecipient,
    amount,
    { gasLimit: 100000 }
  );
  await transferFromTx.wait();
  console.log(`✅ TransferFrom TX Hash: ${transferFromTx.hash}`);

  // Fetch TransferFrom Event Logs
  const transferFromEvents = await contract.queryFilter(
    contract.filters.Transfer(sender, recipient)
  );
  transferFromEvents.forEach((event) => {
    console.log(
      `📩 TransferFrom Event: ${event.args.from} → ${
        event.args.to
      }, Amount: ${event.args.value.toString()}`
    );
  });

  // Check Balances After TransferFrom
  senderBalance = await contract.balanceOf(sender);
  newRecipientBalance = await contract.balanceOf(newRecipient);
  console.log(
    `🔹 Sender ERC20 Balance After transferFrom: ${senderBalance.toString()}`
  );
  console.log(
    `🔹 New Recipient ERC20 Balance After transferFrom: ${newRecipientBalance.toString()}`
  );

  // Check Native Balance
  const afterBalance = await provider.getBalance(sender);
  console.log(
    `💰 Native Balance of Sender after all txs: ${ethers.utils.formatEther(
      afterBalance
    )} ETH`
  );
}

deployAndExecuteContract();
