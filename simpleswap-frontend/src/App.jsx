import { useState } from "react";
import { ethers } from "ethers";
import SimpleSwapABI from "./abi/SimpleSwap.json";

// 🔁 Reemplazá estas direcciones por las reales
const SIMPLESWAP_ADDRESS = "0x342Cac67789e7dCD349B7c3Ba64476d656A16372";
const TOKEN_A_ADDRESS = "0x37B5706A91465a44C728D32d4A53e808D56f2fF7";
const TOKEN_B_ADDRESS = "0x4e92ee90964d7A2096b607f78aE9c5d1F2f4E1D9";

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [price, setPrice] = useState(null);

  // Conectar Wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
    } else {
      alert("MetaMask not found");
    }
  };

  // Obtener precio
  const getPrice = async () => {
    try {
      if (!provider) {
        alert("Please connect your wallet first");
        return;
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(SIMPLESWAP_ADDRESS, SimpleSwapABI, signer);

      const tokenA = await contract.tokenA();
      const tokenB = await contract.tokenB();
      const result = await contract.getPrice(tokenA, tokenB);

      setPrice(ethers.formatUnits(result, 18));
    } catch (error) {
      console.error("Error getting price:", error);
      alert("Error getting price. Check console.");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>🦑 SimpleSwap DApp</h1>

      <button onClick={connectWallet}>
        {walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...` : "Connect Wallet"}
      </button>

      <br /><br />

      <button onClick={getPrice}>Get Token A → B Price</button>

      {price && (
        <div style={{ marginTop: "1rem" }}>
          <strong>Price:</strong> {price}
        </div>
      )}
    </div>
  );
}

export default App;
