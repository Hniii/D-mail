import { ethers } from "ethers";
import { useState, useEffect } from "react";
import ChatContract from '../Chat.sol/Chat.json';
import StructuresContract from '../Structures.sol/Structures.json';
import {contractAddressStructures, contractAddressChat} from "../App"
import { ec } from 'elliptic';
import crypto from 'crypto-browserify';
import axios from "axios";
import { BeatLoader } from 'react-spinners';
const BigNumber = require('bignumber.js');

const curve = new ec('secp256k1');

const ReplyMessage = ( {selectedMessage} ) => {
  const [emailReceiver, setEmailReceiver] = useState("");
  const [fileImg, setFileImg] = useState(null);
  const [body, setBody] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [usersEmails, setUsersEmails] = useState([]);
  const [walletAddressName, setWalletAddressName] = useState("");
  const [isExecuted, setIsExecuted] = useState(false);
  const [link, setLink] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [showCCI, setShowCCI] = useState(false);
  const [datetime, setDatetime] = useState('');
  const [showDatetimeInput, setShowDatetimeInput] = useState(false);
  const [isMessageSent, setIsMessageSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const chatContract = new ethers.Contract(contractAddressChat , ChatContract.abi, signer);
  const userContract = new ethers.Contract(contractAddressStructures , StructuresContract.abi, signer);

  const handleClick = () => {
    setShowCCI(!showCCI);
  };
  
  function encryptMessage(plaintext, pubKey, priKey) {
     const sharedSecret = curve.keyFromPrivate(priKey, 'hex').derive(curve.keyFromPublic(pubKey, 'hex').getPublic()).toString('hex');
     console.log(sharedSecret);
     const message = Buffer.from(plaintext, 'utf8');
     const iv = crypto.randomBytes(16);
     const encryptionKey = sharedSecret.toString('hex').substr(0, 32);
     const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
     const encryptedMessage = Buffer.concat([cipher.update(message), cipher.final()]);
     const ciphertext = Buffer.concat([iv, encryptedMessage]);
     console.log("ciphertext.toString('base64') :" + ciphertext.toString('base64'));
     const hexCipher = ciphertext.toString('base64').toString(16);
     console.log("hexCipher : " + hexCipher);
     return hexCipher;
   };

   async function getRecieverPubKey(address) {
    const pubKeyX = await userContract.getRecieverPubKey(address);
    console.log(pubKeyX);
   // const bytes32PubKeyInverse = Buffer.from(pubKeyX, 'hex');
    //const pubKey = bytes32PubKeyInverse.toString('hex');
    const pubKey = pubKeyX.slice(2);
    return pubKey;
   }


   async function getSenderPriKey(address){
    const email = await userContract.getEmail(address);
    const priKey = sessionStorage.getItem('PrivateKey.'+email);
    return priKey;
   }

  async function getReceiversAddresses(receiver){
    const receiversArray = receiver.split(",");
    const receiversAddresses = [];
    for(let i = 0; i<receiversArray.length; i++){
      const address = await userContract.getAddress(receiversArray[i]);
      receiversAddresses.push(address);
    }
    return receiversAddresses;
   }


  async function replyMessage(event) {
    event.preventDefault();

    if (fileImg) {
      try {

          const formData = new FormData();
          formData.append("file", fileImg);

          console.log("before axios");
          const resFile = await axios({
            method: "post",
            url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
            data: formData,
            headers: {
                'pinata_api_key': '34179c3aab28e71df399',
                'pinata_secret_api_key': '17d8bdffc44b359f48d4b1bddbe2de7c0bb760ac47b2e2e31a98a281cda0e04f',
                "Content-Type": "multipart/form-data"
            },
        });
          console.log(fileImg);
          console.log("after axios");


          const ImgHash = `${resFile.data.IpfsHash}`;
       console.log(ImgHash); 

       setIsLoading(true);
       //console.log(getReceiversAddresses(emailReceiver));
       const accounts = await window.ethereum.request({
         method: "eth_requestAccounts",
       });
       const result = await userContract.getName(accounts[0]);
       setWalletAddressName(result);
       setWalletAddress(accounts[0]);
       const priKey = await getSenderPriKey(accounts[0]);
       console.log("priKey: " + priKey);
       console.log(emailReceiver);
       const receiversArray = getReceiversAddresses(emailReceiver);
       console.log(receiversArray);
     
       var pubKey = "";
       if(selectedMessage.sender.toLowerCase() == accounts[0].toLowerCase()){
           pubKey = await getRecieverPubKey(selectedMessage.receiver);
       }else{
         pubKey = await getRecieverPubKey(selectedMessage.sender);
         setEmailReceiver(getEmail(selectedMessage.receiver));
       }
           console.log(pubKey);
           const encryptedResponse = encryptMessage(body, pubKey, priKey);
           const encryptedSelected = selectedMessage;
           encryptedSelected.message = encryptMessage(encryptedSelected.message, pubKey, priKey);
           encryptedSelected.subject = encryptMessage(encryptedSelected.subject, pubKey, priKey);
           const encryptedFileHash = encryptMessage(`${resFile.data.IpfsHash}`, pubKey, priKey);
           if (datetime == ''){
             const tx = await chatContract.replyTo(encryptedResponse, encryptedFileHash, encryptedSelected, 0);
             //setIsMessageSent(true);
           }else{
             const tx = await chatContract.replyTo(encryptedResponse, encryptedFileHash, encryptedSelected, parseTimestamp(datetime));
           }
           
       setIsLoading(false);
  } catch (error) {
    console.log("Error sending File to IPFS: ")
    console.log(error);
    setIsLoading(false);
  }
}else{
  try {
    setIsLoading(true);
  //console.log(getReceiversAddresses(emailReceiver));
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  const result = await userContract.getName(accounts[0]);
  setWalletAddressName(result);
  setWalletAddress(accounts[0]);
  const priKey = await getSenderPriKey(accounts[0]);
  console.log("priKey: " + priKey);
  console.log(emailReceiver);
  const receiversArray = getReceiversAddresses(emailReceiver);
  console.log(receiversArray);
var pubKey = "";
  if(selectedMessage.sender.toLowerCase() == accounts[0].toLowerCase()){
      pubKey = await getRecieverPubKey(selectedMessage.receiver);
  }else{
    pubKey = await getRecieverPubKey(selectedMessage.sender);
    setEmailReceiver(getEmail(selectedMessage.receiver));
  }
      
      const encryptedResponse = encryptMessage(body, pubKey, priKey);
      const encryptedSelected = selectedMessage;
      console.log(pubKey);

      encryptedSelected.message = encryptMessage(encryptedSelected.message, pubKey, priKey);
      encryptedSelected.subject = encryptMessage(encryptedSelected.subject, pubKey, priKey);
      if (datetime == ''){
        console.log(encryptedResponse);

        const tx = await chatContract.replyTo(encryptedResponse, "",encryptedSelected, 0);
        //setIsMessageSent(true);
      }else{
        const tx = await chatContract.replyTo(encryptedResponse, "", encryptedSelected, parseTimestamp(datetime));
      }
      
  setIsLoading(false);
}catch(error){
  setIsLoading(false);
}
}
  }

  async function getAllUsers() {
    try {
      const allUsers = await userContract.getAllUsers();
  
      // Extract emails from the returned users
      const emails = allUsers.map(user => user.email);
  
      // Return the emails array
      setUsersEmails(emails);
      return emails;
    } catch (error) {
      console.error('Error:', error);
      // Return an empty array or handle the error as needed
      return [];
    }
  }

  const handleSubmitDatetime = () => {
    
    // Reset the datetime value and hide the datetime input
    setDatetime('');
    setShowDatetimeInput(false);
  };

  function parseTimestamp(timestampString) {
    const timestamp = Math.floor(new Date(timestampString).getTime() / 1000); // Convert milliseconds to seconds and round
    return new BigNumber(timestamp).toNumber();
    }

    async function getEmail() {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
        var result = '';
        if(selectedMessage.sender.toLowerCase() == accounts[0].toLowerCase()){
          result = await userContract.getEmail(selectedMessage.receiver);
      }else{
        result = await userContract.getEmail(selectedMessage.sender);
      }
        return result;
      }
      
      useEffect(() => {
        async function fetchEmail() {
          const email = await getEmail();
          setEmailReceiver(email);
        }
        fetchEmail();
      }, [selectedMessage]);
      

  getAllUsers();


  return (
    <div className="card-body p-0 text-center m-2" style={{/*display: isMessageSent ? "none" : "block",*/ position: "fixed", bottom: 0, right: 0, width: "100%", maxWidth: "600px", height: "auto", backgroundColor: "#fff", borderRadius: "10px", boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)", zIndex: "10" }}>
  <div className="card-header bg-dark text-white" style={{borderRadius: "8px 8px 0 0", cursor: "pointer"}} onClick={() => setIsMinimized(!isMinimized)}>
  
  <h5 className="mt-0">Reply to Message</h5>
</div>

<div className="send-message card p-0" style={{height: isMinimized ? "3px" : "auto"}}>
      <form className="send-message card p-3">
        <div className="form-group">
          <label htmlFor="emailReceiver" className="sr-only">
            To:
          </label>
          <input
  type="text"
  className="form-control form-control-lg mb-1"
  id="emailReceiver"
  placeholder="To"
  style={{
    border: "none",
    backgroundColor:
      emailReceiver.length >= 6
        ? emailReceiver
            .split(/[,\s]+/) // Splitting the input by commas or spaces
            .filter((email) => email.trim() !== "") // Filter out empty strings after splitting
            .every((email) => usersEmails.includes(email)) // Checking if every entered email is in the 'emails' array
            ? "#CFF3C1"
            : "#FFCACA"
        : "",
  }}
  value={emailReceiver}
  onChange={(e) => setEmailReceiver(e.target.value)}
  required
  disabled
/>
</div>
        <div className="form-group">
          <label htmlFor="body" className="sr-only">
            Message:
          </label>
          <textarea
            className="form-control mb-1"
            id="body"
            rows="5"
            placeholder="Compose email"
            style={{ border: "none" }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>

        <div className="form-group d-flex justify-content-between align-items-center">
        <div className="btn-group d-flex align-items-center">
          <label htmlFor="upload-button" className="btn btn-secondary btn-sm rounded-end flex-grow-1" style={{
                backgroundColor: "#FB723F",
                marginLeft: "1.4px",
                border: "none",
                color: "#fff",
                borderRadius: "8px 8px 8px 8px",
                transition: "all 0.3s ease",
              }}>
                <input id="upload-button" type="file" onChange={(e) =>setFileImg(e.target.files[0])} style={{display: 'none'}} />
                <img src="add_file.png" alt="send" style={{ pointerEvents: "none", maxWidth: "80%" }} />
          </label>
          
        </div>
          <div className="btn-group d-flex align-items-center">
          <button
      type="button"
      className="btn btn-primary btn-sm rounded-start flex-grow-1"
      style={{
        backgroundColor: "#FB723F",
        border: "none",
        color: "#fff",
        borderRadius: "8px 0 0 8px",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => (e.target.style.backgroundColor = "#F64A0B")}
      onMouseLeave={(e) => (e.target.style.backgroundColor = "#FB723F")}
      onClick={() => setShowDatetimeInput(true)} // Show the datetime input on button click
    >
      <img
        src="timer.png"
        alt="program send"
        style={{ pointerEvents: "none", maxWidth: "100%" }}
      />
    </button>

    {/* Datetime Input */}
    {showDatetimeInput && (
      <div className="d-flex align-items-center ">
  <input
    type="datetime-local"
    className="form-control"
    value={datetime}
    onChange={(e) => setDatetime(e.target.value)}
  />
  <button type="button" className="btn btn-danger" onClick={handleSubmitDatetime}>
    X
  </button>
</div>

    )}
            <button
              type="submit"
              className="btn btn-secondary btn-sm rounded-end flex-grow-1"
              style={{
                backgroundColor: "#FB723F",
                marginLeft: "1.4px",
                border: "none",
                color: "#fff",
                borderRadius: "0 8px 8px 0",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#F64A0B")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#FB723F")}
              onClick={replyMessage}
            >
              <img
                src="send.png"
                alt="send"
                style={{ pointerEvents: "none", maxWidth: "100%" }}
              />
            </button>
            {isLoading && <BeatLoader color="#000000" size={10} />}
          </div>
        </div>
      </form>
      </div>
      {isExecuted && (
        <a href={link} target="_blank" rel="noopener noreferrer">
          View transaction in Mumbai.polygonscan
        </a>
      )}
    </div>
    
  );
};

export default ReplyMessage;
