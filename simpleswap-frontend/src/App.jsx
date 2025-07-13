import { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "./abis/SimpleSwap.json";

const CONTRACT_ADDRESS = "0x342Cac67789e7dCD349B7c3Ba64476d656A16372"; // <-- reemplaza esto

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [price, setPrice] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const prov = new ethers.BrowserProvider(window.ethereum);
        setProvider(prov);
        const signer = await prov.getSigner();
        setSigner(signer);

        const swapContract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
        setContract(swapContract);

        const accs = await prov.send("eth_requestAccounts", []);
        setAccount(accs[0]);
      } else {
        alert("Please install MetaMask");
      }
    };

    init();
  }, []);

  const checkLiquidity = async () => {
    try {
      const liquidity = await contract.totalSupply();
      return BigInt(liquidity) > 0n;
    } catch (err) {
      console.error("Error checking liquidity:", err);
      return false;
    }
  };

  const getPrice = async () => {
    try {
      if (!contract) return;

      const hasLiquidity = await checkLiquidity();
      if (!hasLiquidity) {
        alert("No liquidity in the pool yet");
        return;
      }

      const tokenA = await contract.tokenA();
      const tokenB = await contract.tokenB();

      const price = await contract.getPrice(tokenA, tokenB);
      setPrice(ethers.formatUnits(price, 18));
    } catch (err) {
      console.error("Error getting price:", err);
      alert("Error getting price. Check console.");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>SimpleSwap DApp</h1>

      <button onClick={getPrice}>Get Price</button>

      {price && (
        <p>
          💱 Current Price: <strong>{price}</strong>
        </p>
      )}

      <p>
        {account
          ? `✅ Connected: ${account}`
          : "❌ Wallet not connected"}
      </p>
    </div>
  );
}

export default App;
