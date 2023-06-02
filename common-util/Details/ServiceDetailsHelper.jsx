/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Button,
  Typography,
  Input,
  notification,
  Switch,
  Form,
} from 'antd/lib';
import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import {
  checkIfServiceIsWhitelisted,
  setOperatorsCheckRequest,
  setOperatorsStatusesRequest,
  checkIfServiceRequiresWhiltelisting,
} from './ServiceState/utils';

const { Text } = Typography;

export const OperatorWhitelist = ({ isOwner, id }) => {
  const account = useSelector((state) => state?.setup?.account);
  const [form] = Form.useForm();

  const [isCheckLoading, setIsCheckLoading] = useState(false);
  const [isWhiteListed, setIsWhiteListed] = useState(false);
  const [switchValue, setSwitchValue] = useState(isWhiteListed);

  // switch
  useEffect(() => {
    setSwitchValue(isWhiteListed);
  }, [isWhiteListed]);

  // get operator whitelist
  const setOpWhitelist = async () => {
    const whiteListRes = await checkIfServiceRequiresWhiltelisting(id);
    setIsWhiteListed(whiteListRes);
  };

  useEffect(() => {
    if (id) {
      setOpWhitelist();
    }
  }, [id]);

  const onCheck = async (values) => {
    try {
      setIsCheckLoading(true);
      const isValid = await checkIfServiceIsWhitelisted(
        id,
        values.operatorAddress,
      );

      const message = `Operator ${values.operatorAddress} is ${
        isValid ? '' : 'not'
      } whitelisted`;
      notification.success({ message });
    } catch (error) {
      console.error(error);
    } finally {
      setIsCheckLoading(false);
    }
  };

  return (
    <>
      <Switch
        disabled={!isOwner}
        checked={switchValue}
        checkedChildren="Enabled"
        unCheckedChildren="Disabled"
        onChange={async (checked) => {
          setSwitchValue(checked);
          if (!checked) {
            await setOperatorsCheckRequest({
              account,
              serviceId: id,
              isChecked: false,
            });
            await setOpWhitelist();
          }
        }}
      />

      {isWhiteListed && (
        <>
          <br />
          <Text>Check if Operator Address is whitelisted?</Text>
          <Form
            layout="inline"
            form={form}
            name="dynamic_form_complex"
            onFinish={onCheck}
            autoComplete="off"
          >
            <Form.Item
              label="Operator Address"
              name="operatorAddress"
              rules={[{ required: true, message: 'Please input the address' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item>
              <Button
                htmlType="submit"
                loading={isCheckLoading}
                disabled={!account}
              >
                Check
              </Button>
            </Form.Item>
          </Form>
        </>
      )}
    </>
  );
};

export const SetOperatorStatus = ({ id }) => {
  const account = useSelector((state) => state?.setup?.account);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  const onSubmit = async (values) => {
    try {
      setIsSubmitLoading(true);
      await setOperatorsStatusesRequest({
        account,
        serviceId: id,
        operatorAddresses: values.operatorAddress,
        operatorStatuses: values.status.map((e) => Boolean(e)),
      });
      notification.success({
        message: 'Operator status updated',
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <>
      <DynamicFieldsForm
        isLoading={isSubmitLoading}
        onSubmit={onSubmit}
        submitButtonText="Submit"
      />
      <Text type="secondary">
        By submitting will instantly enable whitelisting
      </Text>
    </>
  );
};
