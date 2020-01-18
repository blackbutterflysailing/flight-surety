import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
// web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
const ORACLES_COUNT = 20;
const ORACLES_START_INDEX = 29;
const ORACLES_END_INDEX = ORACLES_START_INDEX + ORACLES_COUNT;
var oracles = [];

(async() => {
  let accounts = await web3.eth.getAccounts();
  try {
    await flightSuretyData.methods.authorizeCallerContract(config.appAddress).send({from: accounts[0]});
  } catch(e) {
    //console.log(e)
  }

  let fee = await flightSuretyApp.methods.REGISTRATION_FEE().call()
  
  accounts.slice(ORACLES_START_INDEX, ORACLES_END_INDEX).forEach( async(oracleAddress) => {

    try {
      await flightSuretyApp.methods.registerOracle().send({from: oracleAddress, value: fee, gas: 3000000});
      let indexesResult = await flightSuretyApp.methods.getMyIndexes().call({from: oracleAddress});
      orcales.push({
        address: oracleAddress,
        indexes: indexesResult
      });
    } catch(e) {
      //console.log(e)
    }
  });
})();


flightSuretyApp.events.OracleRequest({
  fromBlock: 0
}, function (error, event) {
  if (error) console.log(error)
  else {
    let randomStatusCode = Math.floor(Math.random() * 6) * 10;
    let eventValue = event.returnValues;
    console.log(`Got a new event with randome index: ${eventValue.index} for flight: ${eventValue.flight}`);

    oracles.forEach((oracle) => {
      oracle.indexes.forEach((index) => {
        flightSuretyApp.methods.submitOracleResponse(
          index,
          eventValue.airline,
          eventValue.flight,
          eventValue.timestamp,
          randomStatusCode
        ).send(
          { from: oracle.address , gas:5555555}
        ).then(res => {
          console.log(`Accepted Oracles (${oracle.address}).index(${index}) status code ${randomStatusCode}`);
        }).catch(err => {
          console.log(`Rejected Oracles (${oracle.address}).index(${index}) status code ${randomStatusCode}`);
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


