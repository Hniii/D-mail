import { Navbar, Container, Form, FormControl, Button } from 'react-bootstrap';
import { Search , ExitToApp} from '@mui/icons-material';
import { ethers } from "ethers";
import React, { useState, useEffect } from 'react';
import ChatContract from '../Chat.sol/Chat.json';
import StructuresContract from '../Structures.sol/Structures.json';
import {contractAddressStructures, contractAddressChat} from "../App"

const NavBar = ({ onSearch }) => {

  const [walletAddress, setWalletAddress] = useState("");
  const [walletAddressName, setWalletAddressName] = useState("");
  const [searchInput, setSearchInput] = useState('');
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const chatContract = new ethers.Contract(contractAddressChat , ChatContract.abi, signer);
  const userContract = new ethers.Contract(contractAddressStructures , StructuresContract.abi, signer);

  async function getName() {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const result = await userContract.getName(accounts[0]);
    setWalletAddressName(result);
    setWalletAddress(accounts[0]);
  }

async function logout() {
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  const result = await userContract.getEmail(accounts[0]);
  sessionStorage.removeItem("PrivateKey."+result);
      window.location.href = '/';

  }

  useEffect(() => {
    getName();
  }, []);

  const handleSearch = () => {
    onSearch(searchInput);
    console.log("search:",searchInput)
  };

  return (
    <Navbar style={{ backgroundColor: '#1F2229', zIndex: 10 }} variant="dark" expand="md">
      <Container style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ float: 'left', display: 'flex', alignItems: 'center' }}>
          <img src="./logoapp.jpg" alt="Logo" style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }} />
          <div style={{ color: 'white', fontSize: 18 }}>Messaging App</div>
        </div>

        <div style={{ float: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
         <Form className="d-flex justify-content-center">
         <FormControl type="search" placeholder="Search" className="me-2" aria-label="Search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} style={{ backgroundColor: 'white', borderRadius: '20px', width: '400px' }} />
      <Button variant="outline-light" className="px-2" style={{ backgroundColor: '#FB723F',  borderRadius: '50px' }} onClick={handleSearch}><Search /></Button>
          </Form>
               
        </div>
        <div style={{ float: 'right', display: 'flex', alignItems: 'center' }}>
          <div style={{ marginLeft: 10, display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #FB723F', marginRight: 10 }}>
              <img src="./avatar.png" alt="User" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
            </div>
           
            <div style={{ color: 'white' }}>{walletAddressName}</div>
            
          </div>
          <Button variant="outline-light" className="px-2 ml-5" style={{ backgroundColor: '#1F2229' }} onClick={logout}>
            <ExitToApp style={{ color: '#FB723F' }} />
          </Button>
        </div>
      </Container>
    </Navbar>
  );
}

export default NavBar;