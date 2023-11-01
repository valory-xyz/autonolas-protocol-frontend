import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, ConfigProvider, Grid } from 'antd';
import { Web3Modal, Web3Button, useWeb3Modal } from '@web3modal/react';
import {
  useAccount, useBalance, useDisconnect, useNetwork,
} from 'wagmi';
import styled from 'styled-components';
import {
  COLOR,
  CannotConnectAddressOfacError,
  MEDIA_QUERY,
  notifyError,
} from '@autonolas/frontend-library';

import { setUserBalance } from 'store/setup/actions';
import { isAddressProhibited } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks';
import { WarningOutlined } from '@ant-design/icons';
import { projectId, ethereumClient } from './config';

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  line-height: normal;
  ${MEDIA_QUERY.mobileL} {
    margin-top: 0.5rem;
  }
`;

const { useBreakpoint } = Grid;

export const LoginV2 = ({
  onConnect: onConnectCb,
  onDisconnect: onDisconnectCb,
  theme = 'light',
}) => {
  const dispatch = useDispatch();
  const { disconnect } = useDisconnect();
  const { open, isOpen } = useWeb3Modal();
  const { chainId } = useHelpers();
  const { chain: walletConnectedChain } = useNetwork();

  const { address, connector } = useAccount({
    onConnect: ({ address: currentAddress }) => {
      if (isAddressProhibited(currentAddress)) {
        disconnect();
      } else if (onConnectCb && chainId) {
        onConnectCb({
          address: address || currentAddress,
          balance: null,
          chainId,
        });
      }
    },
    onDisconnect() {
      if (onDisconnectCb) onDisconnectCb();
    },
  });

  // Update the balance
  const { data: balance } = useBalance({ address, chainId });

  useEffect(() => {
    if (chainId && balance?.formatted) {
      dispatch(setUserBalance(balance.formatted));
    }
  }, [chainId, balance?.formatted]);

  useEffect(() => {
    const getData = async () => {
      try {
        // This is the initial `provider` that is returned when
        // using web3Modal to connect. Can be MetaMask or WalletConnect.
        const modalProvider = connector?.options?.getProvider?.()
          || (await connector?.getProvider?.());

        if (modalProvider) {
          // *******************************************************
          // ************ setting to the window object! ************
          // *******************************************************
          window.MODAL_PROVIDER = modalProvider;

          if (modalProvider?.on) {
            // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
            const handleChainChanged = () => {
              window.location.reload();
            };

            modalProvider.on('chainChanged', handleChainChanged);

            // cleanup
            return () => {
              if (modalProvider.removeListener) {
                modalProvider.removeListener(
                  'chainChanged',
                  handleChainChanged,
                );
              }
            };
          }
        }

        return () => null;
      } catch (error) {
        console.error(error);
        return () => null;
      }
    };

    if (connector && !isAddressProhibited(address)) {
      getData();
    }
  }, [connector]);

  // Disconnect if the address is prohibited
  useEffect(() => {
    if (address && isAddressProhibited(address)) {
      disconnect();
      notifyError(<CannotConnectAddressOfacError />);
      if (onDisconnectCb) onDisconnectCb();
    }
  }, [address]);

  const screens = useBreakpoint();

  return (
    <LoginContainer>
      {walletConnectedChain?.id === chainId ? null : (
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#FAAD14',
              colorBgBase: '#FFFBE6',
              colorTextBase: '#FAAD14',
              defaultBorderColor: COLOR.ORANGE,
            },
          }}
        >
          <Button
            loading={isOpen}
            type="default"
            onClick={open}
            icon={<WarningOutlined />}
          >
            Wrong Network
          </Button>
        </ConfigProvider>
      )}
      &nbsp;&nbsp;
      <Web3Button
        avatar="hide"
        balance={screens.xs ? 'hide' : 'show'}
        icon={screens.xs ? 'hide' : 'show'}
      />
      <Web3Modal
        projectId={projectId}
        ethereumClient={ethereumClient}
        themeMode={theme}
        themeVariables={{
          '--w3m-button-border-radius': '5px',
          '--w3m-accent-color': COLOR.PRIMARY,
          '--w3m-background-color': COLOR.PRIMARY,
        }}
      />
    </LoginContainer>
  );
};

LoginV2.propTypes = {
  onConnect: PropTypes.func,
  onDisconnect: PropTypes.func,
  theme: PropTypes.string,
};

LoginV2.defaultProps = {
  onConnect: undefined,
  onDisconnect: undefined,
  theme: 'light',
};
