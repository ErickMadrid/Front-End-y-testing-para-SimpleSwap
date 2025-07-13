import { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "./abis/SimpleSwap.json";
import erc20ABI from "./abis/ERC20.json";

const CONTRACT_ADDRESS = "0xb56269DBebA415CC6e4A69BaAC1A830D18e4d584"; // ← Reemplazar con la dirección real
const TOKEN_A_ADDRESS = "0xc0695774A49DB5374d20f1bCA3745bb362d25913"; // ← Reemplazar con TokenA
const TOKEN_B_ADDRESS = "0xbE71E2de751a68928D7BfF5B92f2cb10a51F4ea9"; // ← Reemplazar con TokenB

function App() {
  const [wallet, setWallet] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [amountIn, setAmountIn] = useState("");
  const [price, setPrice] = useState("");
  const [tokenIn, setTokenIn] = useState("A");

  useEffect(() => {
    if (window.ethereum) {
      const prov = new ethers.BrowserProvider(window.ethereum);
      setProvider(prov);
    }
  }, []);

  const connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWallet(accounts[0]);
      const signer = await provider.getSigner();
      const c = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      setContract(c);
    } catch (err) {
      console.error("Wallet connection error:", err);
    }
  };

  const handleGetPrice = async () => {
    if (!contract) return alert("Connect wallet first");
    try {
      const base = tokenIn === "A" ? TOKEN_A_ADDRESS : TOKEN_B_ADDRESS;
      const quote = tokenIn === "A" ? TOKEN_B_ADDRESS : TOKEN_A_ADDRESS;
      const price = await contract.getPrice(base, quote);
      setPrice(ethers.formatUnits(price, 18));
    } catch (err) {
      console.error("Error getting price:", err);
      alert("Error getting price. Check console.");
    }
  };

  const handleSwap = async () => {
    if (!contract || !amountIn) return;
    try {
      const signer = await provider.getSigner();
      const amount = ethers.parseUnits(amountIn, 18);
      const tokenInAddress = tokenIn === "A" ? TOKEN_A_ADDRESS : TOKEN_B_ADDRESS;
      const tokenOutAddress = tokenIn === "A" ? TOKEN_B_ADDRESS : TOKEN_A_ADDRESS;

      // ✅ ABI correcto para el token
      const tokenContract = new ethers.Contract(tokenInAddress, erc20ABI, signer);

      const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amount);
      await approveTx.wait();

      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
      const swapTx = await contract.swapExactTokensForTokens(
        amount,
        0,
        tokenInAddress,
        tokenOutAddress,
        wallet,
        deadline
      );
      await swapTx.wait();
      alert("Swap successful!");
    } catch (err) {
      console.error("Swap failed:", err);
      alert("Swap failed. Check console.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-4">SimpleSwap DApp</h1>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-4"
        onClick={connectWallet}
      >
        {wallet ? `Connected: ${wallet.slice(0, 6)}...` : "Connect Wallet"}
      </button>

      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        <label className="block mb-2 font-semibold">Token Input:</label>
        <select
          value={tokenIn}
          onChange={(e) => setTokenIn(e.target.value)}
          className="mb-4 p-2 border rounded w-full"
        >
          <option value="A">Token A</option>
          <option value="B">Token B</option>
        </select>

        <label className="block mb-2 font-semibold">Amount:</label>
        <input
          type="number"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
          placeholder="Enter amount"
          className="mb-4 p-2 border rounded w-full"
        />

        <button
          className="bg-green-600 text-white px-4 py-2 rounded-lg w-full mb-2"
          onClick={handleGetPrice}
        >
          Get Price
        </button>

        {price && (
          <p className="text-center text-lg font-medium mb-4">
            Estimated Price: {price}
          </p>
        )}

        <button
          className="bg-purple-600 text-white px-4 py-2 rounded-lg w-full"
          onClick={handleSwap}
        >
          Swap Tokens
        </button>
      </div>
    </div>
  );
}

export default App;

  );
}

export default App;
