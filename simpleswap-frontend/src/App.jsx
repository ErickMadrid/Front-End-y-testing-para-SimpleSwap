import { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "./abis/SimpleSwap.json";
import ERC20ABI from "./abis/ERC20.json"; // ABI ERC20 estándar para balance, approve, allowance

const CONTRACT_ADDRESS = "0xb56269DBebA415CC6e4A69BaAC1A830D18e4d584"; // Pon aquí tu contrato SimpleSwap
const TOKEN_A_ADDRESS = "0xc0695774A49DB5374d20f1bCA3745bb362d25913";       // Dirección Token A
const TOKEN_B_ADDRESS = "0xbE71E2de751a68928D7BfF5B92f2cb10a51F4ea9";       // Dirección Token B

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
      alert("Failed to connect wallet");
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
    if (!contract || !amountIn || !wallet) return alert("Connect wallet and enter amount");

    try {
      const signer = await provider.getSigner();
      const amountParsed = ethers.parseUnits(amountIn, 18);

      const tokenInAddress = tokenIn === "A" ? TOKEN_A_ADDRESS : TOKEN_B_ADDRESS;
      const tokenOutAddress = tokenIn === "A" ? TOKEN_B_ADDRESS : TOKEN_A_ADDRESS;

      // Instanciar contrato tokenIn para balance y allowance
      const tokenContract = new ethers.Contract(tokenInAddress, ERC20ABI, signer);

      // Obtener saldo y allowance
      const balance = await tokenContract.balanceOf(wallet);
      const allowance = await tokenContract.allowance(wallet, CONTRACT_ADDRESS);

      console.log("Balance:", ethers.formatUnits(balance, 18));
      console.log("Allowance:", ethers.formatUnits(allowance, 18));

      if (balance.lt(amountParsed)) {
        alert("Insufficient token balance");
        return;
      }

      // Si allowance es menor que amountParsed, aprobar primero
      if (allowance.lt(amountParsed)) {
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amountParsed);
        await approveTx.wait();
      }

      const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // +10 min

      const swapTx = await contract.swapExactTokensForTokens(
        amountParsed,
        0, // amountOutMin 0 para simplificar, en real usar slippage control
        tokenInAddress,
        tokenOutAddress,
        wallet,
        deadline
      );
      await swapTx.wait();

      alert("Swap successful!");
      setAmountIn("");
      setPrice("");
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
