import { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "./utils/SimpleSwapABI.json"; // Asegurate de que este archivo exista

const CONTRACT_ADDRESS = "0xTU_CONTRATO"; // ⬅️ Reemplaza con tu dirección real

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [price, setPrice] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await newProvider.getSigner();
      const swapContract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      setProvider(newProvider);
      setContract(swapContract);
      setWalletConnected(true);
    } else {
      alert("Please install MetaMask");
    }
  };

  const handleGetPrice = async () => {
    if (!contract) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      const amountIn = ethers.parseUnits("1", 18); // 1 Token A
      const amountOut = await contract.getAmountOut(amountIn, true); // true = A to B
      setPrice(ethers.formatUnits(amountOut, 18));
    } catch (error) {
      console.error("Error getting price:", error);
      alert("Error fetching price. Check the console.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>SimpleSwap Interface</h1>

      {!walletConnected && (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}

      {walletConnected && (
        <>
          <button onClick={handleGetPrice}>See Price 1 A → B</button>
          {price && <p>Estimated Output: {price} Token B</p>}
        </>
      )}
    </div>
  );
}

export default App;
