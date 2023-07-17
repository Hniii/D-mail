import { ethers } from "ethers";
import { useState } from "react";
import ChatContract from "../Chat.sol/Chat.json";
import StructuresContract from "../Structures.sol/Structures.json";
import { ec } from "elliptic";
import crypto from "crypto-browserify";
import { sha512 } from "js-sha512";
import { generateMnemonic } from "bip39";
import AES from "crypto-js/aes";
import { contractAddressStructures, contractAddressChat } from "../App";
import { Button, Modal } from "react-bootstrap";

const bip39 = require("bip39");

const curve = new ec("secp256k1");

function ConnectWallet() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [seedWords, setSeedWords] = useState([]);
  const [cpassword, setCPassword] = useState("");
  const [formError, setFormError] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [userId, setUserId] = useState("");
  const [isExecuted, setIsExecuted] = useState(false);
  const [link, setLink] = useState("");
  const [showModalF, setShowModalF] = useState(false);

  const [passwordError, setPasswordError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [nameError, setNameError] = useState(null);
  const [idError, setIdError] = useState(null);
  const [walletError, setWalletError] = useState(null);
  const [passlenError, setPasslenError] = useState(null);

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const chatContract = new ethers.Contract(
    contractAddressChat,
    ChatContract.abi,
    signer
  );
  const userContract = new ethers.Contract(
    contractAddressStructures,
    StructuresContract.abi,
    signer
  );

  async function connectWallet() {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setWalletAddress(accounts[0]);
  }

  const handleCloseModalF = () => {
    setShowModalF(false);
  };


  const handleCloseModal = () => {
    setShowModal(false);
    window.location.href = "/";
  };

  function handlePasswordChange(e) {
    setPassword(e.target.value);
  }

  function handleCPasswordChange(e) {
    setCPassword(e.target.value);
  }

  function generateKeys() {
    const mnemonic = generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const master = sha512.array(seed);
    const keyPair = curve.keyFromPrivate(master.slice(0, 32));
    const privateKey = keyPair.getPrivate().toString("hex");
    const publicKey = keyPair.getPublic().encode("hex");
    return [mnemonic, privateKey, publicKey];
  }

  async function createUser() {
    var err = false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    if (!isValid) {
      setEmailError("this is not a valid email address");
      err = true;
    } else {
      setEmailError(null);
    }
    if (name.length < 3 || name.length > 50) {
      setNameError("name must be between 3 and 50 characters");
      err = true;
    } else {
      setNameError(null);
    }
    if (name.length < 3 || name.length > 50) {
      setNameError("name must be between 3 and 50 characters");
      err = true;
    } else {
      setNameError(null);
    }
    if (password.length < 8) {
      setPasslenError("password must be at least 8 characters long");
      err = true;
    } else {
      setPasslenError(null);
    }
    if (userId.length == 0) {
      setIdError("the ID cannot be empty, ask the admin for your ID");
      err = true;
    } else {
      setIdError(null);
    }
    if (password !== cpassword) {
      setPasswordError("the passwords don't match");
      err = true;
    } else {
      setPasswordError(null);
    }
    if (walletAddress.length == 0) {
      setWalletError("the wallet cannot be empty");
      err = true;
    } else {
      setWalletError(null);
    }
    if (err) return;

    try{
    const userExists = await userContract.verifyUser(userId, email);
    console.log(userExists);
    if (userExists == true) {
      const keys = generateKeys();
      const seed = keys[0];
      setSeedWords(keys[0].split(" "));
      const privateKey = keys[1];
      const pubKey = keys[2];
      console.log(keys[0], keys[1], keys[2]);
      const encryptedPrivateKey = AES.encrypt(privateKey, password).toString();

      localStorage.setItem("PrivateKey." + email, encryptedPrivateKey);

      console.log(encryptedPrivateKey);
      const hashSeed = crypto.createHash("sha256");
      hashSeed.update(seed);
      const digestSeed = hashSeed.digest("hex");

      const hashPassword = crypto.createHash("sha256");
      hashPassword.update(password);
      const digestPassword = hashPassword.digest("hex");

      const bytes32HashSeed = "0x" + digestSeed.padStart(32, "0");
      const bytes32HashPassword = "0x" + digestPassword.padStart(32, "0");

      const hexPubKey = pubKey.toString(16);
      const paddedHexPubKey = hexPubKey.padStart(64, "0");
      const bytes32PubKey = Buffer.from(paddedHexPubKey, "hex");

      console.log(bytes32HashSeed + "\n" + bytes32HashPassword + "\n" + pubKey);

      await userContract.createUser(userId, name, email, walletAddress, bytes32HashSeed, bytes32HashPassword, bytes32PubKey);
      setShowModal(true);

    } else {
      setShowModalF(true);
    }
  }catch {
    setShowModalF(true);
  }
  }

  async function IsConnected(event) {
    event.preventDefault();

    const tx = await userContract.createUser;
  }
  return (
    <section
      className="vh-80"
      style={{
        backgroundImage: "url('/Background.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        margin: "0",
      }}
    >
    <div>
              <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton style={{ backgroundColor: '#ffcccc', borderTopLeftRadius: '10px', borderTopRightRadius: '10px', borderBottom: 'none' }}>
                  <Modal.Title style={{ fontSize: '24px', color: '#cc0000', fontWeight: 'bold' }}>Your Seed Words</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ backgroundColor: '#ffcccc',  fontWeight: 'bold', fontSize: '18px', padding: '20px', borderTopLeftRadius: '0', borderTopRightRadius: '0' }}>
                <p style={{textAlign: 'center', marginTop: '15px', fontSize: '20px'}}>Your Seed Words</p>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {seedWords.map((word, index) => {
                      if (index % 4 === 0) {
                        // start new line after every 4 words
                        return (
                          <div key={index} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                            <span style={{ margin: '5px', padding: '10px', borderRadius: '5px', border: '2px solid #333', boxShadow: '2px 2px 4px #999', minWidth: '100px', textAlign: 'center', fontSize: '16px' }}>{word}</span>
                            <span style={{ margin: '5px', padding: '10px', borderRadius: '5px', border: '2px solid #333', boxShadow: '2px 2px 4px #999', minWidth: '100px', textAlign: 'center', fontSize: '16px' }}>{seedWords[index + 1]}</span>
                            <span style={{ margin: '5px', padding: '10px', borderRadius: '5px', border: '2px solid #333', boxShadow: '2px 2px 4px #999', minWidth: '100px', textAlign: 'center', fontSize: '16px' }}>{seedWords[index + 2]}</span>
                            <span style={{ margin: '5px', padding: '10px', borderRadius: '5px', border: '2px solid #333', boxShadow: '2px 2px 4px #999', minWidth: '100px', textAlign: 'center', fontSize: '16px' }}>{seedWords[index + 3]}</span>
                          </div>
                        );
                      } else {
                        return null;
                      }
                    })}
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    <p style={{ fontSize: '15px',  color: '#cc0000' }}>IMPORTANT: Please write down and keep these words in a safe and secure place. These words are the only way to recover your account in case of loss or theft of your device or password.</p>
                  </div>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#ffcccc', borderTop: 'none', borderBottomLeftRadius: '5px', borderBottomRightRadius: '5px' }}>
                  <Button variant="secondary" onClick={handleCloseModal}>
                    Close
                  </Button>
                </Modal.Footer>
              </Modal>
                  </div>
                  <div>
                        <Modal show={showModalF} onHide={handleCloseModalF}>
                          <Modal.Body style={{fontWeight: 'bold', fontSize: '18px', padding: '20px', borderTopLeftRadius: '0', borderTopRightRadius: '0', backgroundColor: '#FFCCCC' }}>
                            <h1 style={{ textAlign: 'center', marginTop: '15px', fontSize: '24px', fontWeight: 'bold'}}>Account creation error</h1>
                      
                            <div style={{ marginTop: '20px' }}>
                              <p style={{ fontSize: '15px'}}>There was an error when creating the account, check if you have the required permissions.</p>
                            </div>
                          </Modal.Body>
                          <Modal.Footer style={{borderTop: 'none', borderBottomLeftRadius: '5px', borderBottomRightRadius: '5px', backgroundColor: '#FFCCCC' }}>
                            <Button variant="secondary" onClick={handleCloseModalF} style={{backgroundColor: 'darkred'}}>
                              Close
                            </Button>
                          </Modal.Footer>
                        </Modal>
              </div>

      <div className="container py-5 h-100">
        <div className="row d-flex justify-content-center align-items-center h-100">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div
              className="card bg-white"
              style={{
                borderRadius: "15px",
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div className="card-body p-5 text-center">
                <div className="mb-md-5 mt-md-4 pb-5">
                  <h2 className="fw-bold mb-2 text-uppercase">
                    Create Your Account
                  </h2>
                  <p className="text-black-50 mb-2 mt-3">
                    Please enter the given information from your admin
                  </p>

                  <div className="form-floating mb-3">
                    <label
                      htmlFor="Email"
                      className="text-black"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      Email
                    </label>
                    <input
                      type="text"
                      id="Email"
                      className="form-control form-control-lg"
                      value={email}
                      placeholder=" "
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{
                        borderRadius: "10px",
                        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
                        transition: "all 0.3s ease",
                        background: `url(email.png) no-repeat 10px center / auto 20px`,
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
                    {emailError && <p className="text-danger">{emailError}</p>}
                  </div>

                  <div className="form-floating mb-3">
                    <label
                      htmlFor="Name"
                      className="text-black"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="Name"
                      className="form-control form-control-lg"
                      value={name}
                      placeholder=" "
                      onChange={(e) => setName(e.target.value)}
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
                    {nameError && <p className="text-danger">{nameError}</p>}
                  </div>

                  <div className="form-floating mb-3">
                    <label
                      htmlFor="userId"
                      className="text-black"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      Your ID
                    </label>
                    <input
                      type="text"
                      id="userId"
                      className="form-control form-control-lg"
                      value={userId}
                      placeholder=" "
                      onChange={(e) => setUserId(e.target.value)}
                      required
                      style={{
                        borderRadius: "10px",
                        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
                        background: `url(key.png) no-repeat 10px center / auto 20px`,
                        paddingLeft: "40px",
                      }}
                    />
                    {idError && <p className="text-danger">{idError}</p>}
                  </div>

                  <div className="form-floating mb-3">
                    <label
                      htmlFor="Password"
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
                      onChange={handlePasswordChange}
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
                    {passlenError && (
                      <p className="text-danger">{passlenError}</p>
                    )}
                  </div>

                  <div className="form-floating mb-3">
                    <label
                      htmlFor="CPassword"
                      className="text-black"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="CPassword"
                      className="form-control form-control-lg"
                      value={cpassword}
                      placeholder=" "
                      onChange={handleCPasswordChange}
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
                    {passwordError && (
                      <p className="text-danger">{passwordError}</p>
                    )}
                  </div>
                  {formError && <p className="text-danger">{formError}</p>}

                  <div className="form-floating mb-5">
                    <label
                      htmlFor="walletAddress"
                      className="text-black"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      Wallet Address
                    </label>
                    <input
                      type="text"
                      id="walletAddress"
                      className="form-control form-control-lg"
                      value={walletAddress}
                      placeholder=" "
                      onChange={(e) => setWalletAddress(e.target.value)}
                      readOnly
                      required
                      style={{
                        borderRadius: "10px",
                        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
                        background: `url(wallet.png) no-repeat 10px center / auto 20px`,
                        paddingLeft: "40px",
                      }}
                    />
                    {walletError && (
                      <p className="text-danger">{walletError}</p>
                    )}
                  </div>
                  <button
                    className="btn btn-lg px-5 me-2 mb-3"
                    type="submit"
                    onClick={connectWallet}
                    style={{
                      backgroundColor: "#00D45C",
                      border: "none",
                      color: "#fff",
                      padding: "7px 12px",
                      borderRadius: "10px",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#01BF53")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "#00D45C")
                    }
                  >
                    Get My Wallet Address
                  </button>

                  <button
                    className="btn btn-lg px-5"
                    type="submit"
                    onClick={createUser}
                    style={{
                      backgroundColor: "#FB723F",
                      border: "none",
                      color: "#fff",
                      padding: "10px 20px",
                      borderRadius: "10px",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#F64A0B")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "#FB723F")
                    }
                  >
                    Create Account
                  </button>
                  {isExecuted && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black mt-3"
                    >
                      User Connected successfully. View transaction in
                      Mumbai.polygonscan.
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ConnectWallet;
