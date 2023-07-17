import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ChatContract from '../Chat.sol/Chat.json';
import StructuresContract from '../Structures.sol/Structures.json';
import '../assets/accounts.css';
import { BsPersonFillAdd,BsArchiveFill,BsWallet } from "react-icons/bs";
import { FaArchive, FaInbox, FaStar, FaUser,FaRegUser } from "react-icons/fa";
import {HiUsers} from  "react-icons/hi";
import {MdGroups,MdManageAccounts,MdDelete,MdOutlineMail} from "react-icons/md";
import Navbar from '../Components/NavBar';
import {contractAddressStructures, contractAddressChat} from "../App"
import { MdClose, MdCheck} from 'react-icons/md';
import { Modal, Button } from "react-bootstrap";

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [NewUsers, setNewUsers] = useState({});
  const [selectedButton, setSelectedButton] = useState("Users Accounts");
  const [showModal, setShowModal] = useState(false);
  const [hideModal, setHideModal] = useState(true);
  const[walletAddress, setWalletAddress] = useState("");

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const chatContract = new ethers.Contract(contractAddressChat , ChatContract.abi, signer);
  const userContract = new ethers.Contract(contractAddressStructures , StructuresContract.abi, signer);

  async function getName() {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const result = await userContract.getName(accounts[0]);
    setName(result);
    const allUsers = await userContract.getAllUsers();
    setUsers(allUsers);
  }

  function handleSelectedUser(user){
    setShowModal(true);
    setHideModal(false);
    setWalletAddress(user.walletAddress);
  }


  async function confirmModal(){
    if(selectedButton === "Users Accounts"){
      await userContract.desactivate(walletAddress);
    }else if(selectedButton === "Desactivated"){
      await userContract.activate(walletAddress);
    }
    hideModall();
  }

function hideModall(){
  setHideModal(true);
  setShowModal(false);
}

  async function getAllUsers() {
    const allUsers = await userContract.getAllUsers();
    return allUsers;
  }

  async function getAllUsersIDs() {
    const allUsersIDs = await userContract.getAllUsersIDs();
    return allUsersIDs;
  }
  async function getAllUsersdesac() {
    const allUsersdesac = await userContract.getAllDesactivatedUsers();
    return allUsersdesac;
  }

  const handleCreateUser = () => {
    window.open("/name", "_blank");
  };
  

  async function handleClick(title) {
    if (title === "Users Accounts") {
      const usersAccounts = await getAllUsers();
      setUsers(usersAccounts);
      setSelectedButton(title);
      console.log(usersAccounts);
    } else if (title === "Users IDs") {
      const usersIDs = await getAllUsersIDs();
      setUsers(usersIDs);
      setSelectedButton(title);
      console.log(usersIDs);
    } else if (title === "Desactivated") {
      const usersAct = await getAllUsersdesac();
      console.log(usersAct);
      setUsers(usersAct);
      setSelectedButton(title);
      // Perform action for "Archive" button
    }
    // Add more conditions for other buttons if needed
  }

  useEffect(() => {
    getName();
  }, []);
  const buttons = [
    
    { icon: <MdManageAccounts className="w-[1.7rem]  h-[1.7rem]" />, title: "Users Accounts" },
    { icon: <MdGroups className="w-[1.7rem]  h-[1.7rem]" />, title: "Users IDs" },
    
    { icon: <BsArchiveFill className="w-[1.7rem]  h-[1.7rem]" />, title: "Desactivated" },
  ];

  function redirect(){
    window.location.href = "/Inbox";
  }

  const [hoverIndex, setHoverIndex] = useState(null);

  return (
     <div className="p-0" style={{overflowX: "hidden", fontSize: '1.6rem'}}>
        <Navbar style={{ zIndex: 1, width: '100%', position: 'fixed' }} className="pl-0 pr-0"/>
        <div className="row">
          <div className="col-md-2 offset-md-2" style={{ marginTop: '80px', zIndex: 1 }}>
            <div style={{ backgroundColor: 'white', height: '100%', position: 'fixed', top: 0, left: 0, width: 230, borderRight: '1px solid #ccc', fontSize: '1.3em'}}>
              <div style={{position: 'fixed', top: 60, left: 17,}}>
                <div style={{ padding: '20px 10px', marginLeft: -15 }}>
                  <button className="btn btn-primary btn-orange btn-lg" style={{ backgroundColor: '#FB723F', borderRadius: '30px', height: 60 }} onClick={handleCreateUser}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <BsPersonFillAdd className="w-10 h-10 mr-2"/>
                      <p style={{fontSize:'1.2em',}} className="text-white m-0">Add User</p>
                    </div>
                  </button>
                </div>
                <div className="pl-6 pt-4 flex flex-col items-start space-y-6" style={{display: 'flex', flexDirection: 'column'}}>
                {buttons.map((button) => (
  <button
    key={button.title}
    className="text-gray-600 flex items-center gap-6"
    onClick={() => handleClick(button.title)}
    style={{
      borderRadius: 10,
      marginTop: 10,
      padding: '10px',
      border: 'none',
      backgroundColor: selectedButton === button.title ? '#FB723F' : 'white',
      cursor: 'pointer',
      textAlign: 'left',
    }}
    onMouseEnter={(e) => {
      if (selectedButton!== button.title) {
        e.target.style.backgroundColor = "#FB723F";
      }
    }}
    onMouseLeave={(e) => {
      if (selectedButton !== button.title) {
        e.target.style.backgroundColor = "white";
      }
    }}
  >
    {button.icon}&nbsp;
    {button.title}
  </button>
))}
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
                <FaInbox className="w-10 h-10 mr-2" />&nbsp;
                Inbox
              </button>
</div>

              </div>
            </div>
        </div>

        <div className="col-md-12" style={{ marginTop: '-80px', marginLeft: 250 }}>
      {name && (
        <div>
          {/* <h1>Bienvenue, {name}!</h1> */}
          <div className="row">
            <div className="col-md-12">
            <div className="d-flex justify-content-between align-items-center" style={{padding: 10, width: "calc(98% - 250px)", borderBottom: "1px solid #ccc", marginTop: -35}}>
                  <div className="m-2 d-flex align-items-center font-medium fs-4 gap-3" >
                    <h3>Bienvenue, {name} !</h3>
                  </div>
                 
            </div>
              <h1  style={{ marginTop: 10, marginBottom: 20, marginLeft: -270 , float: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, fontSize: 30}}>Users</h1>
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
                    <HiUsers className="w-10 h-10 mr-2"/><p className="m-0" style={{fontSize: '1.7rem' }}>List of users</p>
                  </div>
                  <div className="m-2 d-flex align-items-center font-medium gap-3">
                    <p className="m-0" style={{fontSize: '1.6rem' }}>1-50 of 354</p>
                  </div>
                </li>
                {users.map((user, index) => (
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
                      backgroundColor: user.exist ? "white" : "ghostwhite",
                    }}
                  >
                  {(selectedButton === 'Users Accounts' || selectedButton === 'Desactivated') && (
                    <div>
                      <div className="row">
                        <div className="col-12"><strong><FaRegUser className="w-40 h-40 mr-3"/>
                           {user.name}</strong></div>
                        <div className="col-12"><strong><MdOutlineMail className="w-40 h-40 mr-3"/>
                           {user.email}</strong></div>
                        <div className="col-12"><strong><BsWallet className="w-40 h-40 mr-3"/></strong>
                           {user.walletAddress}</div>
                        
                      </div>
                    </div>
                  )}
                  {selectedButton === 'Users IDs' && (
                    <div>
                      <div className="row">
                        <div className="col-12"><strong><MdOutlineMail className="w-40 h-40 mr-3"/>
                           {user.email}</strong></div>
                        <div className="col-12"><strong><BsWallet className="w-40 h-40 mr-3"/></strong>
                           {user.ID}</div>
                        
                      </div>
                    </div>
                  )}
                    <div style={{ display: "flex", alignItems: "center",  minWidth: '80px'}}>
                      {hoverIndex === index ? (
                        <>
                         <button
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer"
                            }}
                            onClick={() => handleSelectedUser(user)}
                          >
                            {selectedButton === 'Users Accounts' && (<MdClose className="w-20" title="Desactivate" />)}
                          {selectedButton === 'Desactivated' && (<MdCheck className="w-20" title="Activate" />)}

                          </button>
                        
                        </>
                      ) : (
                        <p> </p>
                             )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
           
          </div>
        </div>
      )}
        </div>
       
        </div>
        <Modal show={showModal} onHide={hideModal} style={{marginTop: 20}}>
        <Modal.Header closeButton>
          <Modal.Title style={{marginTop: 25, textAlign: 'center'}}>Desactivate Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body><div className="alert alert-danger">Do you really want to {selectedButton === "Users Accounts" ? "desactivate " : "activate "}this user's account ?</div></Modal.Body>
        <Modal.Footer>
          <Button variant="default" onClick={hideModall}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => confirmModal() }>
          {selectedButton === "Users Accounts" ? "desactivate " : "activate "}
          </Button>
        </Modal.Footer>
      </Modal>
     </div>
   
  );
}

export default Admin;
