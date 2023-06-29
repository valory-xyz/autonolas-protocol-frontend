import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { Button, Skeleton } from 'antd/lib';

const Container = styled.div`
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

const TIMEOUT_IN_MINUTES = 10;

const DEFAULT_MESSAGE = 'Items couldn’t be loaded';

const Loader = ({ isAccountRequired, message }) => {
  const [minutes, setMinutes] = useState(TIMEOUT_IN_MINUTES);
  const account = useSelector((state) => get(state, 'setup.account'));

  useEffect(() => {
    let interval = null;
    if (minutes > 0) {
      interval = setInterval(() => {
        setMinutes((s) => s - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [minutes]);

  if (isAccountRequired && !account) {
    return (
      <Container>
        <p>{message || DEFAULT_MESSAGE}</p>
      </Container>
    );
  }

  if (minutes === 0) {
    return (
      <Container>
        <p>{message || DEFAULT_MESSAGE}</p>
        <Button ghost type="primary" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </Container>
    );
  }

  return <Skeleton active />;
};

Loader.propTypes = {
  isAccountRequired: PropTypes.bool,
  message: PropTypes.string,
};

Loader.defaultProps = {
  isAccountRequired: false,
  message: '',
};

export default Loader;
