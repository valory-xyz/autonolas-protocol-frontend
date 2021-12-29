import { Typography } from 'antd';
import { useRouter } from 'next/router';

const { Title } = Typography;

const Service = () => {
  const router = useRouter();
  const { id } = router.query;
  console.log(`service_id = ${id}`);

  return (
    <>
      <Title level={2}>Service</Title>
    </>
  );
};

export default Service;
