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

function Login() {
  const [name, setName] = useState("");
  const [seedPhrase, setSeedPhrase] = useState("");
  const [exists, setExists] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [password, setPassword] = useState();
  const [showModal, setShowModal] = useState(false);
  const [showModalDesactivated, setShowModalDesactivated] = useState(false);


  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const chatContract = new ethers.Contract(contractAddressChat , ChatContract.abi, signer);
  const userContract = new ethers.Contract(contractAddressStructures , StructuresContract.abi, signer);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleCloseModalDesactivated = () => {
    setShowModalDesactivated(false);
  };

  async function Infos() {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const email = await userContract.getEmail(accounts[0]);
    console.log(email);
    return email;
  }

  async function verifyPassword() {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const hashPassword = crypto.createHash("sha256");
    hashPassword.update(password);
    const digestPassword = hashPassword.digest("hex");
    const bytes32HashPassword = "0x" + digestPassword.padStart(32, "0");
    const verify = await userContract.verifyPassword(
      accounts[0],
      bytes32HashPassword
    );
    return verify;
  }

  async function verifySeed() {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const hashSeed = crypto.createHash("sha256");
    hashSeed.update(seedPhrase);
    const digestSeed = hashSeed.digest("hex");
    const bytes32HashSeed = "0x" + digestSeed.padStart(32, "0");
    const verify = await userContract.verifySeed(accounts[0], bytes32HashSeed);
    return verify;
  }
  const handleForgot = () => {
    window.location.href = "/forgot";
   }
  
  async function login() {
    const seed = bip39.mnemonicToSeedSync(seedPhrase);
    const master = sha512.array(seed);
    const keyPair = curve.keyFromPrivate(master.slice(0, 32));
    const privateKey = keyPair.getPrivate().toString("hex");
    const verify = await verifySeed();
    if (verify == true) {
      const infos = await Infos();
      const encryptedPrivateKey = AES.encrypt(privateKey, password).toString();
      localStorage.setItem("PrivateKey."+infos, encryptedPrivateKey);
      const decryptedPrivateKey = AES.decrypt(
        encryptedPrivateKey,
        password
      ).toString(CryptoJS.enc.Utf8);
      sessionStorage.setItem("PrivateKey." + infos, decryptedPrivateKey);
      window.location.href = "/inbox";
    }else {
      alert("Invalid Seed Phrase !");
    }
  }

  async function handleLogin() {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    if (exists) {
      const user = userContract.users(accounts[0]);    // user exists, redirect to inbox
      console.log(user);
      if(enabled){
        
        const verify = await verifyPassword();
        if (verify == true) {
          const infos = await Infos();
          if (localStorage.getItem("PrivateKey." + infos)) {
            const encryptedPrivateKey = localStorage.getItem(
              "PrivateKey." + infos
            );
            const decryptedPrivateKey = AES.decrypt(
              encryptedPrivateKey,
              password
            ).toString(CryptoJS.enc.Utf8);
            sessionStorage.setItem("PrivateKey." + infos, decryptedPrivateKey);
            window.location.href = "/inbox";
          } else {
            setShowModal(true);
          }
        } else {
          alert("Invalid Password !");
        }
      }else{
        console.log("wsalt hna");
        setShowModalDesactivated(true);
      }
      // you can replace '/inbox' with the actual URL of the inbox page
     
    } else {
      // user does not exist, redirect to create account page
      // you can replace '/create' with the actual URL of the create account page
      window.location.href = "/create";
    }
  }

  useEffect(() => {
    async function checkLogin() {
      const userAddress = await signer.getAddress();
      setUserAddress(userAddress);
      const user = await userContract.users(userAddress);
      setExists(user.exists);
      setEnabled(user.enabled);
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
                {showModal ? (
                  <div>
                    <Modal show={showModal} onHide={handleCloseModal}>
                      <Modal.Body
                        style={{
                          backgroundColor: "#ffcccc",
                          fontWeight: "bold",
                          fontSize: "18px",
                          padding: "20px",
                          borderTopLeftRadius: "0",
                          borderTopRightRadius: "0",
                        }}
                      >
                        <div style={{ marginTop: "20px" }}>
                          <p
                            style={{
                              fontSize: "15px",
                              color: "#cc0000",
                              textAlign: "center",
                            }}
                          >
                            You are logging from a new browser, Enter your seed
                            phrase !
                          </p>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <div className="form-floating mb-3">
                            <label
                              htmlFor="Seed"
                              className="text-black"
                              style={{ display: "flex", alignItems: "center" }}
                            ></label>
                            <input
                              type="text"
                              id="seedPhrase"
                              className="form-control form-control-lg"
                              value={seedPhrase}
                              placeholder=" "
                              onChange={(e) => setSeedPhrase(e.target.value)}
                              required
                              style={{
                                borderRadius: "10px",
                                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
                                transition: "all 0.3s ease",
                                width: "450px",
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
                        </div>
                      </Modal.Body>
                      <Modal.Footer
                        style={{
                          backgroundColor: "#ffcccc",
                          borderTop: "none",
                          borderBottomLeftRadius: "5px",
                          borderBottomRightRadius: "5px",
                        }}
                      >
                        <Button
                          variant="secondary"
                          onClick={login}
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
                          Confirm
                        </Button>
                      </Modal.Footer>
                    </Modal>
                    </div>
                ) : (
                  <div>
                    <div className="mb-md-5 mt-md-4 pb-10">
                      <h2 className="fw-bold mb-2 text-uppercase">
                        Welcome to Dmail
                      </h2>
                      <p className="text-black-50 mb-5 mt-5">
                        Click to connect your MetaMask wallet
                      </p>

                      <div className="form-floating mb-3">
                        <label
                          htmlFor="Name"
                          className="text-black"
                          style={{ display: "flex", alignItems: "center" }}
                        >
                          Password
                        </label>
                        <input
                          type="password"
                          id="Password"
                          className="form-control form-control-lg"
                          value={password}
                          placeholder=" "
                          onChange={(e) => setPassword(e.target.value)}
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
                      <div>
                        <a href="#" onClick={handleForgot} style={{ fontSize: "14px", color: "#707070", textDecoration: "underline" }}>
                          Forgot Password?
                        </a>
                      </div>
                      <br></br>
                      <button
                        className="btn btn-lg px-5"
                        type="submit"
                        onClick={handleLogin}
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
                        Login
                      </button>
                    </div>
                  </div>
                )}
                           
                    <Modal show={showModalDesactivated} onHide={handleCloseModalDesactivated} >
  <Modal.Header closeButton style={{ backgroundColor: '#ffcccc', borderTopLeftRadius: '10px', borderTopRightRadius: '10px', borderBottom: 'none', marginTop: 20, textAlign: 'center' }}>
    <Modal.Title style={{ fontSize: '24px', color: '#cc0000', fontWeight: 'bold', textAlign: 'center' }}>Access denied</Modal.Title>
  </Modal.Header>
  <Modal.Body style={{ backgroundColor: '#ffcccc',  fontWeight: 'bold', fontSize: '18px', padding: '20px', borderTopLeftRadius: '0', borderTopRightRadius: '0' }}>
  <p style={{textAlign: 'center', marginTop: '15px', fontSize: '20px'}}>Please consult the administrator regarding the desactivation of your account.</p>
  </Modal.Body>
  <Modal.Footer style={{ backgroundColor: '#ffcccc', borderTop: 'none', borderBottomLeftRadius: '5px', borderBottomRightRadius: '5px' }}>
    <Button variant="secondary" onClick={handleCloseModalDesactivated}>
      Close
    </Button>
  </Modal.Footer>
</Modal>
                  
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
