'use strict';

const express = require('express');
const logger = require('../server-lib/logger');
const config = require('../server-config');
const sendResponse = require('../server-lib/send_response');
const issueErc725ClaimController = require('../controllers/issueErc725Claim');

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
const CLAIM_TYPES = {
    'KYC' : 7,
};

module.exports = () => {
    const router = express.Router();
    router.post('/issueErc725Claim', function(req, res) {
        const logPrfx = req.logPrfx;
        const prelog = `[issueErc725Claim] (${logPrfx})`;

        const {wallet, addressIndex, destinationClaimHolderAddress} = req.body;
        logger.log(`[issueErc725Claim] (req.body): ${JSON.stringify(req.body)}`);

        return issueErc725ClaimController.getAddressBykeccakIdentifier({wallet, addressIndex}, prelog)
            .then(async physicalAddress => {
                let physicalAddressText = [
                    physicalAddress.country,
                    physicalAddress.state,
                    physicalAddress.city,
                    physicalAddress.location,
                    physicalAddress.zip,
                ].join(',');
                logger.log(`[physicalAddressText]: ${JSON.stringify(physicalAddressText)}`);

                // Using methods from web3 prior version 1
                let hexedData = web3.fromAscii(physicalAddressText);
                let hashedDataToSign = web3.sha3(
                    destinationClaimHolderAddress,
                    CLAIM_TYPES.KYC,
                    hexedData,
                );
                let signature = await web3.eth.sign(config.signer, hashedDataToSign);
                logger.log(`[hexedData]: ${hexedData}`);
                logger.log(`[hashedDataToSign (destinationClaimHolderAddress, CLAIMTYPE.KYC, hexedData)]: ${JSON.stringify(hashedDataToSign)}`);
                logger.log(`[signature]: ${JSON.stringify(signature)}`);

                return sendResponse(res, {
                    ok: true,
                    signature,
                    hexedData,
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
