import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import get from 'lodash/get';
import capitalize from 'lodash/capitalize';
import {
  Row, Col, Skeleton, Button,
} from 'antd';
import { NAV_TYPES } from 'util/constants';
import { RegisterMessage } from '../List/ListCommon';
import IpfsHashGenerationModal from '../List/IpfsHashGenerationModal';
import {
  Header,
  DetailsTitle,
  InfoSubHeader,
  Info,
  SectionContainer,
  EachSection,
} from './styles';

const NA = 'NA';
const gt = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
};

const Details = ({
  account,
  id,
  type,
  getDetails,
  handleUpdate,
  onDependencyClick,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [info, setInfo] = useState({});

  useEffect(async () => {
    setIsLoading(true);
    setInfo([]);

    try {
      const temp = await getDetails();
      setInfo(temp);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [account, id]);

  if (isLoading) {
    return <Skeleton active />;
  }

  if (!account) {
    return (
      <>
        <Header>
          <DetailsTitle level={2}>{`${capitalize(type)}`}</DetailsTitle>
        </Header>
        <RegisterMessage />
      </>
    );
  }

  const onUpdate = () => {
    if (handleUpdate) handleUpdate();
  };

  const generateDetails = () => {
    const getComponentAndAgentValues = () => {
      const dependencies = get(info, 'dependencies') || [];
      const isAgent = type === NAV_TYPES.AGENT;
      return [
        { title: 'Owner Address', value: get(info, 'owner', null) || NA },
        {
          title: 'Developer Address',
          value: get(info, 'developer', null) || NA,
        },
        {
          title: 'Hash',
          value: (
            <div>
              {get(info, `${isAgent ? 'agent' : 'component'}Hash`) || NA}
              <Button
                type="primary"
                ghost
                onClick={() => setIsModalVisible(true)}
                className="mb-12"
              >
                Generate Hash
              </Button>
            </div>
          ),
        },
        {
          title: 'Component Dependencies',
          dataTestId: 'details-dependency',
          value:
            dependencies.length === 0 ? (
              <>NA</>
            ) : (
              dependencies.map((e) => (
                <li key={`${type}-dependency-${e}`}>
                  <Button type="link" onClick={() => onDependencyClick(e)}>
                    {e}
                  </Button>
                </li>
              ))
            ),
        },
      ];
    };

    const getServiceValues = () => {
      const dependencies = get(info, 'agentIds') || [];
      return [
        { title: 'Name', value: get(info, 'name', null) || NA },
        { title: 'Owner Address', value: get(info, 'owner', null) || NA },
        {
          title: 'Developer Address',
          value: get(info, 'developer', null) || NA,
        },
        {
          title: 'Active',
          value: get(info, 'active', null) ? 'TRUE' : 'FALSE',
        },
        {
          title: 'Agent IDs',
          value:
            dependencies.length === 0 ? (
              <>NA</>
            ) : (
              dependencies.map((e) => (
                <li key={`${type}-agentId-${e}`}>
                  <Button type="link" onClick={() => onDependencyClick(e)}>
                    {e}
                  </Button>
                </li>
              ))
            ),
        },
        {
          title: 'No. of slots to canonical agent Ids',
          dataTestId: 'agentNumSlots-dependency',
          value: (get(info, 'agentNumSlots') || []).map((e) => (
            <li key={`${type}-agentNumSlots-${e}`}>{e}</li>
          )),
        },
        { title: 'Threshold', value: get(info, 'threshold', null) || NA },
      ];
    };

    const details = type === NAV_TYPES.SERVICE
      ? getServiceValues()
      : getComponentAndAgentValues();

    return (
      <SectionContainer>
        {details.map(({ title, value, dataTestId }, index) => (
          <EachSection key={`${type}-details-${index}`}>
            <InfoSubHeader>{title}</InfoSubHeader>
            <Info data-testid={dataTestId || ''}>{value}</Info>
          </EachSection>
        ))}
      </SectionContainer>
    );
  };

  return (
    <>
      <Header>
        <DetailsTitle level={2}>{`${capitalize(type)} ID ${id}`}</DetailsTitle>
        <Button
          disabled={!handleUpdate}
          type="primary"
          ghost
          onClick={onUpdate}
        >
          Update
        </Button>
      </Header>
      <Row gutter={gt}>
        <Col className="gutter-row" span={12}>
          <InfoSubHeader>Description</InfoSubHeader>
          <div>{get(info, 'description', null) || NA}</div>
        </Col>
        <Col className="gutter-row" span={12}>
          {generateDetails()}
        </Col>
      </Row>

      <IpfsHashGenerationModal
        visible={isModalVisible}
        type={type}
        handleCancel={() => setIsModalVisible(false)}
      />
    </>
  );
};

Details.propTypes = {
  account: PropTypes.string,
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  getDetails: PropTypes.func.isRequired,
  handleUpdate: PropTypes.func,
  onDependencyClick: PropTypes.func,
};

Details.defaultProps = {
  account: null,
  handleUpdate: null,
  onDependencyClick: () => {},
};

const mapStateToProps = (state) => {
  const account = get(state, 'setup.account') || null;
  return { account };
};

export default connect(mapStateToProps, {})(Details);
