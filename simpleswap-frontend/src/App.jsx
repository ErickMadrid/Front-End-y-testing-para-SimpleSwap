import { useEffect, useState } from "react";
import { ethers } from "ethers";
import SimpleSwapABI from "./abis/SimpleSwap.json";
import ERC20ABI from "./abis/ERC20.json";

const CONTRACT_ADDRESS = "0x7E28Bd2020A958bc0B303b69929eF2f2eB67E1bc";
const TOKEN_A_ADDRESS = "0x028c67473753E72B1248d464836b59fFEd3b40c7"; 
const TOKEN_B_ADDRESS = "0x9D5c8747Cd60c0BE80B702C68fb86231cc093d7e"; 

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
    if (!window.ethereum) return alert("Please install MetaMask!");

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWallet(accounts[0]);
      const signer = await provider.getSigner();
      const c = new ethers.Contract(CONTRACT_ADDRESS, SimpleSwapABI, signer);
      setContract(c);
    } catch (err) {
      console.error("Wallet connection error:", err);
      alert("Failed to connect wallet.");
    }
  };

  const handleGetPrice = async () => {
    if (!contract) return alert("Connect wallet first");

    try {
      setLoading(true);
      const base = tokenIn === "A" ? TOKEN_A_ADDRESS : TOKEN_B_ADDRESS;
      const quote = tokenIn === "A" ? TOKEN_B_ADDRESS : TOKEN_A_ADDRESS;
      const priceBigNumber = await contract.getPrice(base, quote);
      setPrice(ethers.formatUnits(priceBigNumber, 18));
    } catch (err) {
      console.error("Error getting price:", err);
      alert("Error getting price. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!contract) return alert("Connect wallet first");
    if (!amountIn || isNaN(amountIn) || Number(amountIn) <= 0) return alert("Enter a valid amount");

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const amountParsed = ethers.parseUnits(amountIn, 18);
      const tokenInAddress = tokenIn === "A" ? TOKEN_A_ADDRESS : TOKEN_B_ADDRESS;
      const tokenOutAddress = tokenIn === "A" ? TOKEN_B_ADDRESS : TOKEN_A_ADDRESS;

      const tokenContract = new ethers.Contract(tokenInAddress, ERC20ABI, signer);
      const balance = await tokenContract.balanceOf(wallet);

      if (balance < amountParsed) {
        alert("Insufficient token balance");
        setLoading(false);
        return;
      }

      const allowance = await tokenContract.allowance(wallet, CONTRACT_ADDRESS);
      if (allowance < amountParsed) {
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amountParsed);
        await approveTx.wait();
      }

      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

      const swapTx = await contract.swapExactTokensForTokens(
        amountParsed,
        0,
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
          disabled={loading}
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
          disabled={loading}
        >
          {loading ? "Processing..." : "Swap Tokens"}
        </button>
      </div>
    </div>
  );
}

export default App;


