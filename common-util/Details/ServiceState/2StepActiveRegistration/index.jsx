import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Divider, Typography } from 'antd';

import {
  convertToEth,
  isL1OnlyNetwork,
  notifyError,
  notifySuccess,
} from 'common-util/functions';
import { useHelpers } from 'common-util/hooks';
import {
  getBonds,
  getTokenBondRequest,
  getNumberOfAgentAddress,
  checkAndApproveToken,
  onStep2RegisterAgents,
  checkIfAgentInstancesAreValid,
} from '../utils';
import ActiveRegistrationTable from './ActiveRegistrationTable';

const { Text } = Typography;

const STEP = 2;

const ActiveRegistration = ({
  serviceId,
  dataSource,
  setDataSource,
  getOtherBtnProps,
  handleTerminate,
  getButton,
  isOwner,
  isEthToken,
  updateDetails,
}) => {
  const { account, chainId } = useHelpers();

  const [totalBonds, setTotalBond] = useState(null);
  const [ethTokenBonds, setEthTokenBonds] = useState([]);
  const [isValidAgentAddress, setIsValidAgentAddress] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  useEffect(() => {
    // react will throw an warning if we use setState after the component is unmounted,
    // hence need to check if the component is actually mounted
    let isMounted = true;
    (async () => {
      if (serviceId) {
        try {
          const { totalBonds: totalBondsRes } = await getBonds(
            serviceId,
            dataSource,
          );
          if (isMounted) {
            setTotalBond(totalBondsRes);
          }
        } catch (error) {
          notifyError('Error while fetching bonds');
          console.error(error);
        }
      }

      if (serviceId && !isEthToken && isL1OnlyNetwork(chainId)) {
        const response = await getTokenBondRequest(serviceId, dataSource);
        setEthTokenBonds(response);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [serviceId, dataSource]);

  const handleStep2RegisterAgents = async () => {
    const trimArray = (string) => (string || [])
      .join()
      .split(',')
      .map((e) => e.trim());

    const ids = [];

    // filter out instances that are empty
    const filteredDataSource = dataSource.filter(
      ({ agentAddresses }) => !!agentAddresses,
    );

    const instances = filteredDataSource.map(({ agentAddresses, agentId }) => {
      /**
       * constructs agentIds:
       * If there are 2 addresses of instances, then the agentIds will be [1, 1]
       * example: agentAddresses = ['0x123', '0x456']
       * agentId = 1
       * ids = [1, 1]
       */
      const address = (agentAddresses || '').trim();
      for (let i = 0; i < trimArray([address]).length; i += 1) {
        ids.push(agentId);
      }

      return address;
    });
    const agentInstances = trimArray(instances || []);

    try {
      setIsRegistering(true);

      // if not eth, check if the user has sufficient token balance
      // and if not, approve the token
      if (!isEthToken) {
        await checkAndApproveToken({
          account,
          chainId,
          serviceId,
        });
      }

      // check if the agent instances are valid
      const isValid = await checkIfAgentInstancesAreValid({
        account,
        agentInstances,
      });

      if (isValid) {
        await onStep2RegisterAgents({
          account,
          serviceId,
          agentIds: ids,
          agentInstances,
          dataSource,
        });
        notifySuccess('Registered Successfully');
        await updateDetails();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegistering(false);
    }
  };

  const btnProps = getOtherBtnProps(STEP);
  const totalBondEthToken = convertToEth((totalBonds || 0).toString()) || '--';

  let totalTokenBonds = 0;
  ethTokenBonds.forEach((bond, index) => {
    const addressCount = getNumberOfAgentAddress(
      dataSource[index].agentAddresses,
    );
    totalTokenBonds += addressCount * bond;
  });

  return (
    <div className="step-2-active-registration">
      <ActiveRegistrationTable
        data={dataSource}
        setDataSource={setDataSource}
        isDisabled={btnProps.disabled}
        setIsValidAgentAddress={setIsValidAgentAddress}
        bordered
      />
      <Text type="secondary">
        {`Adding instances will cause a bond of ${totalBondEthToken} ETH`}
        {!isEthToken && (
          <>{` and ${convertToEth((totalTokenBonds || 0).toString())} token`}</>
        )}
      </Text>

      {/* "Register agents" can be clicked by anyone */}
      <Button
        onClick={handleStep2RegisterAgents}
        {...btnProps}
        loading={isRegistering}
        disabled={btnProps.disabled || !isValidAgentAddress}
      >
        Register Agents
      </Button>
      <Divider />
      {getButton(
        <Button
          onClick={async () => {
            try {
              setIsTerminating(true);
              await handleTerminate();
            } catch (error) {
              console.error(error);
            } finally {
              setIsTerminating(false);
            }
          }}
          loading={isTerminating}
          {...getOtherBtnProps(2, { isDisabled: !isOwner })}
        >
          Terminate
        </Button>,
        { step: 2 },
      )}
    </div>
  );
};

ActiveRegistration.propTypes = {
  serviceId: PropTypes.string,
  dataSource: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  ).isRequired,
  setDataSource: PropTypes.func.isRequired,
  getOtherBtnProps: PropTypes.func.isRequired,
  handleTerminate: PropTypes.func.isRequired,
  getButton: PropTypes.func.isRequired,
  isOwner: PropTypes.bool.isRequired,
  isEthToken: PropTypes.bool.isRequired,
  updateDetails: PropTypes.func.isRequired,
};

ActiveRegistration.defaultProps = {
  serviceId: null,
};

export default ActiveRegistration;
