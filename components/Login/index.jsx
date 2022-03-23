import { useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { Button, Alert } from 'antd';
import { ethers } from 'ethers';
import { CONSTANTS } from 'util/constants';
import {
  setUserAccount as setUserAccountFn,
  setUserBalance as setUserBalanceFn,
  setErrorMessage as setErrorMessageFn,
  setLoaded as setLoadedFn,
} from 'store/setup/actions';
import { EllipsisMiddle } from 'common-util/List/ListTable/helpers';
import { Container, DetailsContainer, MetamaskContainer } from './styles';

const Login = ({
  isLoaded,
  account,
  balance,
  errorMessage,
  setUserAccount,
  setUserBalance,
  setErrorMessage,
  setLoaded,
}) => {
  const getBalance = (accoundPassed) => {
    window.ethereum
      .request({
        method: CONSTANTS.ETH_GETBALANCE,
        params: [accoundPassed, 'latest'],
      })
      .then((b) => {
        setUserBalance(ethers.utils.formatEther(b));
      })
      .catch((e) => {
        setErrorMessage(e.message);
      });
  };

  const handleLogin = () => {
    if (window.ethereum && window.ethereum.isMetaMask) {
      // remove `disconnect` from localStorage
      localStorage.removeItem(CONSTANTS.DISCONNECT);

      window.ethereum
        .request({ method: CONSTANTS.ETH_REQUESTACCOUNTS })
        .then((result) => {
          // setting only the 1st account
          setUserAccount(result[0]);
          getBalance(result[0]);
        })
        .catch((e) => {
          setErrorMessage(e.message);
        });
    } else {
      setErrorMessage('Please install MetaMask browser extension');
    }
  };

  // set `disconenct` to localStorage for reference
  const handleDisconnect = () => {
    localStorage.setItem(CONSTANTS.DISCONNECT, true);
    setLoaded(false);
    setUserAccount(null);
    setUserBalance(null);
  };

  /**
   * if already loaded, set account and balance of the user.
   */
  useEffect(() => {
    if (isLoaded && !account) {
      handleLogin();
    }
  }, [isLoaded]);

  /**
   * listener for account, chain changes
   */
  const handleAccountChange = (newAccount) => {
    setUserAccount(newAccount);
    getBalance(newAccount.toString());
  };

  // reload the page to on chain change to avoid errors
  const handleChainChange = () => {
    window.location.reload();
  };

  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('accountsChanged', handleAccountChange);
    window.ethereum.on('chainChanged', handleChainChange);
  }

  if (!account) {
    return (
      <Container>
        <Button
          type="primary"
          onClick={handleLogin}
          data-testid="connect-metamask"
        >
          Connect MetaMask
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <DetailsContainer>
        {errorMessage ? (
          <Alert
            message={errorMessage}
            type="error"
            showIcon
            data-testid="login-error"
          />
        ) : (
          <MetamaskContainer>
            <div>{balance ? `${balance} ETH` : 'NA'}</div>
            <div className="dash" />
            <EllipsisMiddle>{account ? `${account}` : 'NA'}</EllipsisMiddle>
            <Button type="primary" ghost onClick={handleDisconnect}>
              Disconnect
            </Button>
          </MetamaskContainer>
        )}
      </DetailsContainer>
    </Container>
  );
};

Login.propTypes = {
  isLoaded: PropTypes.bool.isRequired,
  account: PropTypes.string,
  balance: PropTypes.string,
  errorMessage: PropTypes.string,
  setUserAccount: PropTypes.func.isRequired,
  setUserBalance: PropTypes.func.isRequired,
  setErrorMessage: PropTypes.func.isRequired,
  setLoaded: PropTypes.func.isRequired,
};

Login.defaultProps = {
  account: null,
  balance: null,
  errorMessage: null,
};

const mapStateToProps = (state) => {
  const {
    isLoaded, account, balance, errorMessage,
  } = get(state, 'setup', {});
  return {
    isLoaded,
    account,
    balance,
    errorMessage,
  };
};

const mapDispatchToProps = {
  setUserAccount: setUserAccountFn,
  setUserBalance: setUserBalanceFn,
  setErrorMessage: setErrorMessageFn,
  setLoaded: setLoadedFn,
};

export default connect(mapStateToProps, mapDispatchToProps)(Login);
