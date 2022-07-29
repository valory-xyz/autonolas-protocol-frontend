import PropTypes from 'prop-types';
import Link from 'next/link';
import { Alert } from 'antd';
import bs58 from 'bs58';
import { ExternalLink } from 'react-feather';
import { EmptyMessage, RegisterFooter } from 'components/styles';
import { WhiteButton } from '../components/Button';

// constants
export const DEPENDENCY_IN_ASC = 'Agent IDs must be input in the order they were created (oldest first & newest last)';

// ----------- functions -----------
/**
 *
 * @param {String}
 * @returns {Array}
 */
export const convertStringToArray = (str) => (str ? str.split(',').map((e) => e.trim()) : str);

// E.g. "0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231"
// --> "QmNSUYVKDSvPUnRLKmuxk9diJ6yS96r1TrAXzjTiBcCLAL"
export const getIpfsHashFromBytes32 = (bytes32Hex) => {
  if (!bytes32Hex) return null;

  // Add our default ipfs values for first 2 bytes:
  // function:0x12=sha2, size:0x20=256 bits
  // and cut off leading "0x"
  const hashHex = `1220${bytes32Hex.slice(2)}`;
  const hashBytes = Buffer.from(hashHex, 'hex');
  const hashStr = bs58.encode(hashBytes);
  return hashStr;
};

// ----------- components -----------
export const MyLink = ({ children, href, ...linkProps }) => (
  <Link {...linkProps} href={href}>
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  </Link>
);
MyLink.propTypes = {
  children: PropTypes.node.isRequired,
  href: PropTypes.string.isRequired,
};

const dependencyHelperText = 'Must be in ascending order – newest agents first, oldest last.';
export const DependencyLabel = ({ type }) => (
  <div className="label-helper-text">
    {type === 'agent' ? (
      <>
        Comma-separated list of agent IDs which this agent requires. Find IDs
        on&nbsp;
        <MyLink href="/agents">
          Agents
          <ExternalLink size={12} />
        </MyLink>
        &nbsp;page.&nbsp;
        {dependencyHelperText}
      </>
    ) : (
      <>
        Comma-separated list of component IDs which this component requires.
        Find IDs on&nbsp;
        <MyLink href="/">
          Components
          <ExternalLink size={12} />
        </MyLink>
        &nbsp;page.&nbsp;
        {dependencyHelperText}
      </>
    )}
  </div>
);
DependencyLabel.propTypes = { type: PropTypes.string };
DependencyLabel.defaultProps = { type: 'component' };

export const RegisterMessage = ({ handleCancel }) => (
  <RegisterFooter>
    <p>To register, connect to wallet</p>
    {handleCancel && <WhiteButton onClick={handleCancel}>Cancel</WhiteButton>}
  </RegisterFooter>
);
RegisterMessage.propTypes = { handleCancel: PropTypes.func };
RegisterMessage.defaultProps = { handleCancel: null };

export const ListEmptyMessage = ({ type }) => {
  const getValues = () => {
    switch (type) {
      case 'component':
        return {
          text: 'component',
        };
      case 'service':
        return {
          text: 'service',
        };
      case 'operator':
        return {
          text: 'operator',
        };
      case 'agent':
        return {
          text: 'agent',
        };
      default:
        return null;
    }
  };

  const currentType = getValues();

  if (!currentType) {
    return <EmptyMessage>Please check type!</EmptyMessage>;
  }

  return (
    <EmptyMessage data-testid="not-registered-message">
      <div className="empty-message-logo" />
      <p>{`No ${currentType.text}s registered`}</p>
    </EmptyMessage>
  );
};
ListEmptyMessage.propTypes = { type: PropTypes.string };
ListEmptyMessage.defaultProps = { type: null };

// PrintJson
export const PrintJson = ({ value }) => (
  <pre>{JSON.stringify(value || {}, null, 2)}</pre>
);
PrintJson.propTypes = { value: PropTypes.shape({}).isRequired };

// AlertInfo
export const AlertInfo = ({ type, information }) => {
  if (!information) return null;
  return (
    <Alert
      message={`${type || 'Registered'} successfully!`}
      description={(
        <div data-testid="alert-info-container">
          <PrintJson value={information} />
        </div>
      )}
      type="info"
      showIcon
    />
  );
};
AlertInfo.propTypes = {
  information: PropTypes.shape({}),
  type: PropTypes.string,
};
AlertInfo.defaultProps = {
  information: null,
  type: null,
};

// AlertError
export const AlertError = ({ error }) => {
  if (!error) return null;
  return (
    <Alert
      message="Error on Register!"
      description={(
        <div data-testid="alert-error-container">
          <pre>{error.stack}</pre>
        </div>
      )}
      type="error"
      showIcon
    />
  );
};
AlertError.propTypes = {
  error: PropTypes.shape({ stack: PropTypes.string }),
};
AlertError.defaultProps = { error: null };
