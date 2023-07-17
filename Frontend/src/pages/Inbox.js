import React, { useState, useEffect } from 'react';
import SendMessage from '../Components/SendMessage';
import { ethers } from 'ethers';
import ChatContract from '../Chat.sol/Chat.json';
import StructuresContract from '../Structures.sol/Structures.json';
import Messages from '../Components/Messages';
import '../assets/Inbox.css';
import { Button, ListGroup } from 'react-bootstrap';
import { BsPencilSquare } from "react-icons/bs";
 import { FaInbox, FaStar } from "react-icons/fa";
 import { BsFillPersonFill } from "react-icons/bs";
import { MdNotificationImportant } from "react-icons/md";
import { MdLabelImportant } from "react-icons/md";
// Importation de la Navbar et left bar
import Navbar from '../Components/NavBar';
import {contractAddressStructures, contractAddressChat} from "../App"
import { ec } from 'elliptic';
import crypto from 'crypto-browserify';
import axios from "axios";
//import Leftbar from './LeftBar';
const curve = new ec('secp256k1');


const Inbox = () => {
  const [messages, setMessages] = useState([]);
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [adminVerification, setAdminVerification] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');


  const buttons = [
    
    { icon: <div style={{marginTop: 5}}><FaInbox className="w-[1.7rem]  h-[1.7rem]" /></div>, title: "Inbox" },
    { icon: <FaStar className="w-[1.7rem]  h-[1.7rem]" />, title: "Sent" },
     {
      icon: <MdLabelImportant className="w-[1.7rem]  h-[1.7rem]" />,title: "Programmed",
    },
    
    { icon: <FaStar className="w-[1.7rem]  h-[1.7rem]" />, title: "Drafts" },
  ];

  const [selectedButton, setSelectedButton] = useState(buttons[0].title);
  const [selectedDraft, setSelectedDraft] = useState("");
 
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const chatContract = new ethers.Contract(contractAddressChat , ChatContract.abi, signer);
  const userContract = new ethers.Contract(contractAddressStructures , StructuresContract.abi, signer);

  const handleClick = (buttonTitle) => {
    setSelectedButton(buttonTitle);
  };
  
  const handleSendMessage = (message) => {
    // const newMessage = {
    //   sender:message.sender,
    //   receiver: message.receiver,
    //   subject: message.subject,
    //   body: message.message,
    //   timestamp: message.timestamp,
    //   read: message.read
    // };
    //setMessages([...messages, newMessage]);
    setShowSendMessage(false);
    console.log('messages',messages);
  };

  const handleToggleSendMessage = () => {
    setShowSendMessage(!showSendMessage);
  };

  useEffect(() => {
   // getName();
    // Lock horizontal scroll
    document.body.style.overflowX = 'hidden';

    // Clean up on unmount
    return () => {
      document.body.style.overflowX = 'auto';
    };
  }, []);

  async function admin() {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
  if(accounts[0].toLowerCase() == "0x7B60eD2A82267aB814256d3aB977ae5434d01d8b".toLowerCase()){
    setAdminVerification(true);
  }
  }

  admin();

  function redirect(){
    window.location.href = "/admin";
  }

  const [hoverIndex, setHoverIndex] = useState(null);

  return (
    <div className="p-0" style={{fontSize: '1.6rem'}}>
      
      <Navbar  onSearch={setSearchAddress} style={{ zIndex: 1, width: '100%', position: 'fixed' }} className="pl-0 pr-0"/>
      <div className="row">
      <div className="col-md-2 offset-md-2" style={{ marginTop: '80px', zIndex: 1 }}>
      <div style={{ backgroundColor: 'white', height: '100%', position: 'fixed', top: 0, left: 0, width: 230, borderRight: '1px solid #ccc', fontSize: '1.3em'}}>
        <div style={{position: 'fixed', top: 60, left: 17,}}>
          <div style={{ padding: '20px 10px', marginLeft: -15 }}>
          <button className="btn btn-primary btn-orange btn-lg" style={{ backgroundColor: '#FB723F', borderRadius: '30px', height: 60 }} onClick={handleToggleSendMessage}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <BsPencilSquare className="w-10 h-10 mr-2"/>
              <p style={{fontSize:'1.2em',}} className="text-white m-0">New Message</p>
            </div>
          </button>
          </div>
          <div className="pl-6 pt-4 flex flex-col items-start space-y-6" style={{display: 'flex', flexDirection: 'column'}}>
          {buttons.map((button) => (
            <button
  key={button.title}
  className={`text-gray-600 flex items-center gap-6 ${selectedButton === button.title ? 'active' : ''}`}
  onClick={() => handleClick(button.title)}
  style={{
    display: 'flex',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 10,
    padding: '10px',
    border: 'none',
    backgroundColor: selectedButton === button.title ? '#FB723F' : 'white',
    color: selectedButton === button.title ? 'white' : 'initial',
    cursor: 'pointer',
    textAlign: 'left',
  }}
  onMouseEnter={(e) => (e.target.style.backgroundColor = "#FB723F")}
  onMouseLeave={(e) => (e.target.style.backgroundColor = selectedButton === button.title ? '#FB723F' : '#FFF')}
>
 {button.icon} &nbsp;
 {button.title}
</button>

))}
{adminVerification && 
        <button
                className="btn btn-primary btn-orange"
                style={{
                  backgroundColor: "white",
                  color: "#FB723F",
                  borderRadius: "30px",
                  border: "2px solid #FB723F",
                  margin: "0 1rem",
                  fontSize: "1.1em",
                  marginTop: "100%"
                }}
                onMouseEnter={(e) => (
                  (e.target.style.backgroundColor = "#F64A0B"),
                  (e.target.style.color = "white")
                )}
                onMouseLeave={(e) => (
                  (e.target.style.backgroundColor = "white"),
                  (e.target.style.color = "#F64A0B")
                )}
                onClick={redirect}
              >
                <BsFillPersonFill className="w-10 h-10 mr-2" />&nbsp;
                Accounts
              </button>
        }
</div>
          </div>
        </div>
      </div>
      <div className="col-md-12">
      <Messages selectedButton={selectedButton}  searchAddress={searchAddress}/>
      
    </div>
            <div className="col-md-12">
              {showSendMessage && <SendMessage onSendMessage={handleSendMessage} selectedDraft={selectedDraft} />}
            </div>
            
        </div>
        
    </div>
  );
}

export default Inbox;