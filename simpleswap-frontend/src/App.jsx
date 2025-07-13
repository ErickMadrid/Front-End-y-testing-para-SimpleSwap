import { useState } from "react";
import { ethers } from "ethers";
import abi from "./abis/SimpleSwap.json";

// 🔁 Reemplazá estas direcciones por las reales
const SIMPLESWAP_ADDRESS = "0x342Cac67789e7dCD349B7c3Ba64476d656A16372";
const TOKEN_A_ADDRESS = "0x37B5706A91465a44C728D32d4A53e808D56f2fF7";
const TOKEN_B_ADDRESS = "0x4e92ee90964d7A2096b607f78aE9c5d1F2f4E1D9";

function App() {
  const [account, setAccount] = useState(null);
  const [price, setPrice] = useState("");

  // 👉 Conectar wallet (MetaMask)
  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } else {
      alert("Please install MetaMask");
    }
  };

  // 👉 Obtener precio A/B desde el contrato
  const handleGetPrice = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        SIMPLESWAP_ADDRESS,
        SimpleSwapABI,
        signer
      );

      const rawPrice = await contract.getPrice(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS);
      const formatted = ethers.formatUnits(rawPrice, 18);

      setPrice(formatted);
    } catch (err) {
      console.error("Error getting price:", err);
      alert("Error getting price. Check console.");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>SimpleSwap</h1>

      <button onClick={connectWallet}>
        {account ? `Connected: ${account.slice(0, 6)}...` : "Connect Wallet"}
      </button>

      <br /><br />

      <button onClick={handleGetPrice}>Ver precios</button>

      {price && (
        <p>
          Precio de Token A en B: <strong>{price}</strong>
        </p>
      )}
    </div>
  );
}

export default App;
