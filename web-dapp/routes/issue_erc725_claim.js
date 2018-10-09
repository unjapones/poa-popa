'use strict';

const express = require('express');
const logger = require('../server-lib/logger');
const config = require('../server-config');
const sendResponse = require('../server-lib/send_response');
const issueErc725ClaimController = require('../controllers/issueErc725Claim');

const sign = require('../server-lib/sign');
const signerPrivateKey = config.signerPrivateKey;

const web3 = config.web3;

// const KEY_PURPOSES = {
//     'MANAGEMENT' : 1,
//     'CLAIM' : 3,
// };
// const KEY_TYPES = {
//     'ECDSA' : 1,
// };
// const CLAIM_SCHEMES = {
//     'ECDSA' : 1,
// };
// const CLAIM_TYPES = {
//     'KYC' : 7,
// };
const CLAIM_TYPE_KYC_UINT256 = '0x0000000000000000000000000000000000000000000000000000000000000007';

module.exports = () => {
    const router = express.Router();
    router.post('/issueErc725Claim', function(req, res) {
        const logPrfx = req.logPrfx;
        const prelog = `[issueErc725Claim] (${logPrfx})`;

        // @TODO: validate that the required data is valid
        const {wallet, addressIndex, destinationClaimHolderAddress} = req.body;

        return issueErc725ClaimController.getAddressBykeccakIdentifier({wallet, addressIndex}, prelog)
            .then(async physicalAddress => {
                // @TODO: use the keccakIdentifier generated in the PoPA contract
                let physicalAddressText = [
                    physicalAddress.country,
                    physicalAddress.state,
                    physicalAddress.city,
                    physicalAddress.location,
                    physicalAddress.zip,
                ].join(',');
                let physicalAddressTextSha3 = web3.sha3(physicalAddressText);

                let dataToHash = Buffer.concat([
                    Buffer.from(destinationClaimHolderAddress.substr(2), 'hex'),
                    Buffer.from(CLAIM_TYPE_KYC_UINT256.substr(2), 'hex'),
                    Buffer.from(physicalAddressTextSha3.substr(2), 'hex'),
                ]).toString('hex');
                logger.log(`dataToHash: ${dataToHash}`);

                const { sig, dataHashed } = sign(dataToHash, signerPrivateKey);
                const signature = '0x' + sig;
                logger.log(`signature: ${signature}`);
                logger.log(`dataHashed: ${dataHashed}`);

                return sendResponse(res, {
                    ok: true,
                    signature,
                    data: physicalAddressTextSha3,
                    issuerAddress: config.cconf.PoPAClaimHolderAddress,
                    uri: 'http://popa.poa.network',
                });
            })
            .catch(error => {
                logger.error(`${prelog} ${error.msg}`);
                return sendResponse(res, { ok: false, err: error.msg });
            });
    });

    return router;
};
