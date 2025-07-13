import { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "./abis/SimpleSwap.json";

// ABI mínimo para el token ERC20 (balanceOf, approve)
const ERC20ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

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

  // Inicializar provider al montar componente
  useEffect(() => {
    if (window.ethereum) {
      const prov = new ethers.BrowserProvider(window.ethereum);
      setProvider(prov);
    }
  }, []);

  // Función conectar wallet y crear instancia contrato
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

  // Obtener precio
  const handleGetPrice = async () => {
    if (!contract) return alert("Connect wallet first");
    try {
      const base = tokenIn === "A" ? TOKEN_A_ADDRESS : TOKEN_B_ADDRESS;
      const quote = tokenIn === "A" ? TOKEN_B_ADDRESS : TOKEN_A_ADDRESS;
      const priceBN = await contract.getPrice(base, quote);
      setPrice(ethers.formatUnits(priceBN, 18));
    } catch (err) {
      console.error("Error getting price:", err);
      alert("Error getting price. Check console.");
    }
  };

  // Función para hacer swap con chequeo de saldo y approve
  const handleSwap = async () => {
    if (!contract) return alert("Connect wallet first");
    if (!amountIn || isNaN(amountIn) || Number(amountIn) <= 0) return alert("Enter valid amount");

    try {
      const signer = await provider.getSigner();

      // Determinar tokenIn y tokenOut
      const tokenInAddress = tokenIn === "A" ? TOKEN_A_ADDRESS : TOKEN_B_ADDRESS;
      const tokenOutAddress = tokenIn === "A" ? TOKEN_B_ADDRESS : TOKEN_A_ADDRESS;

      // Instanciar tokenIn contrato ERC20 para balance y approve
      const tokenContract = new ethers.Contract(tokenInAddress, ERC20ABI, signer);

      // Obtener balance y convertir amountIn a BigNumber
      const balance = await tokenContract.balanceOf(wallet);
      const amountBN = ethers.parseUnits(amountIn, 18);

      // Validar saldo suficiente
      if (balance.lt(amountBN)) {
        alert("Insufficient token balance");
        return;
      }

      // Approve
      const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amountBN);
      await approveTx.wait();

      // Deadline 10 minutos desde ahora
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

      // Ejecutar swap
      const swapTx = await contract.swapExactTokensForTokens(
        amountBN,
        0, // amountOutMin, puedes mejorar esto
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
