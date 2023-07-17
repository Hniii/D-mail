import { ethers } from "ethers";
import { useState, useEffect } from "react";
import ChatContract from '../Chat.sol/Chat.json';
import StructuresContract from '../Structures.sol/Structures.json';
import {contractAddressStructures, contractAddressChat, contractAddressOperations} from "../App"
import OperationsContract from '../Operations.sol/Operations.json';
import { ec } from 'elliptic';
import crypto from 'crypto-browserify';
import axios from "axios";
import { BeatLoader } from 'react-spinners';
import  "../assets/shareable.css";
import Inbox from '../pages/Inbox';
const BigNumber = require('bignumber.js');


const curve = new ec('secp256k1');

const SendMessage = (selectedDraft) => {
  var subjectD = "";
  var messageD = "";
  var emailD = "";
  if (selectedDraft !== "") {
    const draft = selectedDraft;
    const msg = draft.selectedDraft;
    subjectD = msg.subject;
    messageD = msg.message;
    emailD = msg.receiversArray;
  }

  const [emailReceiver, setEmailReceiver] = useState(emailD || "");
  const [cci, setCCI] = useState("");
  const [subject, setSubject] = useState(subjectD || "");
  const [fileImg, setFileImg] = useState(null);
  const [body, setBody] = useState(messageD || "");
  const [walletAddress, setWalletAddress] = useState("");
  const [usersEmails, setUsersEmails] = useState([]);
  const [walletAddressName, setWalletAddressName] = useState("");
  const [isExecuted, setIsExecuted] = useState(false);
  const [link, setLink] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [shareable, setShareable]= useState("");
  const [showCCI, setShowCCI] = useState(false);
  const [datetime, setDatetime] = useState('');
  const [showDatetimeInput, setShowDatetimeInput] = useState(false);
  const [isMessageSent, setIsMessageSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sendMessageProp, setSendMessageProp] = useState(false);
  const [showRemoveFile, setShowRemoveFile] = useState(false);

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const chatContract = new ethers.Contract(contractAddressChat , ChatContract.abi, signer);
  const userContract = new ethers.Contract(contractAddressStructures , StructuresContract.abi, signer);
  const opContract = new ethers.Contract(contractAddressOperations , OperationsContract.abi, signer);

  const handleClick = () => {
    setShowCCI(!showCCI);
  };
  
  const handleAddFile = (e) => {
    setFileImg(e.target.files[0]);
    setShowRemoveFile(true);
  };

  const handleRemoveFile = () => {
    setFileImg(null);
    setShowRemoveFile(false);
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
    const pubKey = pubKeyX.slice(2);
    return pubKey;
   }


   async function getSenderPriKey(address){
    const email = await userContract.getEmail(address);
    const priKey = sessionStorage.getItem('PrivateKey.'+email);
    return priKey;
   }

  async function getReceiversAddresses(receiver){
    const receiversArray = receiver.split(/[,\s]+/);
    const receiversAddresses = [];
    for(let i = 0; i<receiversArray.length; i++){
      const address = await userContract.getAddress(receiversArray[i]);
      receiversAddresses.push(address);
    }
    return receiversAddresses;
   }

   async function getRecieversPubKey(addresses) {
    const ReceiversPubKeys = [];
    for (let i = 0; i < addresses.length; i++){
      const pubKeyX = await userContract.getRecieverPubKey(addresses[i]);
    const pubKey = pubKeyX.slice(2);
    ReceiversPubKeys.push(pubKey);
    }
    return ReceiversPubKeys;
   }

   async function setEncryptedMessages(message, pubKeys, priKey){
    const encryptedMessages = [];
    for(let i = 0; i < pubKeys.length; i++){
      const encryptedMessage = encryptMessage(message, pubKeys[i], priKey);
      encryptedMessages.push(encryptedMessage);
    }
    return encryptedMessages;
   }
   
   function concatenate(subjects, messages, filesHashes, subjectsCci, messagesCci, filesHashesCci){
    const messageData = [];
    for(let i = 0 ; i < subjects.length ; i++){
      messageData.push([subjects[i], messages[i], filesHashes[i]].join(" "));
    }
    for(let i = subjects.length ; i < (subjectsCci.length + subjects.length) ; i++){
      console.log(i);
      messageData.push([subjectsCci[i - subjects.length], messagesCci[i - subjects.length], filesHashesCci[i - subjects.length]].join(" "));
    }
    return messageData;
   }

  async function sendMessage(event) {
    event.preventDefault();

    if (fileImg) {
      setIsLoading(true);
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

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const result = await userContract.getName(accounts[0]);
    setWalletAddressName(result);
    setWalletAddress(accounts[0]);
    const address = await userContract.getAddress(emailReceiver);
    const priKey = await getSenderPriKey(accounts[0]);
    const recieverPubKey = await getRecieverPubKey(address);
   /* console.log("Receiver public key : " + recieverPubKey);
    const encryptedMessage = encryptMessage(body, recieverPubKey, priKey);
    console.log("encrypted message : " + encryptedMessage);*/
    const cciReceivers = cci.split(/[,\s]+/);
    const receiversAddresses = await getReceiversAddresses(emailReceiver);
    if(receiversAddresses.length == 1 && cciReceivers.length == 0){
      const pubKey = recieverPubKey;
      const encryptedMessage = encryptMessage(body, pubKey, priKey);
      const encryptedSubject = encryptMessage(subject, pubKey, priKey);
      const encryptedFileHash = encryptMessage(`${resFile.data.IpfsHash}`, pubKey, priKey);
      if (datetime == ''){
        const tx = await chatContract.sendMessage(receiversAddresses[0], encryptedSubject, encryptedMessage, shareable, encryptedFileHash, emailReceiver, 0);
        setIsExecuted(true);
    setLink("https://mumbai.polygonscan.com/tx/" + tx.hash);
    setIsLoading(false);
      }else{
        const tx = await chatContract.sendMessage(receiversAddresses[0], encryptedSubject, encryptedMessage, shareable, encryptedFileHash, emailReceiver, parseTimestamp(datetime));
        setIsExecuted(true);
    setLink("https://mumbai.polygonscan.com/tx/" + tx.hash);
    setIsLoading(false);
      }
    }else{
      const pubKeys = await getRecieversPubKey(receiversAddresses)
      console.log("\n\n\n" + body, pubKeys, priKey);
      const encryptedMessages = await setEncryptedMessages(body, pubKeys, priKey)
      const encryptedSubjects = await setEncryptedMessages(subject, pubKeys, priKey);
      const encryptedHashes = await setEncryptedMessages(`${resFile.data.IpfsHash}`, pubKeys, priKey);
      const messageData = concatenate(encryptedSubjects, encryptedMessages, encryptedHashes, [], [], []);
      if(cci === ""){
        if (datetime == ''){
          console.log(messageData);
        const tx = await chatContract.sendMessageToGroup(receiversAddresses, [], messageData, shareable, emailReceiver, 0);
        setIsExecuted(true);
    setLink("https://mumbai.polygonscan.com/tx/" + tx.hash);
    setIsLoading(false);
        }else{
          console.log(messageData);
          const tx = await chatContract.sendMessageToGroup(receiversAddresses, [], messageData, shareable,  emailReceiver, parseTimestamp(datetime));
          setIsExecuted(true);
    setLink("https://mumbai.polygonscan.com/tx/" + tx.hash);
    setIsLoading(false);
        }
      }
      else{
        const encryptedMessages = await setEncryptedMessages(body, pubKeys, priKey)
      const encryptedSubjects = await setEncryptedMessages(subject, pubKeys, priKey);
      const encryptedHashes = await setEncryptedMessages(`${resFile.data.IpfsHash}`, pubKeys, priKey);
        const cciReceivers = await getReceiversAddresses(cci);
        const pubKeysCci = await getRecieversPubKey(cciReceivers)
      const encryptedMessagesCci = await setEncryptedMessages(body, pubKeysCci, priKey);
      const encryptedSubjectsCci = await setEncryptedMessages(subject, pubKeysCci, priKey);
      const encryptedFilesHashsCci= await setEncryptedMessages(`${resFile.data.IpfsHash}`, pubKeysCci, priKey);
      const messageData = concatenate(encryptedSubjects, encryptedMessages, encryptedHashes, encryptedSubjectsCci, encryptedMessagesCci, encryptedFilesHashsCci);
      if (datetime == ''){
        console.log(messageData);
        const tx = await chatContract.sendMessageToGroup(receiversAddresses, cciReceivers, messageData, shareable, emailReceiver, 0);
        setIsExecuted(true);
        setLink("https://mumbai.polygonscan.com/tx/" + tx.hash);
        setIsLoading(false);
      }else{
        console.log(messageData);
        console.log('ghjklhlm');
        const tx = await chatContract.sendMessageToGroup(receiversAddresses, cciReceivers, messageData, shareable, emailReceiver, parseTimestamp(datetime));
        setIsExecuted(true);
        setLink("https://mumbai.polygonscan.com/tx/" + tx.hash);
        setIsLoading(false);
      }
      }
    }
    
  } catch (error) {
    console.log(error);
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
  const cciReceivers = cci.split(/[,\s]+/);

    const receiversAddresses = await getReceiversAddresses(emailReceiver);
    if(receiversAddresses.length == 1 && cciReceivers.length == 0){
      const pubKey = await getRecieverPubKey(receiversAddresses[0]);
      const encryptedMessage = encryptMessage(body, pubKey, priKey);
      const encryptedSubject = encryptMessage(subject, pubKey, priKey);
      if (datetime == ''){
        const tx = await chatContract.sendMessage(receiversAddresses[0], encryptedSubject, encryptedMessage, shareable, '', emailReceiver, 0);
        //setIsMessageSent(true);
      }else{
        console.log("timestamp : " + parseTimestamp(datetime));

        const tx = await chatContract.sendMessage(receiversAddresses[0], encryptedSubject, encryptedMessage, shareable, '', emailReceiver, parseTimestamp(datetime));
      }
      
    }else{
      const receiversAddresses = await getReceiversAddresses(emailReceiver);
      const pubKeys = await getRecieversPubKey(receiversAddresses);
      //console.log("\n\n\n" + body, pubKeys, priKey);
      const encryptedMessages = await setEncryptedMessages(body, pubKeys, priKey);
      //console.log(encryptedMessages);
      const encryptedSubjects = await setEncryptedMessages(subject, pubKeys, priKey);
      const messageData = concatenate(encryptedSubjects, encryptedMessages, [], [], [], []);
      if(cci === ""){
        if (datetime == ''){
        const tx = await chatContract.sendMessageToGroup(receiversAddresses, [], messageData, shareable, emailReceiver, 0);
        console.log(tx);
        }else{
          const tx = await chatContract.sendMessageToGroup(receiversAddresses, [], messageData, shareable, emailReceiver, parseTimestamp(datetime));
        }
      }
      else{
        const receiversAddresses = await getReceiversAddresses(emailReceiver);
      const pubKeys = await getRecieversPubKey(receiversAddresses);
      //console.log("\n\n\n" + body, pubKeys, priKey);
      const encryptedMessages = await setEncryptedMessages(body, pubKeys, priKey);
      //console.log(encryptedMessages);
      const encryptedSubjects = await setEncryptedMessages(subject, pubKeys, priKey);
        const cciReceivers = await getReceiversAddresses(cci);
        const pubKeysCci = await getRecieversPubKey(cciReceivers);
      const encryptedCCiMessages = await setEncryptedMessages(body, pubKeysCci, priKey);
      const encryptedSubjectsCci =  await setEncryptedMessages(subject, pubKeysCci, priKey)
        const messageData = concatenate(encryptedSubjects, encryptedMessages,[], encryptedSubjectsCci, encryptedCCiMessages, []);
        console.log(messageData);
      if (datetime == ''){
        
                const tx = await chatContract.sendMessageToGroup(receiversAddresses, cciReceivers, messageData, shareable, emailReceiver, 0);
      }else{    
        const tx = await chatContract.sendMessageToGroup(receiversAddresses, cciReceivers, messageData, shareable, emailReceiver, parseTimestamp(datetime));
      }
      }
  }
  setIsLoading(false);
}catch(error){
  console.log('Transaction failed with revert reason:', error);
  setIsLoading(false);
}
}

if(subjectD !== undefined){
  await opContract.deleteDraft(selectedDraft.selectedDraft.id.toString())
}
  }

  async function saveDraft(event){
    const formData = new FormData();
          formData.append("file", fileImg);

          console.log("before axios");
          const resFile = await axios({
            method: "post",
            url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
            data: formData,
            headers: {
                'pinata_api_key': '8e331831d74d6b1a5506',
                'pinata_secret_api_key': "969199b06511acf39a97b54d4e47a21021f22daef928621b04498edc0448515b",
                "Content-Type": "multipart/form-data"
            },
        });
    const address = await userContract.getAddress(emailReceiver);
    const tx = await opContract.saveDraft(subject, body, shareable,[address], emailReceiver ,`${resFile.data.IpfsHash}`);
    console.log(tx.hash);
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
  
    const handleCloseMessage = () => {
      const confirmed = window.confirm("Do you want to save this draft ?");
      if (confirmed) {
        saveDraft();
      }
    };

  getAllUsers();


  return (
    <div className="card-body p-0 text-center m-2" style={{/*display: isMessageSent ? "none" : "block",*/ position: "fixed", bottom: 0, right: 0, width: "100%", maxWidth: "600px", height: "auto", backgroundColor: "#fff", borderRadius: "10px", boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)", zIndex: "10" }}>
  <div className="card-header bg-dark text-white" style={{borderRadius: "8px 8px 0 0", cursor: "pointer"}} onClick={() => setIsMinimized(!isMinimized)}>
  {sendMessageProp && <Inbox sendMessageProp={sendMessageProp} style={{display: 'none'}}/>}
  <span className="closeMessage" onClick={handleCloseMessage}>&times;</span>
  <h5 className="mt-0">New Message</h5>
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
/>
<div onClick={handleClick} style={{ textDecoration: 'underline', cursor: 'pointer' }}>
        CCI
      </div>

      {showCCI && (
<input
  type="text"
  className="form-control form-control-lg mb-1"
  id="cci"
  placeholder="cci"
  style={{
    border: "none",
    backgroundColor:
      cci.length >= 6
        ? cci
            .split(/[,\s]+/) // Splitting the input by commas or spaces
            .filter((email) => email.trim() !== "") // Filter out empty strings after splitting
            .every((email) => usersEmails.includes(email)) // Checking if every entered email is in the 'emails' array
            ? "#CFF3C1"
            : "#FFCACA"
        : "",
  }}
  value={cci}
  onChange={(e) => setCCI(e.target.value)}
  required
/>
      )}
        </div>
        <div className="form-group">
          <label htmlFor="subject" className="sr-only">
            Title:
          </label>
          <input
            type="text"
            className="form-control mb-1"
            id="subject"
            placeholder="Subject"
            style={{ border: "none" }}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
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

        <div className="form-group">
      <label htmlFor="shareable" className="switch-label">
        Is the Message shareable?
      </label>
      <label className="switch">
        <input
          type="checkbox"
          id="shareable"
          checked={shareable}
          onChange={(e) => setShareable(e.target.checked)}
        />
        <span className="slider"></span>
      </label>
      
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
                <input id="upload-button" type="file" onChange={(e) =>handleAddFile(e)} style={{display: 'none'}} />
                <img src="add_file.png" alt="send" style={{ pointerEvents: "none", maxWidth: "80%" }} />
          </label>

          {showRemoveFile ? (
          <div>
                <a href="#" onClick={handleRemoveFile} style={{ fontSize: "14px", color: "#707070", textDecoration: "underline", marginLeft: '10px'}}>
                          Remove file
                </a>
          </div> ) : (<div></div>)}
          
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
              onClick={sendMessage}
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

export default SendMessage;