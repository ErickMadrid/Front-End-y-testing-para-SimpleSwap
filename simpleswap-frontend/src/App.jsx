import { useEffect, useState } from "react";
import { ethers } from "ethers";
import SimpleSwapABI from "./abis/SimpleSwap.json";
import ERC20ABI from "./abis/ERC20.json";

const CONTRACT_ADDRESS = 0xb56269DBebA415CC6e4A69BaAC1A830D18e4d584"; 
const TOKEN_A_ADDRESS = "0xc0695774A49DB5374d20f1bCA3745bb362d25913"; 
const TOKEN_B_ADDRESS = "0xbE71E2de751a68928D7BfF5B92f2cb10a51F4ea9"; 

function App() {
  const [wallet, setWallet] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [amountIn, setAmountIn] = useState("");
  const [price, setPrice] = useState("");
  const [tokenIn, setTokenIn] = useState("A");

  useEffect(() => {
    if (window.ethereum) {
      const prov = new ethers.BrowserProv


  );
}

export default App;
