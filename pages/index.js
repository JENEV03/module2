import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import atmABI from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atmContract, setAtmContract] = useState(undefined);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [amountToDeposit, setAmountToDeposit] = useState("");
  const [amountToWithdraw, setAmountToWithdraw] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferTo, setTransferTo] = useState("");

  const contractAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(new ethers.providers.Web3Provider(window.ethereum));
    }
  };

  const connectAccount = async () => {
    try {
      if (!ethWallet) {
        alert("MetaMask wallet is required to connect");
        return;
      }

      const accounts = await ethWallet.listAccounts();
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        getAtmContract();
        getBalance();
        setError(null);
      } else {
        setError("No accounts found.");
      }
    } catch (error) {
      setError("Error connecting to MetaMask: " + error.message);
    }
  };

  const getAtmContract = async () => {
    try {
      const signer = ethWallet.getSigner();
      const contract = new ethers.Contract(contractAddress, atmABI.abi, signer);
      setAtmContract(contract);
    } catch (error) {
      setError("Error getting contract: " + error.message);
    }
  };

  const getBalance = async () => {
  try {
    if (atmContract && account) {
      setLoading(true);
      const balanceBigNumber = await atmContract.getBalance(account); // Corrected atm to atmContract
      const balance = ethers.utils.formatUnits(balanceBigNumber, "ether");
      setBalance(balance);
      setLoading(false);
    } else {
      setError("Contract or account not initialized.");
    }
  } catch (error) {
    console.error("Error fetching balance:", error);
    setError("Error fetching balance: " + error.message);
    setLoading(false);
  }
};


  const deposit = async () => {
    try {
      if (atmContract && amountToDeposit) {
        setLoading(true);
        const tx = await atmContract.deposit({ value: ethers.utils.parseEther(amountToDeposit) });
        await tx.wait();
        getBalance();
        addToTransactionHistory("Deposit", amountToDeposit);
        setAmountToDeposit("");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error depositing:", error);
      setError("Error depositing: " + error.message);
      setLoading(false);
    }
  };

  const withdraw = async () => {
    try {
      if (atmContract && amountToWithdraw) {
        setLoading(true);
        const tx = await atmContract.withdraw(ethers.utils.parseEther(amountToWithdraw));
        await tx.wait();
        getBalance();
        addToTransactionHistory("Withdraw", "-" + amountToWithdraw);
        setAmountToWithdraw("");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error withdrawing:", error);
      setError("Error withdrawing: " + error.message);
      setLoading(false);
    }
  };

  const transfer = async () => {
    try {
      if (atmContract && transferTo && transferAmount) {
        setLoading(true);
        const tx = await atmContract.transfer(transferTo, ethers.utils.parseEther(transferAmount));
        await tx.wait();
        getBalance();
        addToTransactionHistory("Transfer", "-" + transferAmount, transferTo);
        setTransferAmount("");
        setTransferTo("");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error transferring funds:", error);
      setError("Error transferring funds: " + error.message);
      setLoading(false);
    }
  };

  const addToTransactionHistory = (action, amount, to = null) => {
    const newTransaction = {
      action,
      amount,
      to,
      timestamp: new Date().toLocaleString(),
    };
    setTransactionHistory([newTransaction, ...transactionHistory]);
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>Metacrafters ATM!</h1>
      </header>
      {error && <p className="error">{error}</p>}
      {loading && <p>Loading...</p>}
      {!account && (
        <button className="connect-button" onClick={connectAccount}>
          Connect to MetaMask
        </button>
      )}
      {account && (
        <div className="user-info">
          <p>Your Account: {account}</p>
          <p>Your Balance: {balance} </p>
          <div className="input-container">
            <input
              type="text"
              value={amountToDeposit}
              onChange={(e) => setAmountToDeposit(e.target.value)}
              placeholder="Amount to deposit"
            />
            <button className="deposit-btn" onClick={deposit}>Deposit</button>
          </div>
          <div className="input-container">
            <input
              type="text"
              value={amountToWithdraw}
              onChange={(e) => setAmountToWithdraw(e.target.value)}
              placeholder="Amount to withdraw"
            />
            <button className="withdraw-btn" onClick={withdraw}>Withdraw</button>
          </div>
          <div className="input-container">
            <input
              type="text"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              placeholder="Recipient address"
            />
            <input
              type="text"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="Amount to transfer"
            />
            <button className="transfer-btn" onClick={transfer}>Transfer</button>
          </div>
        </div>
      )}
      <div className="transaction-history">
        <h2>Transaction History</h2>
        <ul>
          {transactionHistory.map((transaction, index) => (
            <li key={index}>
              {transaction.action} - {transaction.amount} ETH ({transaction.timestamp})
            </li>
          ))}
        </ul>
      </div>
      <style jsx>{`
        .container {
          background-color: #DBB5B5; /* Set background color */
          padding: 20px;
        }
        /* Add other styles as needed */
      `}</style>
    </main>
  );
}