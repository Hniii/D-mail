import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import ChatContract from '../Chat.sol/Chat.json';
import StructuresContract from '../Structures.sol/Structures.json';
import {contractAddressStructures, contractAddressChat} from "../App"
import AES from "crypto-js/aes";
import CryptoJS from "crypto-js";
import crypto from "crypto-browserify";
import { ec } from "elliptic";
import { sha512 } from "js-sha512";
const curve = new ec("secp256k1");
const bip39 = require("bip39");

function Forgot() {
  const [name, setName] = useState("");
  const [seedPhrase, setSeedPhrase] = useState("");
  const [exists, setExists] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [password, setPassword] = useState("");
  const [cpassword, setCPassword] = useState("");
  const [showModal, setShowModal] = useState(false);


  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const chatContract = new ethers.Contract(contractAddressChat , ChatContract.abi, signer);
  const userContract = new ethers.Contract(contractAddressStructures , StructuresContract.abi, signer);


  function handlePasswordChange(e) {
    setPassword(e.target.value);
  }

  function handleCPasswordChange(e) {
    setCPassword(e.target.value);
  }

  async function Infos() {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const email = await userContract.getEmail(accounts[0]);
    console.log(email);
    return email;
  }


  async function verifySeed() {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const hashSeed = crypto.createHash("sha256");
    console.log("seed", seedPhrase);
    hashSeed.update(seedPhrase);
    const digestSeed = hashSeed.digest("hex");
    const bytes32HashSeed = "0x" + digestSeed.padStart(32, "0");
    console.log("before contract, hashed seed ", bytes32HashSeed);
    console.log(seedPhrase);
    const verify = await userContract.verifySeed(accounts[0], bytes32HashSeed);
    console.log("user address is ", accounts[0]);
    console.log("verify is ", verify);
    return verify;
  }

  async function changePassword() {

    console.log("before verify");
    const verify = await verifySeed();
    console.log("after verify");
    if (verify == true) {
        console.log(password);
      console.log("seed correct")
    
      const hashPassword = crypto.createHash('sha256');
      hashPassword.update(password);
      const digestPassword = hashPassword.digest('hex');
      const bytes32HashPassword = '0x' + digestPassword.padStart(32, '0');

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const address = accounts[0];
      console.log("current user is: ", address)
      console.log(bytes32HashPassword);
      const tx = await userContract.changePasswordUser(address, bytes32HashPassword);
      const email = await userContract.getEmail(accounts[0]);
      localStorage.removeItem("PrivateKey." + email);
      const seed = bip39.mnemonicToSeedSync(seedPhrase);
      const master = sha512.array(seed);
      const keyPair = curve.keyFromPrivate(master.slice(0, 32));
      const privateKey = keyPair.getPrivate().toString("hex");
      localStorage.setItem("PrivateKey." + email, AES.encrypt(privateKey, password).toString());
      console.log(tx.hash);

      window.location.href = "/";

      return tx; 
    
    }else {
      console.log("seed is false");
      alert("Invalid Seed Phrase !");
    }
  }


  useEffect(() => {
    async function checkLogin() {
      const userAddress = await signer.getAddress();
      setUserAddress(userAddress);
      const user = await userContract.users(userAddress);
      console.log(user, userAddress);
      setExists(user.exists);
      if (user.exists) {
        setName(user.name);
      }
    }
    checkLogin();
  }, []);

  return (
    <section
      className="section-bg"
      style={{
        backgroundImage: "url('/Background.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        margin: "0",
        height: "100vh",
      }}
    >
      <div className="container py-5 h-100">
        <div className="row d-flex justify-content-center align-items-center h-100">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div
              className="card bg-white text-black"
              style={{
                borderRadius: "20px",
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div className="card-body p-5 text-center">

                  <div>
                    <div className="mb-md-5 mt-md-4 pb-10">
                      <h2 className="fw-bold mb-2 text-uppercase">
                        Welcome back to Dmail !
                      </h2>
                      <p className="text-black-50 mb-5 mt-5">
                        Reset your password by entering your seed words seperated by a space
                      </p>

                      <div className="form-floating mb-3">
                        <label
                          htmlFor="Seed"
                          className="text-black"
                          style={{ display: "flex", alignItems: "center" }}
                        >
                          Seed words
                        </label>
                        <input
                          type="text"
                          id="Seed"
                          className="form-control form-control-lg"
                          value={seedPhrase}
                          placeholder=" "
                          onChange={(e) => setSeedPhrase(e.target.value)}
                          required
                          style={{
                            borderRadius: "10px",
                            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
                            transition: "all 0.3s ease",
                            background: `url(user.png) no-repeat 10px center / auto 20px`,
                            paddingLeft: "40px",
                          }}
                          onFocus={(e) =>
                            (e.target.style.boxShadow =
                              "0px 0px 8px rgba(0, 0, 0, 0.4)")
                          }
                          onBlur={(e) =>
                            (e.target.style.boxShadow =
                              "0px 2px 4px rgba(0, 0, 0, 0.25)")
                          }
                        />
                      </div>

                      <div className="form-floating mb-3">
                      <label htmlFor="Password" className="text-black" style={{ display: 'flex', alignItems: 'center' }}>New Password</label>
                      <input
                        type="password"
                        id="Password"
                        className="form-control form-control-lg"
                        value={password}
                        placeholder=" "
                        onChange={handlePasswordChange}
                        required
                        style={{
                          borderRadius: '10px',
                          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
                          transition: 'all 0.3s ease',
                          background: `url(key.png) no-repeat 10px center / auto 20px`,
                          paddingLeft: '40px',
                        }}
                        onFocus={(e) => e.target.style.boxShadow = '0px 0px 8px rgba(0, 0, 0, 0.4)'}
                        onBlur={(e) => e.target.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.25)'}
                      />
                      </div>

                      <div className="form-floating mb-3">
                      <label htmlFor="CPassword" className="text-black" style={{ display: 'flex', alignItems: 'center' }}>Confirm Password</label>
                      <input
                        type="password"
                        id="CPassword"
                        className="form-control form-control-lg"
                        value={cpassword}
                        placeholder=" "
                        onChange={handleCPasswordChange}
                        required
                        style={{
                          borderRadius: '10px',
                          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
                          transition: 'all 0.3s ease',
                          background: `url(key.png) no-repeat 10px center / auto 20px`,
                          paddingLeft: '40px',
                        }}
                        onFocus={(e) => e.target.style.boxShadow = '0px 0px 8px rgba(0, 0, 0, 0.4)'}
                        onBlur={(e) => e.target.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.25)'}
                      />
                      </div>

  
                      <br></br>
                      <button
                        className="btn btn-lg px-5"
                        type="submit"
                        onClick={changePassword}
                        style={{
                          backgroundColor: "#FB723F",
                          border: "none",
                          color: "#fff",
                          padding: "10px 20px",
                          borderRadius: "8px",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.target.style.backgroundColor = "#F64A0B")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.backgroundColor = "#FB723F")
                        }
                      >
                        Confirm changes
                      </button>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Forgot;