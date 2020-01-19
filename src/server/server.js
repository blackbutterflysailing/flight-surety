import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
import BigNumber from 'bignumber.js'
import { createHash } from 'crypto';
import regeneratorRuntime from "regenerator-runtime";



let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
const ORACLES_COUNT = 5; 
// owner and first ailine account
//web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
var oracles = [];

web3.eth.getAccounts().then((accounts) => { 
  console.log("length :"+ accounts.length);
  flightSuretyData.methods.authorizeCaller(config.appAddress)
     .send({from: accounts[0]})
     .then(result => {
      console.log("appAddress registered as the authorized contract of dataContract");
    })
    .catch(error => {
      console.log("Error in authorizing appcontract. " + error);
    });
     flightSuretyApp.methods.REGISTRATION_FEE().call().then(fee => {
      for(let a=1; a<ORACLES_COUNT; a++) {
        flightSuretyApp.methods.registerOracle()
        .send({ from: accounts[a], value: fee,gas:4000000 })
        .then(result=>{
          flightSuretyApp.methods.getMyIndexes().call({from: accounts[a]})
          .then(indices =>{
            oracles[accounts[a]] = indices;
            console.log("Oracle registered: " + accounts[a] + " indices:" + indices);
          })
        }) 
        .catch(error => {
          console.log("Error while registering oracles: " + accounts[a] +  " Error: " + error);
        });           
      }
     })  
    

});

console.log("Registering Orcales && Getting Indexes...");

(function() {
  var P = ["\\", "|", "/", "-"];
  var x = 0;
  return setInterval(function() {
    process.stdout.write("\r" + P[x++]);
    x &= 3;
  }, 250);
})();

setTimeout(() => {
  oracles.forEach(orcale => {
    console.log(`Oracle Address: ${orcale.address}, has indexes: ${orcale.indexes}`);
  })
  console.log("\nStart watching for event OracleRequest to submit responses")
}, 25000)


flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error) console.log(error)
    else {
      let randomStatusCode = Math.floor(Math.random() * 6) * 10;
      let eventValue = event.returnValues;
      console.log(`Got a new event with randome index: ${eventValue.index} for flight: ${eventValue.flight}`);
      console.log("server: getMyIndexes oracles.length=" + oracles.length);

      oracles.forEach((oracle) => {
        console.log("server: submitOracleResponse 1 index=" + index + " eventValue.airline=" + eventValue.airline + " eventValue.flight=" + eventValue.flight + " eventValue.timestamp=" + eventValue.timestamp + " randomStatusCode=" + randomStatusCode);
        oracle.indexes.forEach((index) => {
          console.log("server: submitOracleResponse 3 index=" + index + " eventValue.airline=" + eventValue.airline + " eventValue.flight=" + eventValue.flight + " eventValue.timestamp=" + eventValue.timestamp + " randomStatusCode=" + randomStatusCode);
          flightSuretyApp.methods.submitOracleResponse(
            index, 
            eventValue.airline, 
            eventValue.flight, 
            eventValue.timestamp, 
            randomStatusCode
          ).send(
            { from: oracle.address , gas:5555555}
          ).then(res => {
            console.log(`--> Report from oracles(${oracle.address}).index(${index}) 👏🏽 accepted with status code ${randomStatusCode}`)
          }).catch(err => {
            console.log(`--> Report from oracles(${oracle.address}).index(${index}) ❌ rejected with status code ${randomStatusCode}`)
          });
        });
      });
    }
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


