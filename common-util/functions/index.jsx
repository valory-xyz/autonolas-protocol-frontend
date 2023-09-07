import { ethers } from 'ethers';
import { notification } from 'antd/lib';
import { STAGING_CHAIN_ID } from '@autonolas/frontend-library';
import {
  TOTAL_VIEW_COUNT,
  LOCAL_FORK_ID,
  DEFAULT_CHAIN_ID,
} from 'util/constants';
import { SUPPORTED_CHAINS } from 'common-util/Login';

export const convertToEth = (value) => ethers.utils.formatEther(value);

/**
 * @example
 * TOTAL_VIEW_COUNT = 10
 * nextPage = 5
 * total = 45
 * first = ((5 - 1) * 10) + 1
 *      = (4 * 10) + 1
 *      = 41
 * last = min(5 * 10, 45)
 *      = 45
 */
export const getFirstAndLastIndex = (total, nextPage) => {
  const first = (nextPage - 1) * TOTAL_VIEW_COUNT + 1;
  const last = Math.min(nextPage * TOTAL_VIEW_COUNT, total);
  return { first, last };
};

// Nofitications
export const safeSendTransactionNotification = () => notification.warning({
  message: 'Please submit the transaction in your safe app.',
});

export const notifySuccess = (message = 'Successful') => notification.success({ message });
export const notifyError = (message = 'Some error occured') => notification.error({ message });

export const getIsValidChainId = (chainId) => {
  if (!chainId) return false;
  return SUPPORTED_CHAINS.some((e) => e.id === Number(chainId));
};

/**
 *
 * @param {Number} chainId
 * @returns {Number} valid chainId & defaults to mainnet if chainId is not supported
 */
export const getChainId = (chainId = null) => {
  if (typeof window === 'undefined') return chainId;

  const getChainIdHelper = (chainIdPassed) => {
    const chain = Number(chainIdPassed);
    return getIsValidChainId(chain) ? chain : DEFAULT_CHAIN_ID;
  };

  // connect via wallet-connect
  if (window?.MODAL_PROVIDER?.chainId) {
    const walletConnectChainId = Number(window.MODAL_PROVIDER.chainId);

    // if logged in via wallet-connect but chainId is not supported, default to mainnet
    const isSupportedChainId = getIsValidChainId(walletConnectChainId);

    console.log({ walletConnectChainId, isSupportedChainId });

    return isSupportedChainId ? walletConnectChainId : DEFAULT_CHAIN_ID;
  }

  /**
   * NOT logged in via wallet-connect but has wallet (eg. metamask)
   * window?.ethereum?.chainId is chainId set by wallet (eg. metamask)
   * If chainId is not supported, default to mainnet
   */
  const walletChainId = Number(window?.ethereum?.chainId);
  const isSupportedWalletChainId = getIsValidChainId(walletChainId);
  const fallbackChainId = isSupportedWalletChainId
    ? walletChainId
    : DEFAULT_CHAIN_ID;

  console.log({ walletChainId, isSupportedWalletChainId, fallbackChainId });

  return fallbackChainId;

  // const finalChainID = Number(
  //   chainId
  //     || window?.MODAL_PROVIDER?.chainId // set by web3modal
  //     || fallbackChainId,
  // );

  // console.log({ finalChainID });
  // return finalChainID;
};

export const isL1OnlyNetwork = (chainId) => {
  const chain = getChainId(chainId);
  return (
    chain === 1
    || chain === 5
    || chain === STAGING_CHAIN_ID
    || chain === LOCAL_FORK_ID
  );
};

/**
 * returns true if the chain is goerli or mainnet or local or null
 */
export const isL1Network = (chainId) => {
  const chain = getChainId(chainId);

  // even if chainId is null, we still show everything as shown in goerli or mainnet
  return isL1OnlyNetwork(chain) || chain === null;
};

export const isLocalNetwork = (chainId) => getChainId(chainId) === 31337;

export const isValidAddress = (address) => ethers.utils.isAddress(address);

export const addressValidator = () => ({
  validator(_, value) {
    return isValidAddress(value)
      ? Promise.resolve()
      : Promise.reject(new Error('Please enter valid addresses.'));
  },
});

// check if the provider is gnosis safe
export const checkIfGnosisSafe = async (account, provider) => {
  const code = await provider.getCode(account);
  return code !== '0x';
};
