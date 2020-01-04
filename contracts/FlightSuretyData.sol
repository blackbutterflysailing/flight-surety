pragma solidity ^0.5.0;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Account used to deploy contract
    address private contractOwner;

    // Blocks all state changes throughout the contract if false
    bool private operational = true;

    // Addresses that can call this contract
    mapping(address => bool) private  authorizedContractCaller;


    // fund balance
    uint256 fundBalance = 0;

    // Airline information
    enum AirlineState {
        VotesRequired,
        Registered,
        DeniedRegistration,
        Funded
    }

    struct Airline {
        string name;
        uint registerAmount;
        AirlineState airlineState;
        Vote vote;
        bool isValue;
    }

    struct Vote {
        mapping(address => bool) votes;
        uint8 yesTotal;
        uint8 total;
    }

    enum InsuranceState {
        Purchased,
        Active,
        Expired,
        PayoutAvailable,
        PayoutDisbursed
    }

    struct Insurance {
        address buyer;
        address airline;
        uint value;
        bool isValue;
        InsuranceState insuranceState;
    }

    // member airline count
    uint memberAirlineCount = 0;

    // airline registration fee
    uint256 airlineRegistrationFee;

    mapping (address => Airline) private airlines;
    mapping (bytes32 =>  bytes32[]) private flightInsurances;
    mapping (bytes32 => Insurance) private passengerInsurances;
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event AirlinePayedFund(address airlineAddress, uint amount);
    event AirlineMembershipActived(address airlineAddress);

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor() public payable
    {
        contractOwner = msg.sender;

        // Register airline
             setAirline(
            msg.sender,
            "American Flyer", AirlineState.Funded
        );
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
    * @dev Modifier that requires the contract caller is authorized to call function
    */
    modifier requireCallerAuthorized
    {
        require(authorizedContractCaller[msg.sender] == true, "Contract Caller is not authorized to call this function");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
                            public
                            view
                            returns(bool)
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus(bool mode)
                            external
                            requireContractOwner
    {
        operational = mode;
    }

   /**
    * @dev Set Authorized Contract Caller
    * @param  contractCaller is an Ethereum contract address
    * When contract caller is authorized, then it will have access to designated methods
    */
    function authorizeCaller(address contractCaller)
                            external
                            requireIsOperational
                            requireContractOwner
    {
        authorizedContractCaller[contractCaller] = true;
    }

    /**
    * @dev Set Authorized Contract Caller
    * @param  contractAddress is an Ethereum contract address
    * @return Boolean authorized return true, otherwise return false
    * When contract caller is authorized, then it will have access to designated methods
    */
    function isCallerAuthorized(address contractAddress)
        external
        view
        requireIsOperational
        returns(bool)
    {
        return authorizedContractCaller[contractAddress];
    }

    function isAirlineRegistered(address airlineAddress)
        external
        view
        requireIsOperational
        returns(bool)
    {
        return airlines[airlineAddress].isValue == true;
    }
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function registerAirline(address airlineAddress, string calldata airlineName, AirlineState airlineStatus)
        external
        requireIsOperational
        requireCallerAuthorized
    {
            setAirline(
            airlineAddress,
            airlineName, airlineStatus
        );
    }

    /**
    * @dev Set Airline Registration Cost
    *
    * Have the contract owner set the cost of the airline registration
    */
    function setAirlineRegistrationFee(uint256 registrationFee)
        external
        requireIsOperational
        requireContractOwner
    {
        airlineRegistrationFee = registrationFee;
    }

   function setAuthorizedAddress(address contractCallerAddress)
                            external
                            requireIsOperational
                            requireContractOwner
    {
        authorizedContractCaller[contractCallerAddress] = true;
    }

    function airlinePayFund()
        public
        payable
        requireIsOperational
        requireCallerAuthorized
    {
        emit AirlinePayedFund(msg.sender, msg.value);
        airlines[msg.sender].registerAmount = airlines[msg.sender].registerAmount + msg.value;

       if (airlines[msg.sender].registerAmount >= airlineRegistrationFee) {
            airlines[msg.sender].airlineState = AirlineState.Funded;
            memberAirlineCount++;
            emit AirlineMembershipActived(msg.sender);
        }
    }

    function isAirlineMember(address airlineAddress)
        external
        view
        requireIsOperational
        requireCallerAuthorized
        returns (bool)
    {
        return airlines[airlineAddress].airlineState == AirlineState.Funded;
    }

    function setAirlineState(address airlineAddress, AirlineState airlineState)
        external
        requireIsOperational
        requireCallerAuthorized
    {
        airlines[airlineAddress].airlineState = airlineState;
    }

    function getAirlineState(address airlineAddress)
        external
        requireIsOperational
        requireCallerAuthorized
        returns (AirlineState)
    {
        return airlines[airlineAddress].airlineState;
    }

    function airlineMemberCount()
        external
        requireIsOperational
        requireCallerAuthorized
        returns (uint)
    {
        return memberAirlineCount;
    }

function setAirline
    (
        address airlineAddress,
        string memory airlineName,
        AirlineState airlineStatus
    )
        private
    {
        airlines[airlineAddress] = Airline({name: airlineName, registerAmount: 0, airlineState: airlineStatus, vote: Vote(0, 0), isValue: true});

    }

    function airlineInfo(address airlineAddress)
        external
        view
        requireIsOperational
        returns (
            string memory name,
            uint registerAmount,
            AirlineState airlineState,
            bool isValue
        )
    {
        Airline storage airline = airlines[airlineAddress];
        return(
            airline.name,
            airline.registerAmount,
            airline.airlineState,
            airline.isValue
        );
    }

    function voteOnAirline(address airlineAddress, bool vote)
        external
        requireIsOperational
        requireCallerAuthorized
        returns (uint, uint)
    {
        airlines[airlineAddress].vote.total += 1;

        if (vote) {
            airlines[airlineAddress].vote.yesTotal += 1;
        }

        return (airlines[airlineAddress].vote.yesTotal, airlines[airlineAddress].vote.total);
    }

   /**
    * @dev Buy insurance for a flight
    *
    */
    function buyFlightInsurance(
                                address passengerAddress,
                                address airlineAddress,
                                string calldata flightName,
                                uint256 departureTime,
                                uint insuranceCost
                                )
        external
        payable
        requireIsOperational
       requireCallerAuthorized
    {
        bytes32 flightKey = getFlightKey(passengerAddress, flightName, departureTime);
        bytes32 insuranceKey = getInsuranceKey(passengerAddress, flightKey);
        require(passengerInsurances[insuranceKey].isValue == true, "Passenger has already purchased insurance for this flight.");

        flightInsurances[flightKey].push(insuranceKey);
        passengerInsurances[insuranceKey] = Insurance({
                                                    buyer: passengerAddress,
                                                    airline: airlineAddress,
                                                    value: insuranceCost,
                                                    isValue: true,
                                                    insuranceState: InsuranceState.Purchased});
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(bytes32 flightKey, uint payoutRate)
        external
        requireIsOperational
        requireCallerAuthorized
    {
        bytes32[] storage insuranceKeys = flightInsurances[flightKey];

        for (uint i = 0; i < insuranceKeys.length; i++) {
            Insurance storage insurance = passengerInsurances[insuranceKeys[i]];

            if (insurance.insuranceState == InsuranceState.Purchased) {
                insurance.value.mul(payoutRate);
                insurance.insuranceState = InsuranceState.PayoutAvailable;
            } else {
                insurance.insuranceState = InsuranceState.Expired;
            }
        }
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function payoutInsuree(bytes32 insuranceKey)
        external
        requireIsOperational
        requireCallerAuthorized
    {
        // Retrieve insurance of the buyer
        Insurance storage insurance = passengerInsurances[insuranceKey];

        // Retrieve buy address from insurance
        address payable buyer = address(uint160(insurance.buyer));
        uint payoutValue = insurance.value;
        insurance.value = 0;
        buyer.transfer(payoutValue);
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                            internal
                            pure
                            returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function getInsuranceKey(address passenger, bytes32 flightKey)
        internal
        pure
        returns(bytes32)
    {
        return keccak256(abi.encodePacked(passenger, flightKey));
    }


    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function()
        external
        payable
    {
        airlinePayFund();
    }


}

