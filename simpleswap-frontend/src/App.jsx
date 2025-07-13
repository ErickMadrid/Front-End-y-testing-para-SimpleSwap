import { useState } from "react";
import { ethers } from "ethers";
import abi from "./abis/SimpleSwapABI.json";

const CONTRACT_ADDRESS = "0x342Cac67789e7dCD349B7c3Ba64476d656A16372"; // ← poné tu dirección de contrato real

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
      setPrice(formatted);
    } catch (error) {
      console.error("Error getting price:", error);
      alert("Error getting price. Check console.");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>SimpleSwap</h1>

      {!walletConnected ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <>
          <button onClick={handleGetPrice}>See Price (1 A → B)</button>
          {price && <p>Estimated Output: {price} tokens B</p>}
        </>
      )}
    </div>
  );
}

export default App;
