import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Login as LoginComponent } from '@autonolas/frontend-library';
import {
  setUserAccount as setUserAccountFn,
  setUserBalance as setUserBalanceFn,
  setChainId as setChainIdFn,
  setErrorMessage as setErrorMessageFn,
} from 'store/setup/actions';
import { rpc } from 'common-util/Contracts';
import { getSupportedNetworks } from 'common-util/functions';

const Container = styled.div``;

const Login = ({
  setUserAccount,
  setUserBalance,
  setChainId,
  setErrorMessage,
}) => {
  const onConnect = (response) => {
    setUserAccount(response.address);
    setUserBalance(response.balance);
    setChainId(response.chainId);
  };

  const onDisconnect = () => {
    setUserAccount(null);
    setUserBalance(null);
    setErrorMessage(null);
    setChainId(null);
  };

  const onError = (error) => {
    setErrorMessage(error);
  };

  return (
    <Container>
      <LoginComponent
        rpc={rpc}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        onError={onError}
        supportedNetworks={getSupportedNetworks()}
      />
    </Container>
  );
};

Login.propTypes = {
  setUserAccount: PropTypes.func.isRequired,
  setUserBalance: PropTypes.func.isRequired,
  setChainId: PropTypes.func.isRequired,
  setErrorMessage: PropTypes.func.isRequired,
};

Login.defaultProps = {};

const mapDispatchToProps = {
  setUserAccount: setUserAccountFn,
  setUserBalance: setUserBalanceFn,
  setChainId: setChainIdFn,
  setErrorMessage: setErrorMessageFn,
};

export default connect(null, mapDispatchToProps)(Login);
