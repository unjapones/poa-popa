'use strict';

const logger = require('../server-lib/logger');
const config = require('../server-config');
const {validate, normalize} = require('../server-lib/validations');
const {createResponseObject} = require('../server-lib/utils');

const validateData = (opts, prelog = '') => {
    if (!opts.body) return createResponseObject(false, 'request body: empty');
    const {body} = opts;

    // @TODO: add the corresponding validations
    if (!validate.wallet(body.wallet).ok) {
        logger.log(`${prelog} validation error on wallet: body.wallet, error: ${validate.wallet(body.wallet).msg}`);
        return createResponseObject(false, validate.wallet(body.wallet).msg);
    }

    return createResponseObject(true, '');
};

const normalizeData = (body) => {
    logger.log(`normalizing: ${JSON.stringify(body)}`);
    const wallet = body.wallet;
    // const keccakIdentifier = normalize.string(body.keccakIdentifier);
    // const addressIndex = normalize.string(body.addressIndex);
    // const destinationClaimHolderAddress = normalize.string(body.destinationClaimHolderAddress);
    // return {wallet, keccakIdentifier, destinationClaimHolderAddress};
    const addressIndex = body.addressIndex;
    const destinationClaimHolderAddress = body.destinationClaimHolderAddress;
    return {wallet, addressIndex, destinationClaimHolderAddress};
};

const getAddressBykeccakIdentifier = (opts, prelog = '') => {
    const {wallet, addressIndex} = opts;
    logger.log(`${prelog} getting (confirmed) of wallet: ${wallet} and index ${addressIndex}`);

    return new Promise((resolve, reject) => {
        config.contract.userAddress(wallet, addressIndex, function (err, details) {
            if (err) {
                logger.log(`ERRRORRRR: ${err}`);
                reject(err);
            } else {
                logger.log(`${prelog} details: ${JSON.stringify(details)}`);
                const address_details = {
                    country: details[0],
                    state: details[1],
                    city: details[2],
                    location: details[3],
                    zip: details[4],
                };
                resolve(address_details);
            }
        });
    });
};

module.exports = {
    validateData,
    normalizeData,
    getAddressBykeccakIdentifier,
};
