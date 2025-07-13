import { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "./abis/SimpleSwap.json";      // ABI SimpleSwap
import erc20Abi from "./abis/ERC20.json";      // ABI ERC20 estándar

const CONTRACT_ADDRESS = "0xb56269DBebA415CC6e4A69BaAC1A830D18e4d584"; // <- Cambia por tu contrato
const TOKEN_A_ADDRESS = "0xc0695774A49DB5374d20f1bCA3745bb362d25913"; // <- Cambia por tu TokenA
const TOKEN_B_ADDRESS = "0xbE71E2de751a68928D7BfF5B92f2cb10a51F4ea9"; // <- Cambia por tu TokenB

function App() {
  const [wallet, setWallet] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [amountIn, setAmountIn] = useState("");
  const [price, setPrice] = useState("");
  const [tokenIn, setTokenIn] = useState("A");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      const prov = new ethers.BrowserProvider(window.ethereum);
      setProvider(prov);
    } else {
      alert("Please install MetaMask!");
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not installed");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWallet(accounts[0]);

      const signer = await provider.getSigner();
      const c = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      setContract(c);
    } catch (err) {
      console.error("Wallet connection error:", err);
      alert("Error connecting wallet");
    }
  };

  const handleGetPrice = async () => {
    if (!contract) return alert("Connect wallet first");
    try {
      setLoading(true);
      const base = tokenIn === "A" ? TOKEN_A_ADDRESS : TOKEN_B_ADDRESS;
      const quote = tokenIn === "A" ? TOKEN_B_ADDRESS : TOKEN_A_ADDRESS;
      const rawPrice = await contract.getPrice(base, quote);
      setPrice(ethers.formatUnits(rawPrice, 18));
    } catch (err) {
      console.error("Error getting price:", err);
      alert("Error getting price. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!contract) return alert("Connect wallet first");
    if (!amountIn || isNaN(amountIn) || Number(amountIn) <= 0) return alert("Enter valid amount");

    try {
      setLoading(true);
      const signer = await provider.getSigner();

      const tokenInAddress = tokenIn === "A" ? TOKEN_A_ADDRESS : TOKEN_B_ADDRESS;
      const tokenOutAddress = tokenIn === "A" ? TOKEN_B_ADDRESS : TOKEN_A_ADDRESS;

      // Contrato tokenIn para aprobar
      const tokenContract = new ethers.Contract(tokenInAddress, erc20Abi, signer);
      const amountParsed = ethers.parseUnits(amountIn, 18);

      // Ver saldo disponible antes
      const balance = await tokenContract.balanceOf(wallet);
      if (balance.lt(amountParsed)) {
        alert("Insufficient token balance");
        setLoading(false);
        return;
      }

      // Approve para que SimpleSwap pueda gastar los tokens
      const allowance = await tokenContract.allowance(wallet, CONTRACT_ADDRESS);
      if (allowance.lt(amountParsed)) {
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amountParsed);
        await approveTx.wait();
      }

      // Deadline 10 min desde ahora
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

      // Ejecutar swap
      const swapTx = await contract.swapExactTokensForTokens(
        amountParsed,
        0, // amountOutMin = 0 para simplificar, ideal poner slippage control
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-4">SimpleSwap DApp</h1>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-4"
        onClick={connectWallet}
        disabled={!!wallet}
      >
        {wallet ? `Connected: ${wallet.slice(0, 6)}...` : "Connect Wallet"}
      </button>

      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        <label className="block mb-2 font-semibold">Token Input:</label>
        <select
          value={tokenIn}
          onChange={(e) => setTokenIn(e.target.value)}
          className="mb-4 p-2 border rounded w-full"
          disabled={!wallet}
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
          disabled={!wallet}
        />

        <button
          className="bg-green-600 text-white px-4 py-2 rounded-lg w-full mb-2"
          onClick={handleGetPrice}
          disabled={!wallet || loading}
        >
          {loading ? "Loading..." : "Get Price"}
        </button>

        {price && (
          <p className="text-center text-lg font-medium mb-4">
            Estimated Price: {price}
          </p>
        )}

        <button
          className="bg-purple-600 text-white px-4 py-2 rounded-lg w-full"
          onClick={handleSwap}
          disabled={!wallet || loading}
        >
          {loading ? "Processing..." : "Swap Tokens"}
        </button>
      </div>
    </div>
  );
}

export default App;

