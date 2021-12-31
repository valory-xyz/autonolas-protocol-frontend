/* eslint-disable no-console */
// import { useEffect } from 'react';
import PropTypes from 'prop-types';
import Web3 from 'web3';
import { connect } from 'react-redux';
import { useRouter } from 'next/router';
import { Typography, notification } from 'antd';
import RegisterForm from 'common-util/List/RegisterForm';
import {
  MECH_MINTER_ADDRESS,
  MECH_MINTER_CONTRACT,
} from 'common-util/AbiAndAddresses/mechMinter';

const { Title } = Typography;

const RegisterComponents = ({ account }) => {
  const router = useRouter();

  const handleCancel = () => {
    router.push('/');
  };

  const handleSubmit = (values) => {
    if (account) {
      console.log(account);
      window.ethereum.enable();
      const web3 = new Web3(window.web3.currentProvider);

      // contractAddress and abi are setted after contract deploy
      const contract = new web3.eth.Contract(
        MECH_MINTER_CONTRACT.abi,
        MECH_MINTER_ADDRESS,
      );

      contract.methods
        .mintComponent(
          values.dev_address,
          values.to_address,
          values.hash,
          values.description,
          values.dependencies ? values.dependencies.split(', ') : [],
        )
        .call()
        .then((tx) => {
          console.log('Transaction: ', tx);
          notification.success({ message: 'Component Minted' });
        })
        .catch((e) => {
          console.error(e);
        });
    }
  };

  return (
    <>
      <Title level={2}>Register Component</Title>
      <RegisterForm
        listType="component"
        handleSubmit={handleSubmit}
        handleCancel={handleCancel}
      />
    </>
  );
};

RegisterComponents.propTypes = {
  account: PropTypes.string,
};

RegisterComponents.defaultProps = {
  account: null,
};

const mapStateToProps = (state) => {
  const { account, balance } = state.setup;
  return { account, balance };
};

export default connect(mapStateToProps, {})(RegisterComponents);
