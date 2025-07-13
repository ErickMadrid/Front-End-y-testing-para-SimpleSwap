import { useState } from "react";
import { ethers } from "ethers";
import abi from "./utils/SimpleSwapABI.json";

const CONTRACT_ADDRESS = "0xTU_CONTRATO"; // ← poné la dirección de tu contrato

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [price, setPrice] = useState(null);
  const [contract, setContract] = useState(null);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask");
        return;
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const swap = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      setContract(swap);
      setWalletConnected(true);
    } catch (error) {
      console.error("Wallet connection error:", error);
    }
  };

  const handleGetPrice = async () => {
    if (!contract) {
      alert("Connect your wallet first.");
      return;
    }

    try {
      const amountIn = ethers.parseUnits("1", 18);
      const amountOut = await contract.getAmountOut(amountIn, true);
      const formatted = ethers.formatUnits(amountOut, 18);
      setPrice(form
