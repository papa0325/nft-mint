import Web3 from "web3";
import {NotificationContainer, NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import Logo from "./assets/imgs/Logo.png";
import twitterPng from "./assets/imgs/twitter.png";
import discordPng from "./assets/imgs/discord.png";
import openseaPng from "./assets/imgs/opensea.png";
import mainPng from "./assets/imgs/hide.gif";
import './App.css';
import { useEffect, useState } from "react";
import contractAbi from "./abi/doodle.json";
import wlUserList from "./wl/user.json";
import publicProof from "./wl/public.json";

const contractAddress = "0xf1c34848e5e9269d095806D97d6f71E7300BB12b"; // rinkeby address

const sale = true;
const publicSale = true;

function App() {
  var web3;
  var nftContract;
  var address;
  var chainId;
  const [maxQuantity] = useState(5);
  const [quantity, setQuantity] = useState(0);
  const [walletAddress, setWalletAddress] = useState('');

  if(window.ethereum != null) {
  	web3 = new Web3(window.ethereum);
  }

  const connectWallet = async () => {
    if(window.ethereum != null) {
      await window.ethereum.request({method: 'eth_requestAccounts'}).then((data) => {
        address = data[0];
        setWalletAddress(address);
      });
    } else {
      notificationfunc("error", 'Can\'t Find Metamask Wallet. Please install it and reload again to mint NFT.');
    }
  }

  const mintToken = async () => {
    if (!walletAddress){
      notificationfunc("info", 'Please connect Metamask before mint!');
    } else {
      if (quantity <= 0){
        notificationfunc("warning", "Quantity should be more than 0.");
      } else {
        if (quantity > maxQuantity) {
          notificationfunc("error", "Max quantity is " + maxQuantity);
        } else {
          nftContract = contractAbi;
          if (window.ethereum == null) {
            notificationfunc("error", 'Wallet connect error! Please confirm that connect wallet.');
          } else {
            await window.ethereum.request({method: 'eth_chainId'}).then(data => {
              chainId = data;
            });

            const { MerkleTree } = require('merkletreejs')
            const keccak256 = require('keccak256');
            const wlUsers = wlUserList;

            const leaves = wlUsers.map(x => keccak256(x));
            const tree = new MerkleTree(leaves, keccak256);
            const root = tree.getRoot().toString('hex');
            const leaf = keccak256(walletAddress);
            let userIndex = wlUsers.indexOf(walletAddress);
            let hexProof = tree.getHexProof(leaf);

            //Public Sale
            if (publicSale && !hexProof.length) {
              hexProof = publicProof;
              userIndex = 0;
            }
            if(chainId === '0x4') {
              const contract = new web3.eth.Contract(nftContract, contractAddress);
              if (hexProof.length){
                await contract.methods.publicMint(quantity).send({
                  value: 60000000000000000 * quantity,
                  from: walletAddress
                })
                .then(data => {
                  notificationfunc("success", 'Successfully Minted!');
                })
                .catch(err => {
                  notificationfunc("error", err.message);
                })
              } else {
                notificationfunc("warning", "Please check your wallet.");
              }
            }else {
              notificationfunc("info", "Please change the network to Ethereum Mainnet and try again...");
            }
          }
        }
      }
    }
  }

  const notificationfunc = (type, message) => {
    switch (type) {
      case 'info':
        NotificationManager.info(message);
        break;
      case 'success':
        NotificationManager.success(message);
        break;
      case 'warning':
        NotificationManager.warning(message, 'Warning', 3000);
        break;
      case 'error':
        NotificationManager.error(message, 'Error', 5000);
        break;
      default:
        break;
    }
  }

  const nopresale = () => {
    notificationfunc("info", "Mint presale will be live on Jan 8th");
  }

  useEffect(() => {
    const checkConnection = async () => {
      // Check if browser is running Metamask
      let web3;
      if (window.ethereum) {
          web3 = new Web3(window.ethereum);
      } else if (window.web3) {
          web3 = new Web3(window.web3.currentProvider);
      };
      // Check if User is already connected by retrieving the accounts
      if (web3){
        web3.eth.getAccounts()
        .then(async (addr) => {
            setWalletAddress(addr[0]);
        });
      }
    };
    checkConnection();

  }, []);

  return (
    <div className="App">
      <div className="container-fluid main-container">
        <div className="page-container">
          <header className="header">
            <img src={Logo} alt="Logo" width={420} height={140}/>
            <div className="button-wrap">
              <a className="ml-20" rel="noreferrer" target="_blank">
                <img alt="Twitter" src={twitterPng} width="40" height="40"/>
              </a>
              <a className="ml-20" rel="noreferrer" target="_blank">
                <img alt="Discord" src={discordPng} width="40" height="40"/>
              </a>
              <a className="ml-20" rel="noreferrer" target="_blank">
                <img alt="Opensea" src={openseaPng} width="40" height="40"/>
              </a>
              {walletAddress ?
              <p className="address-text">{walletAddress.substr(0,6) + "..." + walletAddress.substr(walletAddress.length - 4)}</p> :
              <button onClick={connectWallet} className="connect-button">Connect Wallet</button>
              }

            </div>
          </header>

          <main>
            <div className="mintform">
              <div className="mt-2 mainPng">
                <img alt="" aria-hidden="true" src={mainPng} width="220" height="220"/>
              </div>

              <div className="max-title">Enter Quantity</div>
              <input
                className="quantity-input"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value < 0 ? 0 : e.target.value)}
                placeholder={0}
                min="0"
                max="5"
              />
              <button
                type="button"
                className="mint-button"
                disabled=""
                onClick={sale ? mintToken : nopresale}
              >MINT</button>
            </div>
          </main>


        </div>

      </div>
      <NotificationContainer/>
    </div>
  );
}

export default App;
