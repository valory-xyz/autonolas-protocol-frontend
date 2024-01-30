import { ethers } from 'ethers';
import { notifySuccess, notifyError } from '@autonolas/frontend-library';

import { DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS } from 'util/constants';
import {
  getGenericErc20Contract,
  getServiceContract,
  getServiceManagerContract,
  getServiceRegistryTokenUtilityContract,
} from 'common-util/Contracts';
import { ADDRESSES } from 'common-util/Contracts/addresses';
import { sendTransaction } from 'common-util/functions';
import { getTokenDetailsRequest } from 'common-util/Details/utils';
import {
  transformDatasourceForServiceTable,
  transformSlotsAndBonds,
} from '../helpers/functions';

/* ----- helper functions ----- */

// params.agentParams.slots[i] = total initial available Slots for the i-th service.agentIds;

/**
 *
 * @param {String} id serviceId
 * @param {Array} tableDataSource dataSource of the table and it can be null or undefined
 * @returns {Promise<Object>} { totalBonds, bondsArray, slotsArray }
 */
export const getBonds = async (id, tableDataSource) => {
  const serviceContract = getServiceContract();
  const response = await serviceContract.methods.getAgentParams(id).call();

  const bondsArray = [];
  const slotsArray = [];
  for (let i = 0; i < response.agentParams.length; i += 1) {
    /**
     * agentParams = [{ slots: 2, bond: 2000 }, { slots: 3, bond: 4000 }]
     * slotsArray = [2, 3]
     * bondsArray = [2000, 4000]
     */

    const { bond, slots } = response.agentParams[i];
    slotsArray.push(slots);
    bondsArray.push(bond);
  }

  return transformSlotsAndBonds(slotsArray, bondsArray, tableDataSource);
};

/* ----- common functions ----- */
export const onTerminate = async (account, id) => {
  const contract = getServiceManagerContract();
  const fn = contract.methods.terminate(id).send({
    from: account,
  });
  const response = await sendTransaction(fn, account);
  notifySuccess('Terminated Successfully');
  return response;
};

export const getServiceOwner = async (id) => {
  const contract = getServiceContract();
  const response = await contract.methods.ownerOf(id).call();
  return response;
};

const hasSufficientTokenRequest = async ({ account, chainId, serviceId }) => {
  /**
   * - fetch the token address from the serviceId
   * - fetch the allowance of the token using the token address
   */
  const { token } = await getTokenDetailsRequest(serviceId);
  const contract = getGenericErc20Contract(token);
  const response = await contract.methods
    .allowance(account, ADDRESSES[chainId].serviceRegistryTokenUtility)
    .call();
  return !(ethers.BigNumber.from(response) < ethers.constants.MaxUint256);
};

/**
 * Approves token
 */
const approveToken = async ({ account, chainId, serviceId }) => {
  const { token } = await getTokenDetailsRequest(serviceId);
  const contract = getGenericErc20Contract(token);
  const fn = contract.methods
    .approve(
      ADDRESSES[chainId].serviceRegistryTokenUtility,
      ethers.constants.MaxUint256,
    )
    .send({ from: account });

  const response = await sendTransaction(fn, account);
  return response;
};

export const checkAndApproveToken = async ({ account, chainId, serviceId }) => {
  const hasTokenBalance = await hasSufficientTokenRequest({
    account,
    chainId,
    serviceId,
  });

  if (!hasTokenBalance) {
    const response = await approveToken({ account, chainId, serviceId });
    return response;
  }

  return null;
};

/* ----- step 1 functions ----- */
export const checkIfEth = async (id) => {
  const { token } = await getTokenDetailsRequest(id);
  return token === DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS;
};

// NOTE: this function is used only for testing
export const mintTokenRequest = async ({ account, serviceId }) => {
  const { token } = await getTokenDetailsRequest(serviceId);
  const contract = getGenericErc20Contract(token);
  const fn = contract.methods
    .mint(account, ethers.utils.parseEther('1000'))
    .send({ from: account });
  await sendTransaction(fn, account);
  return null;
};

export const onActivateRegistration = async (id, account, deposit) => {
  const contract = getServiceManagerContract();
  const fn = contract.methods.activateRegistration(id).send({
    from: account,
    value: deposit,
  });

  const response = await sendTransaction(fn, account);
  notifySuccess('Activated Successfully');
  return response;
};

/* ----- step 2 functions ----- */
/**
 * @typedef {Object} DataSource
 * @property {string} key
 * @property {string} agentId
 * @property {number} availableSlots
 * @property {number} totalSlots
 * @property {number} bond
 * @property {string} agentAddresses
 *
 */
/**
 *
 * @param {String} id
 * @param {String[]} agentIds
 * @returns {Promise<DataSource[]>}
 *
 * @example
 * {
 *   agentAddresses: null
 *   agentId: "2"
 *   availableSlots: 0
 *   bond: "1000000000000000"
 *   key: "2"
 *   totalSlots: "4"
 * }
 */
export const getServiceTableDataSource = async (id, agentIds) => {
  const contract = getServiceContract();
  const { slots, bonds } = await getBonds(id);

  /**
   * for each agent Id, we call instances = getInstancesForAgentId(serviceId, agentId):
   * instances.numAgentInstances will give the number of occupied instances slots, so in
   * the Available Slots row you subtract params.agentParams.slots[i] -
   * instances.numAgentInstances, considering the same agentId. And as for Agent Addresses
   * for the correspondent Agent ID, just grab all the values from the:
   * instances.agentInstances
   */
  const numAgentInstancesArray = await Promise.all(
    agentIds.map(async (agentId) => {
      const info = await contract.methods
        .getInstancesForAgentId(id, agentId)
        .call();
      return info.numAgentInstances;
    }),
  );

  const dateSource = transformDatasourceForServiceTable({
    agentIds,
    numAgentInstances: numAgentInstancesArray,
    slots,
    bonds,
  });
  return dateSource;
};

export const checkIfAgentInstancesAreValid = async ({
  account,
  agentInstances,
}) => {
  const contract = getServiceContract();

  // check if the operator is registered as an agent instance already
  const operator = await contract.methods
    .mapAgentInstanceOperators(account)
    .call();
  if (operator !== DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS) {
    notifyError('The operator is registered as an agent instance already.');
    return false;
  }

  // check if the agent instances are valid
  const agentInstanceAddresses = agentInstances.map(async (agentInstance) => {
    const eachAgentInstance = await contract.methods
      .mapAgentInstanceOperators(agentInstance)
      .call();
    return eachAgentInstance;
  });

  const ifValidArray = (await Promise.all(agentInstanceAddresses)).some(
    (eachAgentInstance) => eachAgentInstance === DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS,
  );

  if (!ifValidArray) {
    notifyError('The agent instance address is already registered.');
    return false;
  }

  return true;
};

export const onStep2RegisterAgents = async ({
  account,
  serviceId,
  agentIds,
  agentInstances,
  dataSource,
}) => {
  const contract = getServiceManagerContract();
  const { totalBonds } = await getBonds(serviceId, dataSource);

  const fn = contract.methods
    .registerAgents(serviceId, agentInstances, agentIds)
    .send({ from: account, value: `${totalBonds}` });
  const response = await sendTransaction(fn, account);
  return response;
};

export const getTokenBondRequest = async (id, source) => {
  const contract = getServiceRegistryTokenUtilityContract();
  return Promise.all(
    (source || []).map(async ({ agentId }) => {
      const bond = await contract.methods.getAgentBond(id, agentId).call();
      return bond;
    }),
  );
};

export const getServiceAgentInstances = async (id) => {
  const contract = getServiceContract();
  const response = await contract.methods.getAgentInstances(id).call();
  return response?.agentInstances;
};

export const onStep3Deploy = async (
  account,
  id,
  radioValue,
  payload = '0x',
) => {
  const contract = getServiceManagerContract();
  const fn = contract.methods
    .deploy(id, radioValue, payload)
    .send({ from: account });
  const response = sendTransaction(fn, account);
  return response;
};

/* ----- step 4 functions ----- */
export const getAgentInstanceAndOperator = async (id) => {
  const contract = getServiceContract();
  const response = await contract.methods.getAgentInstances(id).call();
  const data = await Promise.all(
    (response?.agentInstances || []).map(async (key, index) => {
      const operatorAddress = await contract.methods
        .mapAgentInstanceOperators(key)
        .call();
      return {
        id: `agent-instance-row-${index + 1}`,
        operatorAddress,
        agentInstance: key,
      };
    }),
  );
  return data;
};

/* ----- step 5 functions ----- */
export const onStep5Unbond = async (account, id) => {
  const contract = getServiceManagerContract();
  const fn = contract.methods.unbond(id).send({ from: account });
  const response = await sendTransaction(fn, account);
  return response;
};
