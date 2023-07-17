import React, { useState, useEffect } from "react";
import MessageDetails from "./MessagesDetails";
import SendMessage from "./SendMessage";
import { ethers } from "ethers";
import ChatContract from "../Chat.sol/Chat.json";
import StructuresContract from "../Structures.sol/Structures.json";
import OperationsContract from "../Operations.sol/Operations.json";
import { BsArrowLeft } from "react-icons/bs";
import { BsReplyFill } from "react-icons/bs";
import { BsBoxArrowUpRight } from "react-icons/bs";
import { BsTrashFill } from "react-icons/bs";
import "../assets/Inbox.css";
import "../assets/SharesList.css";
import { ec } from "elliptic";
import crypto from "crypto-browserify";
import {
  contractAddressStructures,
  contractAddressChat,
  contractAddressOperations,
} from "../App";
import ReplyMessage from "../Components/ReplyMessage";
const curve = new ec("secp256k1");

const Messages = ( props ) => {
  const { selectedButton, searchAddress } = props;

  const [messages, setMessages] = useState([]);
  const [Email, setEmail] = useState("");
  const [Name, setName] = useState("");
  const [senderEmails, setSenderEmails] = useState({});
  const [receiverEmails, setReceiverEmails] = useState({});
  const [shares, setShares] = useState([]);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [showMessage, setShowMessage] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState({});
  const [counter, setCounter] = useState(0);
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [showReplyMessage, setShowReplyMessage] = useState(false);
  const [drafts, setDrafts] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState({});
  const [showDraft, setShowDraft] = useState(false);
  const [share, setShare] = useState({});
  const [shareable, setShareable] = useState(true);

  //var counter=0;
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
  const opContract = new ethers.Contract(
    contractAddressOperations,
    OperationsContract.abi,
    signer
  );

  //setMessages(filteredMessages);

  const backToMessages = () => {
    console.log("going back");
    setShowMessage(false);
    setCounter(0);
    setSelectedMessage({});
  };

  async function handleSelectedMessage(message) {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setShare(message);
    setSelectedMessage(message);
    setShareable(message.shareable);
    console.log(message.id);
    console.log(accounts[0], message.receiver);
    if (
      message.read == false &&
      accounts[0].toLowerCase() == message.receiver.toLowerCase()
    ) {
      const tx = await chatContract.viewMessage(message.id);
    }
  }


  const handleToggleReplyMessage = () => {
    setShowReplyMessage(!showReplyMessage);
  };

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

  const handleShareMessage = async () => {
    const recipientEmails = prompt(
      "Please enter the email addresses of the recipients, separated by commas:"
    );
    if (!recipientEmails || !/\S+@\S+\.\S+/.test(recipientEmails)) {
      alert("Please enter valid email addresses.");
      return;
    }
    console.log(`message:`, { share });
    const newshare = {
      id: share.id,
      timestamp: Date.now(),
      sender: share.receiver,
      receiver: recipientEmails,
      read: false,
    };
    console.log(`share:`, { newshare });

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
    console.log(share.message, pubKeys, priKey);
    const encryptedMessages = await setEncryptedMessages(
      share.message,
      pubKeys,
      priKey
    );
    const encryptedSubjects =  await setEncryptedMessages(
      share.subject,
      pubKeys,
      priKey
    );
    const encryptedFilesHashes =  await setEncryptedMessages(
      share.fileHash,
      pubKeys,
      priKey
    );
    console.log(share.id, encryptedMessages, recipientAddresses, recipientEmails);
    const tx = await chatContract.shareMessage(
      share.id,
      encryptedSubjects,
      encryptedMessages,
      encryptedFilesHashes,
      recipientAddresses,
      recipientEmails
    );
    const recipientNames = recipientEmails.split(",").join(", ");
    console.log(
      `Message ${share.id} shared with recipients ${recipientNames}. Transaction hash: ${tx.transactionHash}`
    );
    alert(
      `Message "${share.subject}" shared with recipients ${recipientNames}.`
    );
  };

  async function DeleteMessage(message) {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const address = accounts[0];
    console.log("current user is: ", address);
    const tx = await chatContract.deleteMessage(address, message.id);
    console.log(tx.hash);
    return tx;
  }
  const handleDeleteMessage = (message) => {
    console.log("message is: ", message);
    console.log("message id is: ", message.id);
    //setDeletedMessage(message);
    DeleteMessage(message);
  };

  async function getRecieverPubKey(address) {
    const pubKeyX = await userContract.getRecieverPubKey(address);
    // const bytes32PubKeyInverse = Buffer.from(pubKeyX, 'hex');
    //const pubKey = bytes32PubKeyInverse.toString('hex');
    const pubKey = pubKeyX.slice(2);
    return pubKey;
  }

  async function getSenderPriKey(address) {
    const email = await userContract.getEmail(address);
    const priKey = sessionStorage.getItem("PrivateKey." + email);
    return priKey;
  }

  function decryptMessage(ciphertextt, pubKey, priKey) {
    const sharedSecret = curve
      .keyFromPrivate(priKey, "hex")
      .derive(curve.keyFromPublic(pubKey, "hex").getPublic())
      .toString("hex");
    const ciphertext = Buffer.from(ciphertextt, "base64");
    const iv = ciphertext.slice(0, 16);
    const encryptedMessage = ciphertext.slice(16);
    const encryptionKey = sharedSecret.toString("hex").substr(0, 32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", encryptionKey, iv);
    const decryptedMessage = Buffer.concat([
      decipher.update(encryptedMessage),
      decipher.final(),
    ]);
    const final = decryptedMessage.toString("utf8");
    return final;
  }

  useEffect(() => {
    if (counter == 1) {
      setShowMessage(true);
      //console.log("Selected Message", selectedMessage);
    }
    if (counter == 0) {
      setCounter(1);
    }
  }, [selectedMessage]);

  async function getInboxMessages() {
    setDrafts(false);
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const result = await userContract.getEmail(accounts[0]);
    setEmail(result);
    const result2 = await userContract.getName(accounts[0]);
    setName(result2);

    const MyPriKey = await getSenderPriKey(accounts[0]);

    const messagesReceived = await opContract.MessageReceived(result);
    const DecryptedMessagesReceived = [];

    for (let i = 0; i < messagesReceived.length; i++) {
      if (messagesReceived[i].timestamp <= Math.floor(Date.now() / 1000)) {
        const pubKeyS = await getRecieverPubKey(messagesReceived[i].sender);
        const decryptedMessage = decryptMessage(
          messagesReceived[i].message,
          pubKeyS,
          MyPriKey
        );
        
        const decryptedSubject = decryptMessage(messagesReceived[i].subject, pubKeyS, MyPriKey);
        const newMessage = {
          ...messagesReceived[i],
          message: decryptedMessage,
          subject: decryptedSubject
        };
        DecryptedMessagesReceived.push(newMessage);
      }
    }

    const keepUniqueMessages = (messages) => {
      const uniqueMessages = [];
      for (const message of messages) {
        if (
          !uniqueMessages.some((otherMessage) => {
            return (
              formatTimestamp(message.timestamp) ===
                formatTimestamp(otherMessage.timestamp) &&
              message.sender === otherMessage.sender &&
              message.receivers_group === otherMessage.receivers_group
            );
          })
        ) {
          uniqueMessages.push(message);
        }
      }
      return uniqueMessages;
    };

    const allMessages = [...keepUniqueMessages(DecryptedMessagesReceived)];
    allMessages.sort((a, b) => b.timestamp - a.timestamp);
    console.log(allMessages);
    setMessages(allMessages);

    const senderEmails = {};
    const receiverEmails = {};
    allMessages.forEach((message) => {
      if (!(message.sender in senderEmails)) {
        getEmail(message.sender).then((email) =>
          setSenderEmails((prevState) => ({
            ...prevState,
            [message.sender]: email,
          }))
        );
      }
      if (!(message.receiver in receiverEmails)) {
        getEmail(message.receiver).then((email) =>
          setReceiverEmails((prevState) => ({
            ...prevState,
            [message.receiver]: email,
          }))
        );
      }
    });
  }

  async function getSentMessages() {
    setDrafts(false);

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const result = await userContract.getEmail(accounts[0]);
    setEmail(result);
    const result2 = await userContract.getName(accounts[0]);
    setName(result2);

    const MyPriKey = await getSenderPriKey(accounts[0]);

    const messagesSent = await opContract.MessageSent(result);
    console.log(messagesSent);
    const DecryptedMessagesSent = [];

    for (let i = 0; i < messagesSent.length; i++) {
      if (messagesSent[i].timestamp <= Math.floor(Date.now() / 1000)) {
        const pubKeyR = await getRecieverPubKey(messagesSent[i].receiver);
        const decryptedMessage = decryptMessage(
          messagesSent[i].message,
          pubKeyR,
          MyPriKey
        );
        const decryptedSubject = decryptMessage(messagesSent[i].subject, pubKeyR, MyPriKey);
        const newMessage = {
          ...messagesSent[i],
          message: decryptedMessage,
          subject: decryptedSubject
        };
        DecryptedMessagesSent.push(newMessage);
      }
      
    }

    const keepUniqueMessages = (messages) => {
      const uniqueMessages = [];
      for (const message of messages) {
        if (
          !uniqueMessages.some((otherMessage) => {
            return (
              formatTimestamp(message.timestamp) ===
                formatTimestamp(otherMessage.timestamp) &&
              message.sender === otherMessage.sender &&
              message.receivers_group === otherMessage.receivers_group
            );
          })
        ) {
          uniqueMessages.push(message);
        }
      }
      return uniqueMessages;
    };


    const uniqueMessagesArray = keepUniqueMessages(DecryptedMessagesSent);
    for(let i = 0 ; i < DecryptedMessagesSent.length ; i++){
      console.log(DecryptedMessagesSent[i].receiversGroup);
      if(DecryptedMessagesSent[i].receiversGroup == ""  ){
        for (let j = 0 ; j < uniqueMessagesArray.length ; j++){
          if( formatTimestamp(DecryptedMessagesSent[i].timestamp) ===  formatTimestamp(uniqueMessagesArray[j].timestamp)){
            console.log(DecryptedMessagesSent[i].receiver);
            const email = await getEmail(DecryptedMessagesSent[i].receiver);
            uniqueMessagesArray[j].receiversGroup = uniqueMessagesArray[j].receiversGroup + ", CCI: " + email;
          }
        }
      }
    }

    const allMessages = [...uniqueMessagesArray];
    allMessages.sort((a, b) => b.timestamp - a.timestamp);
    setMessages(allMessages);

    const senderEmails = {};
    const receiverEmails = {};
    allMessages.forEach((message) => {
      if (!(message.sender in senderEmails)) {
        getEmail(message.sender).then((email) =>
          setSenderEmails((prevState) => ({
            ...prevState,
            [message.sender]: email,
          }))
        );
      }
      if (!(message.receiver in receiverEmails)) {
        getEmail(message.receiver).then((email) =>
          setReceiverEmails((prevState) => ({
            ...prevState,
            [message.receiver]: email,
          }))
        );
      }
    });
  }

  async function getProgrammedMessages() {
    setDrafts(false);
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const result = await userContract.getEmail(accounts[0]);
    setEmail(result);
    const result2 = await userContract.getName(accounts[0]);
    setName(result2);

    const MyPriKey = await getSenderPriKey(accounts[0]);

    const messagesSent = await opContract.MessageSent(result);
    const DecryptedMessagesSent = [];

    for (let i = 0; i < messagesSent.length; i++) {
      if (messagesSent[i].timestamp > Math.floor(Date.now() / 1000)) {
        const pubKeyS = await getRecieverPubKey(messagesSent[i].receiver);
        const decryptedMessage = decryptMessage(
          messagesSent[i].message,
          pubKeyS,
          MyPriKey
        );
        const decryptedSubject = decryptMessage(
          messagesSent[i].subject,
          pubKeyS,
          MyPriKey
        );
        const newMessage = {
          ...messagesSent[i],
          message: decryptedMessage,
          subject: decryptedSubject,
        };
        DecryptedMessagesSent.push(newMessage);
      }
    }

    const keepUniqueMessages = (messages) => {
      const uniqueMessages = [];
      for (const message of messages) {
        if (
          !uniqueMessages.some((otherMessage) => {
            return (
              formatTimestamp(message.timestamp) ===
                formatTimestamp(otherMessage.timestamp) &&
              message.sender === otherMessage.sender &&
              message.receivers_group === otherMessage.receivers_group
            );
          })
        ) {
          uniqueMessages.push(message);
        }
      }
      return uniqueMessages;
    };

    const allMessages = [...keepUniqueMessages(DecryptedMessagesSent)];
    allMessages.sort((a, b) => b.timestamp - a.timestamp);
    setMessages(allMessages);

    const senderEmails = {};
    const receiverEmails = {};
    allMessages.forEach((message) => {
      if (!(message.sender in senderEmails)) {
        getEmail(message.sender).then((email) =>
          setSenderEmails((prevState) => ({
            ...prevState,
            [message.sender]: email,
          }))
        );
      }
      if (!(message.receiver in receiverEmails)) {
        getEmail(message.receiver).then((email) =>
          setReceiverEmails((prevState) => ({
            ...prevState,
            [message.receiver]: email,
          }))
        );
      }
    });
  }

  async function getDraftsMessages() {
    setDrafts(true);
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const result = await userContract.getEmail(accounts[0]);
    setEmail(result);
    const result2 = await userContract.getName(accounts[0]);
    setName(result2);

    const MyPriKey = await getSenderPriKey(accounts[0]);
    console.log(result);
    const draftsMessages = await opContract.getDrafts(result);
    console.log(draftsMessages);

    const allMessages = draftsMessages;
    //allMessages.sort((a, b) => b.timestamp - a.timestamp);
    setMessages(draftsMessages);

    allMessages.forEach((message) => {
      console.log(message.sender);
      if (!(message.sender in senderEmails)) {
        getEmail(message.sender).then((email) =>
          setSenderEmails((prevState) => ({
            ...prevState,
            [message.sender]: email,
          }))
        );
      }
    });
  }
 
  useEffect(() => {
    // Fetch messages based on the selectedButton
    if (searchAddress === "") {
      fetchMessages(selectedButton);
    }
  }, [selectedButton]);
  
  useEffect(() => {
    // Filter messages based on the searchAddress
    if (searchAddress !== "") {
      const filteredMessages = messages.filter((message) => {
        const sender = senderEmails[message.sender];
        const receiver = receiverEmails[message.receiver];
        return sender === searchAddress || receiver === searchAddress;
      });
      setMessages(filteredMessages);
    } 
  }, [searchAddress, messages]);
  

  const fetchMessages = (buttonTitle) => {
    if (buttonTitle === "Inbox") {
      getInboxMessages();
    } else if (buttonTitle === "Sent") {
      getSentMessages();
    } else if (buttonTitle === "Programmed") {
      getProgrammedMessages();
    } else if (buttonTitle === "Drafts") {
      getDraftsMessages();
    }
  };

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

  async function getEmail(adresse) {
    const result = await userContract.getEmail(adresse);
    return result;
  }

  async function handleSelectedDraft(draft) {
    setSelectedDraft(draft);
    console.log("id:", draft.id.toString());
    setShowDraft(true);
  }

  useEffect(() => {
    //getName();

    // Lock horizontal scroll
    document.body.style.overflowX = "hidden";
    // Clean up on unmount
    return () => {
      document.body.style.overflowX = "auto";
    };
  }, []);

  return (
    <div className="col-md-12" style={{ marginTop: "-80px", marginLeft: 250 }}>
    { showDraft && (
        <SendMessage selectedDraft={selectedDraft} />
       ) }
      {Email && (
        <div>
          {showMessage && (
            <span>
              <button
                className="btn btn-primary btn-orange"
                style={{
                  backgroundColor: "white",
                  color: "#FB723F",
                  borderRadius: "30px",
                  border: "2px solid #FB723F",
                  margin: "0 1rem",
                  fontSize: "1.1em",
                }}
                onMouseEnter={(e) => (
                  (e.target.style.backgroundColor = "#F64A0B"),
                  (e.target.style.color = "white")
                )}
                onMouseLeave={(e) => (
                  (e.target.style.backgroundColor = "white"),
                  (e.target.style.color = "#F64A0B")
                )}
                onClick={backToMessages}
              >
                <BsArrowLeft className="w-10 h-10 mr-2" />
                Back
              </button>
              <button
                className="btn btn-primary btn-orange"
                style={{
                  backgroundColor: "white",
                  color: "gray",
                  borderRadius: "30px",
                  border: "2px solid gray",
                  margin: "0 1rem",
                  fontSize: "1.1em",
                }}
                onMouseEnter={(e) => (
                  (e.target.style.backgroundColor = "gray"),
                  (e.target.style.color = "white")
                )}
                onMouseLeave={(e) => (
                  (e.target.style.backgroundColor = "white"),
                  (e.target.style.color = "gray")
                )}
                onClick={handleToggleReplyMessage}
              >
                <BsReplyFill className="w-10 h-10 mr-2" />
                Reply
              </button>
             { shareable &&
             <>
              <button
                className="btn btn-primary btn-orange"
                style={{
                  backgroundColor: "white",
                  color: "gray",
                  borderRadius: "30px",
                  border: "2px solid gray",
                  margin: "0 1rem",
                  fontSize: "1.1em",
                }}
                onMouseEnter={(e) => (
                  (e.target.style.backgroundColor = "gray"),
                  (e.target.style.color = "white")
                )}
                onMouseLeave={(e) => (
                  (e.target.style.backgroundColor = "white"),
                  (e.target.style.color = "gray")
                )}
                onClick={() => handleShareMessage()}
              >
                <BsBoxArrowUpRight className="w-10 h-10 mr-2" />
                Forward
              </button>
              </>
             }
              <button
                className="btn btn-primary btn-orange"
                style={{
                  backgroundColor: "white",
                  color: "gray",
                  borderRadius: "30px",
                  border: "2px solid gray",
                  margin: "0 1rem",
                  fontSize: "1.1em",
                }}
                onMouseEnter={(e) => (
                  (e.target.style.backgroundColor = "gray"),
                  (e.target.style.color = "white")
                )}
                onMouseLeave={(e) => (
                  (e.target.style.backgroundColor = "white"),
                  (e.target.style.color = "gray")
                )}
                onClick={() => handleDeleteMessage(selectedMessage)}
              >
                <BsTrashFill className="w-10 h-10 mr-2" />
                Delete
              </button>
            </span>
          )}
          {showMessage && <MessageDetails selectedMessage={selectedMessage} />}
          {!showMessage && (
            <div className="row">
              <div className="col-md-12">
                <div
                  className="d-flex justify-content-between align-items-center"
                  style={{
                    padding: 10,
                    width: "calc(98% - 250px)",
                    borderBottom: "1px solid #ccc",
                    marginTop: -35,
                  }}
                >
                  <div className="m-2 d-flex align-items-center font-medium fs-4 gap-3">
                    <h3>Bienvenue, {Name} !</h3>
                  </div>
                  <div className="mt-3 d-flex align-items-center font-medium gap-3">
                    <img src="./config.png" width={30} height={30} />
                  </div>
                </div>
                <h1
                  style={{
                    marginTop: 10,
                    marginBottom: 20,
                    marginLeft: -270,
                    float: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                    fontSize: 30,
                  }}
                >
                  Mes Messages
                </h1>
                <ul
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0px",
                    padding: "0",
                    width: "calc(98% - 250px)",
                    backgroundColor: "ghostwhite",
                  }}
                >
                  <li
                    className="d-flex justify-content-between align-items-center"
                    style={{ padding: 10, borderBottom: "1px solid #ccc" }}
                  >
                    <div className="m-2 d-flex align-items-center font-medium fs-4 gap-3">
                      <img src="./logo.png" width={30} height={30} />
                      <p className="m-0" style={{ fontSize: "1.7rem" }}>
                        inbox
                      </p>
                    </div>
                    <div className="m-2 d-flex align-items-center font-medium gap-3">
                      <p className="m-0" style={{ fontSize: "1.6rem" }}>
                        1-50 of 354
                      </p>
                    </div>
                  </li>
                  {messages.map((message, index) => {
                    if (!drafts) {
                      // Display the content for drafts
                      return (
                        <li
                          key={index}
                          onMouseEnter={() => setHoverIndex(index)}
                          onMouseLeave={() => setHoverIndex(null)}
                          style={{
                            borderBottom: "1px solid #ccc",
                            width: "100%",
                            padding: "15px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            backgroundColor: message.read
                              ? "white"
                              : "ghostwhite",
                            cursor: "pointer",
                          }}
                          onClick={() => handleSelectedMessage(message)}
                        >
                          <div>
                            <div className="row">
                              <div className="col-md-12">
                                <strong>From :</strong>{" "}
                                {senderEmails[message.sender]}
                                <br />
                                <strong>To: </strong>
                                {message.receiversGroup === ""
                                  ? receiverEmails[message.receiver]
                                  : message.receiversGroup}
                              </div>
                              <div className="col-md-12">
                                <strong>{message.subject}</strong>
                                <br />
                                <strong>Message : </strong>
                                {message.message.length > 100
                                  ? `${message.message.substring(0, 100)}...`
                                  : message.message}
                                <br />
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              minWidth: "80px",
                            }}
                          >
                            {hoverIndex === index ? (
                              <>
                                <button
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    marginRight: "10px",
                                  }}
                                >
                                  <img
                                    src="./reply.png"
                                    width={20}
                                    height={20}
                                    onClick={() => handleShareMessage(message)}
                                  />
                                </button>
                                <button
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    marginRight: "10px",
                                  }}
                                >
                                  <img
                                    src="./reply2.png"
                                    width={20}
                                    height={20}
                                  />
                                </button>
                                <button
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                  }}
                                >
                                  <img
                                    src="./delete.png"
                                    onClick={() => handleDeleteMessage(message)}
                                    width={20}
                                    height={20}
                                  />
                                </button>
                              </>
                            ) : (
                              <p
                                className="d-flex justify-content-center"
                                style={{
                                  float: "none",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flex: 1,
                                }}
                              >
                                {formatTimestamp(message.timestamp.toNumber())}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    } else {
                      return (
                        <li
                          key={index}
                          onMouseEnter={() => setHoverIndex(index)}
                          onMouseLeave={() => setHoverIndex(null)}
                          style={{
                            borderBottom: "1px solid #ccc",
                            width: "100%",
                            padding: "15px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            backgroundColor: message.read
                              ? "white"
                              : "ghostwhite",
                            cursor: "pointer",
                          }}
                          onClick={() => handleSelectedDraft(message)}
                        >
                          <div>
                            <div className="row">
                              <div className="col-md-12">
                                <strong>From :</strong>{" "}
                                {senderEmails[message.sender]}
                                <br />
                                <strong>To: </strong>
                                {message.receiversArray}
                              </div>
                              <div className="col-md-12">
                                <strong>{message.subject}</strong>
                                <br />
                                <strong>Message : </strong>
                                {message.message.length > 100
                                  ? `${message.message.substring(0, 100)}...`
                                  : message.message}
                                <br />
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    }
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="col-md-12">
        {showReplyMessage && <ReplyMessage selectedMessage={selectedMessage} />}
      </div>
    </div>
  );
};

export default Messages;
