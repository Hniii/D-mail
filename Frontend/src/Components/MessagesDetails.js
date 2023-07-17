import React, { useState, useEffect } from 'react';
import axios from "axios";
import {contractAddressStructures, contractAddressChat} from "../App"
import ChatContract from '../Chat.sol/Chat.json';
import StructuresContract from '../Structures.sol/Structures.json';
import { ethers } from 'ethers';
import { ec } from 'elliptic';
import crypto from 'crypto-browserify';
import  "../assets/shareable.css";
import  "../assets/SharesList.css";
const curve = new ec('secp256k1');


const MessageDetails = (selectedMessage) => {

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const chatContract = new ethers.Contract(contractAddressChat , ChatContract.abi, signer);
  const userContract = new ethers.Contract(contractAddressStructures , StructuresContract.abi, signer);
  
  const [imageUrl, setImageUrl] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [counter, setCounter]= useState(0);
  const [senderEmail, setSenderEmail]= useState(0);
  const [receiverEmail, setReceiverEmail]= useState(0);
  const [fileHashes, setFileHashes] = useState([]);
  const [rep, setRep] = useState(false);
  const [replies, setReplies] = useState([]);
  const [decryptedSubject, setDecryptedSubject] = useState();
  const [shares, setShares] = useState([]);
  const [senderShares, setSenderShares] = useState({});
  const [receiverShares, setReceiverShares] = useState({});
  const [showViewedbyModal, setShowViewedbyModal] = useState(false);
  const [showShares, setShowShares] = useState(false);
  const [shareList, setShareList] = useState([]);
  const [viewedbyList, setViewedbyList] = useState([]);
  const [buttons, setButtons] = useState(true);
  const [ImgHashes, setImgHashes] = useState([]);
  const [NImgHashes, setNImgHashes] = useState([]);
  const [receiverEmails, setReceiverEmails] = useState("");
  
  var res=null;
  var loaded=false;

  const msg = selectedMessage;
  const msgC = msg.selectedMessage;

  async function getRecieverPubKey(address) {
    const pubKeyX = await userContract.getRecieverPubKey(address);
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


   function decryptMessage(ciphertextt, pubKey, priKey) {
    const sharedSecret = curve.keyFromPrivate(priKey, 'hex').derive(curve.keyFromPublic(pubKey, 'hex').getPublic()).toString('hex');
    const ciphertext = Buffer.from(ciphertextt, 'base64');
    const iv = ciphertext.slice(0, 16);
    const encryptedMessage = ciphertext.slice(16);
    const encryptionKey = sharedSecret.toString('hex').substr(0, 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
    const decryptedMessage = Buffer.concat([decipher.update(encryptedMessage), decipher.final()]);
    const final = decryptedMessage.toString('utf8');
    return final;
  };

async function getSenderEmail(){
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  if(msgC.receiver.toLowerCase() == accounts[0].toLowerCase()){
    setButtons(false);
  }
  const result = await userContract.getEmail(msgC.sender);
  const result1 = await userContract.getEmail(msgC.receiver);
  setSenderEmail(result);
  setReceiverEmail(result1);
  //console.log("sender email is", senderEmail);
}


 /* console.log(msgC.message);
 console.log('file hash from smart contract'+ msgC.fileHash);
 console.log('file timestamp is '+ msgC.timestamp);*/

 useEffect( () => {
  if (counter == 1){
   // console.log("Result changed", res);
  };
  if (counter == 0)
  {
    setCounter(1);
  };

}, [res]);

function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
  const year = date.getFullYear();
  const month = ("0" + (date.getMonth() + 1)).slice(-2); // Add leading zero to month
  const day = ("0" + date.getDate()).slice(-2); // Add leading zero to day
  const hours = ("0" + date.getHours()).slice(-2); // Add leading zero to hours
  const minutes = ("0" + date.getMinutes()).slice(-2); // Add leading zero to minutes
  const seconds = ("0" + date.getSeconds()).slice(-2); // Add leading zero to seconds
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

   //IPFS Receiving Files -------------------------------------------


   function base64ToDataURL(base64Image) {
    return `data:image/jpeg;base64,${base64Image}`;
  }

async function DecryptedReplies(replies){
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  var pubKey = '';
  if(accounts[0].toLowerCase() == msgC.sender.toLowerCase()){
     pubKey = await getRecieverPubKey(msgC.receiver);
  }else{
     pubKey = await getRecieverPubKey(msgC.sender);
  }
   const priKey = await getSenderPriKey(accounts[0]);
   const decryptedReplies = []
   for (let i = 0; i < replies.length; i++) {
    const decrypted = decryptMessage(replies[i], pubKey, priKey)
    decryptedReplies.push(decrypted);
   }
   return decryptedReplies;
}
  
async function getRecieversPubKey(addresses) {
  const ReceiversPubKeys = [];
  for (let i = 0; i < addresses.length; i++) {
    const pubKeyX = await userContract.getRecieverPubKey(addresses[i]);
    const pubKey = pubKeyX.slice(2);
    ReceiversPubKeys.push(pubKey);
  }
  return ReceiversPubKeys;
}

async function getSenderPriKey(address) {
  const email = await userContract.getEmail(address);
  const priKey = sessionStorage.getItem("PrivateKey." + email);
  return priKey;
}

function encryptMessage(plaintext, pubKey, priKey) {
  const sharedSecret = curve
    .keyFromPrivate(priKey, "hex")
    .derive(curve.keyFromPublic(pubKey, "hex").getPublic())
    .toString("hex");
  console.log(sharedSecret);
  const message = Buffer.from(plaintext, "utf8");
  const iv = crypto.randomBytes(16);
  const encryptionKey = sharedSecret.toString("hex").substr(0, 32);
  const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey, iv);
  const encryptedMessage = Buffer.concat([
    cipher.update(message),
    cipher.final(),
  ]);
  const ciphertext = Buffer.concat([iv, encryptedMessage]);
  console.log(
    "ciphertext.toString('base64') :" + ciphertext.toString("base64")
  );
  const hexCipher = ciphertext.toString("base64").toString(16);
  console.log("hexCipher : " + hexCipher);
  return hexCipher;
}

async function setEncryptedMessages(message, pubKeys, priKey) {
  const encryptedMessages = [];
  for (let i = 0; i < pubKeys.length; i++) {
    const encryptedMessage = encryptMessage(message, pubKeys[i], priKey);
    encryptedMessages.push(encryptedMessage);
  }
  return encryptedMessages;
}

const handleShareMessage = async (message) => {
  const recipientEmails = prompt(
    "Please enter the email addresses of the recipients, separated by commas:"
  );
  if (!recipientEmails || !/\S+@\S+\.\S+/.test(recipientEmails)) {
    alert("Please enter valid email addresses.");
    return;
  }
  //console.log(`message:`, { message });
  const newshare = {
    id: message.id,
    timestamp: Date.now(),
    sender: message.receiver,
    receiver: recipientEmails,
    read: false,
  };
  //console.log(`share:`, { newshare });

  setShares([...shares, newshare]);
  const recipientAddresses = recipientEmails
    .split(",")
    .map((email) => userContract.getAddress(email));
  const pubKeys = await getRecieversPubKey(recipientAddresses);
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  const priKey = await getSenderPriKey(accounts[0]);
  //console.log("\n\n\n" + body, pubKeys, priKey);
  const encryptedMessages = await setEncryptedMessages(
    message.message,
    pubKeys,
    priKey
  );
  console.log(message.id, encryptedMessages, recipientAddresses);
  const tx = await chatContract.shareMessage(
    message.id,
    encryptedMessages,
    recipientAddresses,
    recipientEmails
  );
  const recipientNames = recipientEmails.split(",").join(", ");
  console.log(
    `Message ${message.id} shared with recipients ${recipientNames}. Transaction hash: ${tx.transactionHash}`
  );
  alert(
    `Message "${message.subject}" shared with recipients ${recipientNames}.`
  );
};

 useEffect(() => {

  getSenderEmail();
getFileFromIPFS();

  }, []);

  const getReplies = async () => {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
  
      var pubKey = '';
      if (accounts[0].toLowerCase() == msgC.sender.toLowerCase()) {
        pubKey = await getRecieverPubKey(msgC.receiver);
      } else {
        pubKey = await getRecieverPubKey(msgC.sender);
      }
      const priKey = await getSenderPriKey(accounts[0]);
      const replies = await chatContract.getReplies(msgC.id);
      const encryptedMessages = replies.responses.map((message) => message.message);
      const senders = replies.responses.map((message) => message.sender);
      const receivers = replies.responses.map((message) => message.receiver);
      const filesHashs = replies.responses.map((message) => message.fileHash);
      var sendersEmails = [];
      var receiversEmails = [];
      var filesHashes = [];
      for (let i = 0; i < filesHashs.length; i++) {
        if (filesHashs[i] == "") {
          filesHashes.push("");
        } else {
          filesHashes.push(decryptMessage(filesHashs[i], pubKey, priKey));
        }
      }
      var imgs = [];
      var files = [];
      for (let i = 0; i < filesHashes.length; i++) { // Update the loop variable to filesHashes.length
        if (filesHashes[i] !== "") { // Check against filesHashes, not fileHashes
          const res = await axios({
            method: 'get',
            url: `https://gateway.pinata.cloud/ipfs/` + filesHashes[i], // Use filesHashes[i], not fileHashes[i]
            responseType: 'blob',
          });
          const contentType = res.headers['content-type'];
          if (contentType && contentType.startsWith('image/')) {
            // If the file is an image, display it
            const imgUrl = URL.createObjectURL(res.data);
            imgs.push(imgUrl);
            files.push("");
          } else {
            // For other file types, display a download link
            const fileUrl = URL.createObjectURL(res.data);
            imgs.push("");
            files.push(fileUrl);
          }
        } else {
          imgs.push("");
          files.push("");
        }
      }
  
      setImgHashes(imgs);
      setNImgHashes(files);
  
      for (let i = 0; i < senders.length; i++) {
        const senderEmail = await userContract.getEmail(senders[i]);
        const receiverEmail = await userContract.getEmail(receivers[i]);
        sendersEmails.push(senderEmail);
        receiversEmails.push(receiverEmail);
      }
      const timestamps = replies.responses.map((message) => formatTimestamp(message.timestamp.toNumber()));
  
      const decryptedReplies = await DecryptedReplies(encryptedMessages);
      const repliesArray = decryptedReplies.map((message, index) => {
        return {
          message: message,
          sender: sendersEmails[index],
          receiver: receiversEmails[index],
          fileHash: filesHashes[index],
          timestamp: timestamps[index],
        };
      });
      setReplies(repliesArray);
  
    } catch (error) {
      console.log(error);
    }
  }
  

  getReplies();

  const getFileFromIPFS = async (hash) => {
    await getEmail(msgC.receiver);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      var pubKey = '';
      if(accounts[0].toLowerCase() == msgC.sender.toLowerCase()){
         pubKey = await getRecieverPubKey(msgC.receiver);
      }else{
         pubKey = await getRecieverPubKey(msgC.sender);
      }
      //const pubKey = await getRecieverPubKey(msgC.receiver);
      console.log(pubKey);
       const priKey = await getSenderPriKey(accounts[0]);
       setDecryptedSubject(msgC.subject);
      
       const decryptedFileHash = decryptMessage(msgC.fileHash, pubKey, priKey);
       console.log(`https://gateway.pinata.cloud/ipfs/`+ decryptedFileHash);
      const res = await axios({
        method: 'get',
        url: `https://gateway.pinata.cloud/ipfs/`+ decryptedFileHash,
        responseType: 'blob',
      });
  
      console.log('File retrieved from IPFS:', res.data);
  
      // Determine the file type based on the content type header
      const contentType = res.headers['content-type'];
      if (contentType && contentType.startsWith('image/')) {
        // If the file is an image, display it
        const imgUrl = URL.createObjectURL(res.data);
        setImageUrl(imgUrl);
        console.log(imageUrl);
        setFileUrl(null);
      } else {
        // For other file types, display a download link
        const fileUrl = URL.createObjectURL(res.data);
        console.log(fileUrl);
        setFileUrl(fileUrl);
        setImageUrl(null);
      }

    } catch (error) {
      console.log('Error retrieving file from IPFS:', error);
    }
  };
  async function handleShare(message) {
    const shareList = await chatContract.getShares(message.id);
    console.log(shareList);
    if(shareList.length > 0){
      setShowShares(true);
    setShareList(shareList);
    }
  }

  async function getEmail(address){
    const email = await userContract.getEmail(address);
    setReceiverEmails(email);
    return email;
  }

  async function handleView(message) {
    const viewedby = await chatContract.getViewedBy(message.id);
    var viewed = [];
    for (let i = 0 ; i < viewedby.length ; i++){
      const vu = await userContract.getEmail(viewedby[i]);
      viewed.push(vu);
    }
    console.log(viewed);
    setShowViewedbyModal(true);
    setViewedbyList(viewed);
  }
  return (
    <div>
      <br />
      <h2 style={{maxWidth: "80%"}}>{decryptedSubject}</h2>
    
      <div className="buttons-container" style={{ marginLeft: -12 }}>
  {buttons && (
    <>
      <button className="btn btn-outline-info" onClick={() => handleShare(msgC)}>Shares</button>
      {showShares && (
        <div className="popup">
          {shareList.length > 0 && (
            <div className="share-content">
              <span className="close" onClick={() => setShowShares(false)}>
                &times;
              </span>
              <h2>Shared with:</h2>
              <ul className="list-group">
                {shareList.map((share, index) => (
                  <li key={index} className="list-group-item">
                    <strong>{senderShares[share.sender]}</strong> shared with{" "}
                    <strong>{receiverShares[share.receiver]}</strong> at{" "}
                    <strong>
                      {formatTimestamp(share.timestamp.toNumber())}
                    </strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button className="btn btn-outline-info" onClick={() => handleView(msgC)}>Views</button>
      {showViewedbyModal && (
        <div className="popup">
          <div className="view-content">
            <span className="close" onClick={() => setShowViewedbyModal(false)}>
              &times;
            </span>
            <h2>Viewed By:</h2>
            <ul className="list-group">
              {viewedbyList.map((viewer, index) => (
                <li key={index} className="list-group-item">
                  {viewer}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )}
</div>

      <hr />
      {replies.length === 0 ? (
  <div>
  <h5>
        <b>From: </b>
        {senderEmail}
      </h5>
      <h5>
        <b>To: </b>
        {msgC.receiversGroup === ""
                                  ? receiverEmails
                                  : msgC.receiversGroup}
      </h5>
      <h5>
        <b>Sent on: </b>
        {formatTimestamp(msgC.timestamp)}
      </h5>
      <p style={{maxWidth: "80%"}}>{msgC.message}</p>
      <div>
      {imageUrl &&  <a href={imageUrl}download><img src={imageUrl} alt="Retrieved file" width={800}/></a>}
            {fileUrl && <a href={fileUrl} download>Download file</a>}
      </div>
      <hr/>
  </div>
) : (
  replies.map((msgC, index) => (
    <div key={index}>

      <h5>
        <b>From: </b>
        {msgC.sender}
      </h5>
      <h5>
        <b>To: </b>
        {msgC.receiver}
      </h5>
      <h5>
        <b>Sent on: </b>
        {msgC.timestamp}
      </h5>
      <p style={{maxWidth: "80%"}}>{msgC.message}</p>
      <div>
      {ImgHashes[index] &&  <a href={ImgHashes[index]}download><img src={ImgHashes[index]} alt="Retrieved file" width={400}/></a>}
            {NImgHashes[index] && <a href={NImgHashes[index]} download>Download file</a>}
      </div>
      <hr/>

    </div>
  ))
)}

    </div>
  );
};

export default MessageDetails;