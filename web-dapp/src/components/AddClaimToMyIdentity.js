import React from 'react';

import * as log from 'loglevel';

const logger = log.getLogger('AddClaimToMyIdentity');

// Extracted from ERC725.json & ERC735.json artifacts
const CLAIMHOLDERABI = [
  {
    "constant": false,
    "inputs": [
      { "name": "_claimType", "type": "uint256" },
      { "name": "_scheme", "type": "uint256" },
      { "name": "issuer", "type": "address" },
      { "name": "_signature", "type": "bytes" },
      { "name": "_data", "type": "bytes" },
      { "name": "_uri", "type": "string"
      }
    ],
    "name": "addClaim",
    "outputs": [
      { "name": "claimRequestId", "type": "bytes32" }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" },
      { "name": "_data", "type": "bytes" }
    ],
    "name": "execute",
    "outputs": [
      { "name": "executionId", "type": "uint256" }
    ],
    "payable": true,
    "stateMutability": "payable",
    "type": "function"
  }
];
const CLAIM_TYPES_KYC = 7;
const CLAIM_SCHEMES_ECDSA = 1;

class AddClaimToMyIdentity extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            wallet: props.wallet,
            identityContractAddress: '',
        };

        this.setIdentityContractAddress = this.setIdentityContractAddress.bind(this)
        this.addPoPAClaimToMyIdentity = this.addPoPAClaimToMyIdentity.bind(this)
    }

    setIdentityContractAddress(event) {
        this.setState({identityContractAddress: event.target.value})
    }

    addPoPAClaimToMyIdentity() {
      const {web3} = this.props;
      const {wallet, identityContractAddress} = this.state;

      let myIdentityContract = web3.eth.contract(CLAIMHOLDERABI);
      let myIdentityContractInstance = myIdentityContract.at(identityContractAddress);

      window.$.ajax({
          type: 'post',
          url: '/api/issueErc725Claim',
          data: {
              wallet,
              // @TODO: should probably pass the keccak id instead
              addressIndex: 0,
          },
          success: (res) => {
            // NOTE: addClaimABI could be constructed on the server side,
            // serialized and passed here (ERC735's ABI is standard), but it
            // seems to be more transparent if it is done here since it will
            // "get passed to execute" (see below)
            let addClaimABI = myIdentityContractInstance.addClaim.getData(
                CLAIM_TYPES_KYC,
                CLAIM_SCHEMES_ECDSA,
                res.issuerAddress,
                res.signature,
                res.hexedData,
                res.uri,
            )
            // We are going to send a transaction to invoke the "execute" method
            // (check CLAIMHOLDERABI above), then "execute" should act
            // accordingly with the given "addClaimABI"
            let executeDataForSendTransaction = myIdentityContractInstance.execute.getData(
                identityContractAddress,
                0,
                addClaimABI
              );
            web3.eth.sendTransaction({
                    from: wallet,
                    to: identityContractAddress,
                    data: executeDataForSendTransaction,
                    gas: 4612388,
                }, function(transactionHash) {
                  console.log(`transactionHash: ${transactionHash}`);
                })
          },
          error: ({ statusText, status }) => {
              logger.debug('Server returned error: ' + statusText + ' (' + status + ')');
              this.setState({ loading: false });
              window.show_alert('error', 'Preparing confirmation transaction', [['Error', statusText + ' (' + status + ')']]);
          }
      });
    }

    render() {
        return (
            <form>
                <input type="text" name="identityContractAddress" onChange={this.setIdentityContractAddress}/>
                <button type="button" onClick={this.addPoPAClaimToMyIdentity}>Add Claim To My Identity</button>
            </form>
        );
    }
}

export default AddClaimToMyIdentity;
