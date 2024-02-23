import PropTypes from 'prop-types';
import { Table } from 'antd';
import { Loader, useScreen } from '@autonolas/frontend-library';

import { TOTAL_VIEW_COUNT } from 'util/constants';
import { ListEmptyMessage } from 'common-util/List/ListCommon';
import { useHelpers } from 'common-util/hooks';
import { getData, getTableColumns } from './helpers';

const ListTable = ({
  isLoading,
  type,
  searchValue,
  isPaginationRequired,
  list,
  total,
  currentPage,
  setCurrentPage,
  isAccountRequired,
  onViewClick,
  onUpdateClick,
  extra,
}) => {
  const {
    chainName, account, isSvm, chainId,
  } = useHelpers();
  /**
   * no pagination on search as we won't know total beforehand
   */
  const canShowPagination = isPaginationRequired ? !searchValue : false;
  const { isMobile } = useScreen();

  const { scrollX } = extra;

  if (isLoading) {
    return (
      <Loader
        isAccountRequired={isAccountRequired}
        notConnectedMessage={`To see your ${type}s, connect wallet.`}
      />
    );
  }

  const columns = getTableColumns(type, {
    onViewClick,
    onUpdateClick,
    isMobile,
    chainName,
    chainId,
    account,
  });
  const dataSource = getData(type, list, { current: currentPage });
  const pagination = {
    total,
    current: currentPage,
    defaultPageSize: canShowPagination ? TOTAL_VIEW_COUNT : total,
    onChange: (e) => setCurrentPage(e),
    showSizeChanger: false,
  };

  return (
    <>
      {list.length === 0 ? (
        <ListEmptyMessage
          type={type}
          message={isSvm ? 'No services – do you have SOL in your wallet?' : ''}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={canShowPagination ? pagination : false}
          scroll={{ x: scrollX || 1200 }}
          rowKey={(record) => `${type}-row-${record.id}`}
        />
      )}
    </>
  );
};

ListTable.propTypes = {
  type: PropTypes.string.isRequired,
  searchValue: PropTypes.string.isRequired,
  isPaginationRequired: PropTypes.bool,
  isLoading: PropTypes.bool,
  list: PropTypes.arrayOf(PropTypes.object),
  total: PropTypes.number,
  currentPage: PropTypes.number,
  setCurrentPage: PropTypes.func,
  isAccountRequired: PropTypes.bool,
  onViewClick: PropTypes.func,
  onUpdateClick: PropTypes.func,
  extra: PropTypes.shape({ scrollX: PropTypes.number }),
};

ListTable.defaultProps = {
  isLoading: false,
  isPaginationRequired: true,
  list: [],
  total: 0,
  currentPage: 0,
  setCurrentPage: () => {},
  isAccountRequired: false,
  onViewClick: () => {},
  onUpdateClick: null,
  extra: {},
};

export default ListTable;
