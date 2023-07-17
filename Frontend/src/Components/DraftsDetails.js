import { ethers } from "ethers";
import { useState } from "react";
import ChatContract from "../Chat.sol/Chat.json";
import axios from "axios";
import  "../assets/shareable.css";

import React from 'react';
import { Drafts, Home } from '@mui/icons-material';

import { contractAddressChat } from "../App";





const DraftDetails = (selectedDraft) => {
    const draft = selectedDraft;
    const msg = draft.selectedDraft;

  const [fileImg, setFileImg] = useState(null);
  const [receiverEmails, setReceiverEmails] = useState({});
  const [id, setmessageid] = useState("");
  const [receiver, setreceiver] = useState("");
  const [emailReceiver, setEmailReceiver] = useState("");
  const [subject, setSubject] = useState("");
  const [buffer, setBuffer] = useState("");
  const [attachment, setAttachment] = useState("");
  const [receiverName, setreceiverName] = useState("");
  const [body, setBody] = useState("");
  const [shareable, setShareable]= useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletAddressName, setWalletAddressName] = useState("");
  const [isExecuted, setIsExecuted] = useState(false);
  const [link, setLink] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  
  const contractAddress = contractAddressChat;
  const signer = provider.getSigner();
  const chatContract = new ethers.Contract(
    contractAddress,
    ChatContract.abi,
    signer
  );
  async function handleClick(event) {
    event.preventDefault();
  
    try {
      let fileHashToSend = msg.fileHash; // Default to the draft's file hash
      if (fileImg) {
        const formData = new FormData();
        formData.append("file", fileImg);
  
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
        const imgHash = resFile.data.IpfsHash;
        console.log("file hash:", imgHash);
        fileHashToSend = imgHash; 
      }
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const result = await chatContract.getName(accounts[0]);
      setWalletAddressName(result);
      setWalletAddress(accounts[0]);
      const address = await chatContract.getAddress(emailReceiver);
      const subjectToSend = subject || msg.subject;
      const messageToSend = body || msg.message;
      const shareableToSend = shareable || msg.shareable;
      const addressToSend = msg.receivers[0] || emailReceiver;
      const txPromises = [
        chatContract.sendMessage([addressToSend], subjectToSend, messageToSend, shareableToSend, fileHashToSend),
        chatContract.deleteDraft(msg.id.toString())
      ];
      try {
        const [tx1, tx2] = await Promise.all(txPromises);
      } catch (error) {
        console.error('Error executing transactions:', error);
      }
      setIsExecuted(true);
    } catch (error) {
      console.log("Error sending File to IPFS: ");
      console.log(error);
    }
  }
  
  async function handleDraft(event){
      let fileHashToSend = msg.fileHash; // Default to the draft's file hash
      if (fileImg) {
        const formData = new FormData();
        formData.append("file", fileImg);
  
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
        const imgHash = resFile.data.IpfsHash;
        console.log("file hash:", imgHash);
        fileHashToSend = imgHash; 
      }
      const subjectToSend = subject || msg.subject;
      const messageToSend = body || msg.message;
      const shareableToSend = shareable || msg.shareable;
      console.log("id msg a supprimer", msg.id.toString());
      console.log("subject:", subjectToSend)
      console.log("message:", messageToSend)
      console.log("shareable:", shareableToSend)
      console.log("hash file:", fileHashToSend)
      const addressToSend = msg.receivers[0] || emailReceiver;
    const address = await chatContract.getAddress(emailReceiver);
    const txPromises = [
      await chatContract.saveDraft(subjectToSend, messageToSend, shareableToSend,[addressToSend] ,fileHashToSend),
       await chatContract.deleteDraft(msg.id.toString())
    ];
    try {
      const [tx1,tx2] = await Promise.all(txPromises);
    } catch (error) {
      console.error('Error executing transactions:', error);
    }
    setIsExecuted(true);
  }
  


  return (
    <div className="card-body p-0 text-center m-2" style={{ position: "fixed", bottom: 0, right: 0, width: "100%", maxWidth: "600px", height: "auto", backgroundColor: "#fff", borderRadius: "10px", boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)", zIndex: "10" }}>
  <div className="card-header bg-dark text-white" style={{borderRadius: "8px 8px 0 0", cursor: "pointer"}} onClick={() => setIsMinimized(!isMinimized)}>
  <span className="closeMessage" onClick={handleDraft}>&times;</span>
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
            style={{ border: "none" }}
            value={msg.receiversArray || emailReceiver}
            onChange={(e) => setEmailReceiver(e.target.value)}
            required
          />
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
            value={subject || msg.subject}
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
            value={body || msg.message}
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
          checked={shareable || msg.shareable }
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
                <input id="upload-button" type="file"  onChange={(e) =>setFileImg(e.target.files[0])} style={{display: 'none'}}  />
                <img src="add_file.png" alt="send" style={{ pointerEvents: "none", maxWidth: "80%" }} />
          </label>
          
        </div>

 
          <div className="btn-group d-flex align-items-center">


            <button
              type="submit"
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
            >
              <img
                src="timer.png"
                alt="program send"
                style={{ pointerEvents: "none", maxWidth: "100%" }}
              />
            </button>
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
              onClick={handleClick}
            >
              <img
                src="send.png"
                alt="send"
                style={{ pointerEvents: "none", maxWidth: "100%" }}
              />
            </button>
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

export default DraftDetails;