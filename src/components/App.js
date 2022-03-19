import React from 'react';
import { useState ,useEffect} from "react";
import DVideo from '../abis/DVideo.json'
import Navbar from './Navbar'
import Main from './Main'
import Web3 from 'web3';
import './App.css';

//Declare IPFS
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

function App() {
  
  const [account,setAccount] = useState("");
  const [currentHash,setcurrentHash] = useState("");
  const [dvideo,setDvideo] = useState();
  const [videoCount,setVideoCount] = useState("");
  const [currentTitle,setcurrentTitle] = useState("");
  const [videos,setVideo] = useState([]);
  const [mounted, setMounted] = useState(false)
  const [loading, setloading] = useState(true)
  const [buffer,setBuffer] = useState("");

  const loadWeb3 = async() => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  const loadBlockchainData  = async() => {
    const web3 = window.web3
    //Load accounts
    const accounts = await web3.eth.getAccounts();
    setAccount(accounts[0])

    const networkId = await web3.eth.net.getId()
    const networkData = DVideo.networks[networkId];
    if(networkData){
      const dvideo = new web3.eth.Contract(DVideo.abi,networkData.address)
      setDvideo(dvideo)

      const videosCount = await dvideo.methods.videoCount().call()
      setVideoCount(videosCount)

      for(var i=videosCount; i>=1; i--) {
        const video = await dvideo.methods.videos(i).call()
        
        setVideo(videos => [...videos, video]);
      }

      const latest = await dvideo.methods.videos(videosCount).call()

      setcurrentHash(latest.hash)
      setcurrentTitle(latest.title)
      setloading(false)
      
    }
    else{
      window.alert('Dvideo contract not deployed to detected network');
    }
    
  }

  if(!mounted){
    loadWeb3()
    loadBlockchainData()
  }

  useEffect(() =>{
    setMounted(true)
  },[])

  //Get video
  const captureFile = event => {
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)

    reader.onloadend = () => {
      const buffer = Buffer(reader.result)
      setBuffer(buffer)
      
    }
  }

  //Upload video
  const uploadVideo = (title) => {
   
    //adding file to the IPFS
    ipfs.add(buffer, (error, result) => {
   
      if(error) {
        console.error(error)
        return
      }

      setloading(true)
      dvideo.methods.uploadVideo(result[0].hash, title).send({ from: account }).on('transactionHash', (hash) => {
        setloading(false)
      })
    })
  }

  //Change Video
  const changeVideo = (hash, title) => {
    
    setcurrentHash(hash)
    setcurrentTitle(title)

  }


  
  return (
    <div>
      <Navbar 
        account={account}
        //Account
      />
      { loading
        ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
        : <Main
            //states&functions
            videos={videos}
            captureFile={captureFile}
            uploadVideo={uploadVideo}
            changeVideo={changeVideo}
            currentHash={currentHash}
            currentTitle={currentTitle}
          />
      }
    </div>
  );
}


export default App;