import { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "./abis/SimpleSwap.json";

function App() {
  const [contract, setContract] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [price, setPrice] = useState("");
  
  // ⚠️ Reemplazá con las direcciones REALES de tus tokens y contrato
  const contractAddress = "0x342Cac67789e7dCD349B7c3Ba64476d656A16372";
  const tokenAAddress = "0x37B5706A91465a44C728D32d4A53e808D56f2fF7";
  const tokenBAddress = "0x4e92ee90964d7A2096b607f78aE9c5d1F2f4E1D9";

  // 🔌 Conectar la wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        setWalletConnected(true);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const instance = new ethers.Contract(contractAddress, abi, signer);
        setContract(instance);
      } catch (error) {
        console.error("Wallet connection error:", error);
      }
    } else {
      alert("Please install MetaMask");
    }
  };

  // 🧮 Chequear si hay liquidez
  const checkLiquidity = async () => {
    try {
      const liquidity = await contract.totalSupply();
      return liquidity.gt(0);
    } catch (err) {
      console.error("Error checking liquidity:", err);
      return false;
    }
  };

  // 💱 Obtener precio
  const getPrice = async () => {
    if (!contract) {
      alert("Contract not loaded");
      return;
    }

    try {
      const hasLiquidity = await checkLiquidity();
      if (!hasLiquidity) {
        setPrice("No liquidity available");
        return;
      }

      const result = await contract.getPrice(tokenAAddress, tokenBAddress);
      const formatted = ethers.formatUnits(result, 18); // ajustá si tus tokens usan otro decimal
      setPrice(`${formatted} Token B por 1 Token A`);
    } catch (error) {
      console.error("Error getting price:", error);
      setPrice("Error getting price");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>SimpleSwap DApp</h1>

      {!walletConnected ? (
        <button onClick={connectWallet}>Conectar Wallet</button>
      ) : (
        <>
          <button onClick={getPrice}>Ver precios</button>
          <p><strong>Precio:</strong> {price}</p>
        </>
      )}
    </div>
  );
}

export default App;
