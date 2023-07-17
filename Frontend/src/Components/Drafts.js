import React, { useState, useEffect } from 'react';
//import SendMessage from './SendMessage';
import  DraftDetails from './DraftsDetails';
import { ethers } from 'ethers';
import ChatContract from '../Chat.sol/Chat.json';
import '../assets/Inbox.css';
import '../assets/SharesList.css'
import { Button, ListGroup } from 'react-bootstrap';
import { BsPencilSquare } from "react-icons/bs";
 import { FaInbox, FaStar } from "react-icons/fa";
import { MdNotificationImportant } from "react-icons/md";
import { MdLabelImportant } from "react-icons/md";
import Navbar from './NavBar';

import {contractAddressChat} from "../App"
const Drafts = () => {
  const [drafts, setDrafts] = useState([]);
  const [Email, setEmail] = useState("");
  const [Name, setName] = useState("");
  const [senderEmails, setSenderEmails] = useState({});
  const [receiverEmails, setReceiverEmails] = useState({});
  const [showDraft, setShowDraft] = useState(false);
  const [selectedDraft, setSelectedDraft]= useState({});
  const [counter, setCounter]= useState(0);
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const contractAddress = contractAddressChat;
  const signer = provider.getSigner();
  const chatContract = new ethers.Contract(contractAddress , ChatContract.abi, signer);


   async function handleSelectedDraft  (draft) {

    setSelectedDraft(draft);
    console.log("id:", draft.id.toString());
   }; 
   useEffect( () => {
    if (counter === 1){
      setShowDraft(true);
      console.log("Selected Draft", selectedDraft);
    };
    if (counter === 0){setCounter(1);};
  }, [selectedDraft]);

  
 


  async function getName() {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const result = await chatContract.getEmail(accounts[0]);
    console.log(result);
    console.log(typeof result);
    setEmail(result);
    const result2 = await chatContract.getName(accounts[0]);
    setName(result2);
    const drafts = await chatContract.getDrafts(result);
    setDrafts(drafts);
    const senderEmails = {};
    const receiverEmails = {};
    drafts.forEach(async (draft) => {
      if (!(draft.sender in senderEmails)) {
          const senderEmail = await getEmail(draft.sender);
          getEmail(draft.sender).then(email => setSenderEmails(prevState => ({
            ...prevState,
            [draft.sender]: email,
          })));
      }
      if (!(draft.receivers[0] in receiverEmails)) {
        
          const receiverEmail = await getEmail(draft.receivers[0]);
          getEmail(draft.receivers[0]).then(email => setReceiverEmails(prevState => ({
            ...prevState,
            [draft.receivers[0]]: email,
          })));
      }
    });
    
    
  }
   
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
    const result = await chatContract.getEmail(adresse);
    return result;
  }

  useEffect(() => {
    getName();
    // Lock horizontal scroll
    document.body.style.overflowX = 'hidden';
    // Clean up on unmount
    return () => {
      document.body.style.overflowX = 'auto';
      
    };
  }, []);

  const buttons = [
    
    { icon: <FaInbox className="w-[1.7rem]  h-[1.7rem]" />, title: "Inbox" },
    { icon: <FaStar className="w-[1.7rem]  h-[1.7rem]" />, title: "Sent" },
     {
      icon: <MdLabelImportant className="w-[1.7rem]  h-[1.7rem]" />,title: "Programmed",
    },
    
    { icon: <FaInbox className="w-[1.7rem]  h-[1.7rem]" />, title: "Spam" },
    { icon: <FaStar className="w-[1.7rem]  h-[1.7rem]" />, title: "Drafts" },
    {
      icon: <MdLabelImportant className="w-[1.7rem]  h-[1.7rem]" />,title: "Favourites",
    },
  ];

  const [hoverIndex, setHoverIndex] = useState(null);


  return (
   
    <div className="col-md-12" style={{ marginTop: '-80px', marginLeft: 250 }}>

    {Email && (
    

      <div>
       { showDraft && (
        <DraftDetails selectedDraft={selectedDraft} />
       ) }
       { !showDraft &&  ( 
        <div className="row">
          <div className="col-md-12">
          <div className="d-flex justify-content-between align-items-center" style={{padding: 10, width: "calc(98% - 250px)", borderBottom: "1px solid #ccc", marginTop: -35}}>
                <div className="m-2 d-flex align-items-center font-medium fs-4 gap-3" >
                  <h3>Bienvenue, {Name} !</h3>
                </div>
                <div className="mt-3 d-flex align-items-center font-medium gap-3">
                  <img src="./config.png" width={30} height={30} />
                </div>
            </div>
            <h1  style={{ marginTop: 10, marginBottom: 20, marginLeft: -270 , float: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, fontSize: 30}}>Mes Brouillon</h1>
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
              <li className="d-flex justify-content-between align-items-center" style={{padding: 10, borderBottom: "1px solid #ccc",}}>
                <div className="m-2 d-flex align-items-center font-medium fs-4 gap-3">
                  <img src="./logo.png" width={30} height={30} /><p className="m-0" style={{fontSize: '1.7rem' }}>inbox</p>
                </div>
                <div className="m-2 d-flex align-items-center font-medium gap-3">
                  <p className="m-0" style={{fontSize: '1.6rem' }}>1-50 of 354</p>
                </div>
              </li>
              {drafts.map((draft, index) => ( 
             
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
                    backgroundColor: draft.read ? "white" : "ghostwhite",
                  }}
                  
                >
                  <div>
                    <div className="row" onClick={() => handleSelectedDraft(draft)} >
                      <div className="col-md-12">
                     
                        <strong>From :</strong> {senderEmails[draft.sender]}
                        <br/>
                        <strong>To : </strong>{receiverEmails[draft.receivers[0]]}
                        
                        {/* <br/><strong>ID : </strong>{draft.id.toString()} */}
                      </div>
                      <div className="col-md-12">
                      <strong>{draft.subject}</strong>
                     
                    
                      {/* <br/>
                        <strong>Draft : </strong>
                        {draft.draft.length > 100
                          ? `${draft.draft.substring(0, 100)}...`
                          : draft.draft}
                          <br/> */}
                      </div>
                    
                      </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center",  minWidth: '80px'}}>
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
                        </button>
                        <button
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            marginRight: "10px",
                          }}
                        >
                          <img src="./reply2.png" width={20} height={20} />
                        </button>
                        <button
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <img src="./delete.png" width={20} height={20} />
                        </button>
                      </>
                    ) : (
                      <p className="d-flex justify-content-center" style={{float: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1}}>timestamp</p>
                      // <p className="d-flex justify-content-center" style={{float: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1}}>{formatTimestamp(draft.timestamp.toNumber())}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
        </div>
      )} 

        
      </div>
) }
  
  </div>
   
  );
}

export default Drafts;