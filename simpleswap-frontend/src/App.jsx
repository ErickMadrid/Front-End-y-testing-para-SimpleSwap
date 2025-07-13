import { useState, useEffect } from "react";
import { ethers } from "ethers";
import SimpleSwapABI from "./abis/SimpleSwap.json"; // agregarás este ABI luego

const App = () => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const _provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(_provider);

        const signer = _provider.getSigner();
        const _account = await _provider.send("eth_requestAccounts", []);
        setAccount(_account[0]);

        const simpleSwap = new ethers.Contract(
          import.meta.env.VITE_SIMPLESWAP_ADDRESS,
          SimpleSwapABI,
          signer
        );
        setContract(simpleSwap);
      }
    };
    init();
  }, []);

  const getPrice = async () => {
    const price = await contract.getPrice();
    alert(`Precio: ${price}`);
  };

  return (
    <div>
      <h1>SimpleSwap DApp</h1>
      <p>Conectado como: {account}</p>
      <button onClick={getPrice}>Ver precio</button>
      {/* Agrega luego más botones para swap A → B, B → A */}
    </div>
  );
};

export default App;

