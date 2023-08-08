import { useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { Button, Space } from 'antd/lib';
import { URL } from 'util/constants';

import { isLocalNetwork } from 'common-util/functions';
import {
  checkAndApproveToken,
  mintTokenRequest,
  onActivateRegistration,
} from '../utils';

const PreRegistration = ({
  serviceId,
  getOtherBtnProps,
  getButton,
  isOwner,
  securityDeposit,
  isEthToken,
  updateDetails,
}) => {
  const router = useRouter();
  const account = useSelector((state) => state?.setup?.account);
  const chainId = useSelector((state) => state?.setup?.chainId);
  const [isActivating, setIsUpdateLoading] = useState(false);

  const handleStep1Registration = async () => {
    try {
      setIsUpdateLoading(true);
      // if not eth, check if the user has sufficient token balance
      // and if not, approve the token
      if (!isEthToken) {
        await checkAndApproveToken({
          account,
          chainId,
          serviceId,
        });
      }

      // NOTE: just for testing, mint tokens for local network
      if (isLocalNetwork(chainId)) {
        // mint tokens before activating registration
        await mintTokenRequest({
          account,
          serviceId,
        });
      }

      // any amount if not ETH token substitute with 1
      await onActivateRegistration(
        account,
        serviceId,
        isEthToken ? securityDeposit : '1',
      );
      await updateDetails();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdateLoading(false);
    }
  };

  const handleStep1Update = () => {
    router.push(`${URL.UPDATE_SERVICE}/${serviceId}`);
  };

  return (
    <div className="step-1-pre-registration">
      <Space>
        {getButton(
          <Button
            onClick={handleStep1Registration}
            loading={isActivating}
            {...getOtherBtnProps(1, { isDisabled: !isOwner })}
          >
            Activate Registration
          </Button>,
          { step: 1 },
        )}
        {getButton(
          <Button
            onClick={handleStep1Update}
            {...getOtherBtnProps(1, { isDisabled: !isOwner })}
          >
            Update
          </Button>,
          { step: 1 },
        )}
      </Space>
    </div>
  );
};

PreRegistration.propTypes = {
  serviceId: PropTypes.string,
  getOtherBtnProps: PropTypes.func.isRequired,
  getButton: PropTypes.func.isRequired,
  isOwner: PropTypes.bool.isRequired,
  isEthToken: PropTypes.bool.isRequired,
  securityDeposit: PropTypes.string,
  updateDetails: PropTypes.func.isRequired,
};

PreRegistration.defaultProps = {
  serviceId: null,
  securityDeposit: '0',
};

export default PreRegistration;
