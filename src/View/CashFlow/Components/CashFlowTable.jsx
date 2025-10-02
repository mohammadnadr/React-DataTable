// CashFlowTable.jsx
import React, { useState, useMemo, useRef } from 'react';
import { Tag, Space, Button, Input, Select, Tooltip, message } from 'antd';
import { DownloadOutlined, ReloadOutlined, CloseOutlined, SettingOutlined , SaveOutlined } from '@ant-design/icons';
import CustomDataTable from './CustomDataTable';
import ContextMenu from './ContextMenu';
import './CashFlowTable.scss';
import Modal from './Modal';
import * as XLSX from 'xlsx'; // Import XLSX library for Excel export

const { Option } = Select;

const CashFlowTable = ({ data, loading, currentView }) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    rows: [],
    clickedRow: null,
    type: null, // 'header' or 'row'
    columnKey: null // for header context menu
  });
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [addToGroupModalVisible, setAddToGroupModalVisible] = useState(false);
  const [columnsModalVisible, setColumnsModalVisible] = useState(false);
  const [saveViewModalVisible, setSaveViewModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [rowsToGroup, setRowsToGroup] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [viewName, setViewName] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [columnOrder, setColumnOrder] = useState([]);

  const tableRef = useRef(null);

  // Get status color mapping
  const getStatusColor = (status) => {
    const colors = {
      Active: 'green',
      Reversed: 'orange',
      Reversal: 'red',
      Defunct: 'default'
    };
    return colors[status] || 'default';
  };

  const getInvoiceStatusColor = (status) => {
    const colors = {
      'Fully Invoiced': 'success',
      'Partially Invoiced': 'processing',
      'Not Invoiced': 'default'
    };
    return colors[status] || 'default';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'Fully Paid': 'success',
      'Partially Paid': 'warning',
      Unpaid: 'error'
    };
    return colors[status] || 'default';
  };

  const getQuantityStatusColor = (status) => {
    const colors = {
      Contractual: 'blue',
      Actual: 'green',
      Scheduled: 'orange',
      Reversed: 'red',
      Reversal: 'purple'
    };
    return colors[status] || 'default';
  };

  // Handle context menu for rows and headers
  const handleContextMenu = (event, rows, clickedRow, type = 'row', columnKey = null) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      rows: rows,
      clickedRow: clickedRow,
      type: type,
      columnKey: columnKey
    });

    // Update available groups when context menu opens for rows
    if (type === 'row' && tableRef.current) {
      setAvailableGroups(tableRef.current.getAvailableGroups());
    }
  };

  const handleCloseContextMenu = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      rows: [],
      clickedRow: null,
      type: null,
      columnKey: null
    });
  };

  // Action handlers
  const handleSplitCashFlow = (rows) => {
    console.log('Split cash flow for :', rows);
    // Implement view details logic here
  };

  const handleDrillDown = (rows) => {
    console.log('Drill down for:', rows);
    // Implement drill down logic here
  };

  // Handle group by column (header context menu)
  const handleGroupByColumn = (columnKey) => {
    if (tableRef.current) {
      tableRef.current.groupByColumn(columnKey);
    }
    handleCloseContextMenu();
  };

  // Handle ungroup by column
  const handleUngroupByColumn = (columnKey) => {
    if (tableRef.current) {
      tableRef.current.ungroupByColumn(columnKey);
    }
    handleCloseContextMenu();
  };

  // Handle column aggregation (sum, average)
  const handleAggregateColumn = (columnKey, operation) => {
    if (tableRef.current) {
      tableRef.current.aggregateColumn(columnKey, operation);
    }
    handleCloseContextMenu();
  };

  // Handle show columns modal
  const handleShowColumnsModal = () => {
    // Get current columns state from table
    if (tableRef.current) {
      const currentState = tableRef.current.getColumnsState();
      setSelectedColumns(currentState.selectedColumns);
      setColumnOrder(currentState.columnOrder);
    }
    setColumnsModalVisible(true);
    handleCloseContextMenu();
  };

  // Handle save view modal
  const handleShowSaveViewModal = () => {
    setSaveViewModalVisible(true);
    handleCloseContextMenu();
  };

  // Handle save view
  const handleSaveView = () => {
    if (viewName.trim() && tableRef.current) {
      const viewData = tableRef.current.getCurrentView();

      // Save to localStorage (replace with API call later)
      const savedViews = JSON.parse(localStorage.getItem('cashflowViews') || '[]');
      const newView = {
        id: `view-${Date.now()}`,
        name: viewName.trim(),
        ...viewData,
        createdAt: new Date().toISOString()
      };

      savedViews.push(newView);
      localStorage.setItem('cashflowViews', JSON.stringify(savedViews));

      setSaveViewModalVisible(false);
      setViewName('');
      message.success('View saved successfully');
    }
  };

  // Handle load view
  const handleLoadView = (viewId) => {
    const savedViews = JSON.parse(localStorage.getItem('cashflowViews') || '[]');
    const view = savedViews.find(v => v.id === viewId);
    if (view && tableRef.current) {
      tableRef.current.applyView(view);
      message.success(`View "${view.name}" loaded successfully`);
    }
  };

  // Handle new group creation (for manual grouping)
  const handleCreateNewGroup = (rows) => {
    setRowsToGroup(rows);
    setGroupModalVisible(true);
    handleCloseContextMenu();
  };

  // Handle add to existing group
  const handleAddToExistingGroup = (rows) => {
    setRowsToGroup(rows);
    setAddToGroupModalVisible(true);
    handleCloseContextMenu();
  };

  const handleConfirmNewGroup = () => {
    if (groupName.trim() && tableRef.current) {
      tableRef.current.createGroup(groupName.trim(), rowsToGroup);
      setGroupModalVisible(false);
      setGroupName('');
      setRowsToGroup([]);
      message.success(`Group "${groupName}" created successfully`);
    }
  };

  const handleConfirmAddToGroup = () => {
    if (selectedGroup && tableRef.current) {
      tableRef.current.addToGroup(selectedGroup, rowsToGroup);
      setAddToGroupModalVisible(false);
      setSelectedGroup('');
      setRowsToGroup([]);
      const group = availableGroups.find(g => g.id === selectedGroup);
      message.success(`Added to group "${group?.name}" successfully`);
    }
  };

  const handleCancelGroup = () => {
    setGroupModalVisible(false);
    setAddToGroupModalVisible(false);
    setGroupName('');
    setSelectedGroup('');
    setRowsToGroup([]);
  };

  // Handle remove from group
  const handleRemoveFromGroup = (row) => {
    if (row._groupId && tableRef.current) {
      tableRef.current.removeFromGroup(row._groupId, row.id);
      message.success('Removed from group successfully');
    }
  };

  // Handle export to Excel - Export ALL data to Excel file
  const handleExport = async () => {
    try {
      // Show loading message
      message.loading('Preparing Excel file...', 0);

      // Get current visible columns from the table
      const columnsState = tableRef.current?.getColumnsState();
      const visibleColumns = columnsState?.selectedColumns || [];

      // Filter and map columns to get only visible ones with their titles
      const exportColumns = allColumns
        .filter(col => visibleColumns.includes(col.key))
        .map(col => ({
          key: col.key,
          title: col.title
        }));

      // Prepare data for export - use ALL data (not just displayed/processed data)
      const exportData = data.map(row => {
        const exportRow = {};

        exportColumns.forEach(col => {
          let value = row[col.key];

          // Format values based on column type
          if (col.key.includes('Amount') || col.key === 'price') {
            value = value ? `$${Number(value).toLocaleString()}` : '-';
          } else if (col.key === 'premiumDiscount') {
            value = value || 0;
          } else if (col.key === 'costPercentage') {
            value = value ? `${value}%` : '0%';
          } else if (col.key.includes('Date') && value) {
            value = new Date(value).toLocaleDateString();
          } else if (typeof value === 'number') {
            value = value.toLocaleString();
          }

          exportRow[col.title] = value || '-';
        });

        return exportRow;
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'CashFlow Data');

      // Generate Excel file and trigger download
      const fileName = `cashflow_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      // Hide loading message and show success
      message.destroy();
      message.success(`Exported ${exportData.length} records successfully`);

    } catch (error) {
      console.error('Export error:', error);
      message.destroy();
      message.error('Failed to export data');
    }
  };

  // Define all columns
  const allColumns = useMemo(
    () => [
      {
        key: 'cashflowNumber',
        title: 'Cashflow Number',
        width: '150px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'cashflowStatus',
        title: 'Cashflow Status',
        width: '130px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'strategy',
        title: 'Strategy',
        width: '100px',
        sortable: true,
        type: 'number'
      },
      {
        key: 'strategyExternalReference',
        title: 'Strategy Ext Ref',
        width: '150px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'buySell',
        title: 'Buy/Sell',
        width: '100px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'tradeDate',
        title: 'Trade Date',
        width: '120px',
        sortable: true,
        type: 'date'
      },
      {
        key: 'tradeNumber',
        title: 'Trade Number',
        width: '120px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'tradeInternalRef',
        title: 'Trade Internal Ref',
        width: '150px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'commodity',
        title: 'Commodity',
        width: '120px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'material',
        title: 'Material',
        width: '120px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'internalCompany',
        title: 'Internal Company',
        width: '160px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'counterpart',
        title: 'Counterpart',
        width: '150px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'costType',
        title: 'Cost Type',
        width: '140px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'contractQuantity',
        title: 'Contract Qty',
        width: '120px',
        sortable: true,
        type: 'number'
      },
      {
        key: 'quantity',
        title: 'Quantity',
        width: '100px',
        sortable: true,
        type: 'number'
      },
      {
        key: 'quantityUOM',
        title: 'Qty UOM',
        width: '90px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'premiumDiscount',
        title: 'Premium/Discount',
        width: '140px',
        sortable: true,
        type: 'number'
      },
      {
        key: 'price',
        title: 'Price',
        width: '100px',
        sortable: true,
        type: 'number'
      },
      {
        key: 'priceCCY',
        title: 'Price CCY',
        width: '100px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'priceUOM',
        title: 'Price UOM',
        width: '100px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'originalExtendedAmount',
        title: 'Original Amount',
        width: '150px',
        sortable: true,
        type: 'number'
      },
      {
        key: 'costPercentage',
        title: 'Cost %',
        width: '90px',
        sortable: true,
        type: 'number'
      },
      {
        key: 'extendedAmount',
        title: 'Extended Amount',
        width: '150px',
        sortable: true,
        type: 'number'
      },
      {
        key: 'invoiceNumber',
        title: 'Invoice Number',
        width: '140px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'invoiceStatus',
        title: 'Invoice Status',
        width: '140px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'payableReceivables',
        title: 'Payable/Receivables',
        width: '160px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'paymentDueDate',
        title: 'Payment Due Date',
        width: '150px',
        sortable: true,
        type: 'date'
      },
      {
        key: 'adjustedDueDate',
        title: 'Adjusted Due Date',
        width: '150px',
        sortable: true,
        type: 'date'
      },
      {
        key: 'paymentStatus',
        title: 'Payment Status',
        width: '140px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'paymentDate',
        title: 'Payment Date',
        width: '120px',
        sortable: true,
        type: 'date'
      },
      {
        key: 'itineraryNumber',
        title: 'Itinerary Number',
        width: '140px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'deliveryNumber',
        title: 'Delivery Number',
        width: '140px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'storage',
        title: 'Storage',
        width: '120px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'level',
        title: 'Level',
        width: '100px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'commencementDate',
        title: 'Commencement Date',
        width: '150px',
        sortable: true,
        type: 'date'
      },
      {
        key: 'pricingStartDate',
        title: 'Pricing Start Date',
        width: '150px',
        sortable: true,
        type: 'date'
      },
      {
        key: 'pricingEndDate',
        title: 'Pricing End Date',
        width: '150px',
        sortable: true,
        type: 'date'
      },
      {
        key: 'quantityStatus',
        title: 'Quantity Status',
        width: '130px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'exposure',
        title: 'Exposure',
        width: '100px',
        sortable: true,
        type: 'number'
      },
      {
        key: 'priceSource',
        title: 'Price Source',
        width: '120px',
        sortable: true,
        type: 'string'
      },
      {
        key: 'paymentDescription',
        title: 'Payment Description',
        width: '160px',
        sortable: true,
        type: 'string'
      }
    ],
    []
  );

  // Define custom slots for columns
  const slots = useMemo(
    () => ({
      cashflowStatus: ({ value }) => (
        <Tooltip title={value} placement="topLeft">
          <Tag color={getStatusColor(value)}>{value}</Tag>
        </Tooltip>
      ),
      buySell: ({ value }) => (
        <Tooltip title={value} placement="topLeft">
          <Tag color={value === 'Buy' ? 'blue' : 'purple'}>{value}</Tag>
        </Tooltip>
      ),
      invoiceStatus: ({ value }) => (
        <Tooltip title={value} placement="topLeft">
          <Tag color={getInvoiceStatusColor(value)}>{value}</Tag>
        </Tooltip>
      ),
      paymentStatus: ({ value }) => (
        <Tooltip title={value} placement="topLeft">
          <Tag color={getPaymentStatusColor(value)}>{value}</Tag>
        </Tooltip>
      ),
      quantityStatus: ({ value }) => (
        <Tooltip title={value} placement="topLeft">
          <Tag color={getQuantityStatusColor(value)}>{value}</Tag>
        </Tooltip>
      ),
      payableReceivables: ({ value }) => (
        <Tooltip title={value} placement="topLeft">
          <Tag color={value === 'Payable' ? 'red' : 'green'}>{value}</Tag>
        </Tooltip>
      ),
      quantity: ({ value, row }) => (
        <Tooltip title={value?.toLocaleString()} placement="topLeft">
          <span
            style={{
              color: row.buySell === 'Buy' ? '#1890ff' : '#cf1322',
              fontWeight: 500
            }}>
            {value?.toLocaleString()}
          </span>
        </Tooltip>
      ),
      contractQuantity: ({ value, row }) => (
        <Tooltip title={value?.toLocaleString()} placement="topLeft">
          <span
            style={{
              color: row.buySell === 'Buy' ? '#1890ff' : '#cf1322',
              fontWeight: 500
            }}>
            {value?.toLocaleString()}
          </span>
        </Tooltip>
      ),
      price: ({ value }) => (
        <Tooltip title={value ? `$${value?.toFixed(2)}` : '-'} placement="topLeft">
          {value ? `$${value?.toFixed(2)}` : '-'}
        </Tooltip>
      ),
      extendedAmount: ({ value, row }) => (
        <Tooltip title={value ? `$${value?.toLocaleString()}` : '-'} placement="topLeft">
          <span
            style={{
              color: row.buySell === 'Buy' ? '#cf1322' : '#1890ff',
              fontWeight: 600
            }}>
            {value ? `$${value?.toLocaleString()}` : '-'}
          </span>
        </Tooltip>
      ),
      originalExtendedAmount: ({ value, row }) => (
        <Tooltip title={value ? `$${value?.toLocaleString()}` : '-'} placement="topLeft">
          <span
            style={{
              color: row.buySell === 'Buy' ? '#cf1322' : '#1890ff',
              fontWeight: 600
            }}>
            {value ? `$${value?.toLocaleString()}` : '-'}
          </span>
        </Tooltip>
      ),
      premiumDiscount: ({ value }) => (
        <Tooltip title={value || 0} placement="topLeft">
          <span
            style={{
              color: value >= 0 ? '#52c41a' : '#ff4d4f',
              fontWeight: 500
            }}>
            {value >= 0 ? '+' : ''}
            {value || 0}
          </span>
        </Tooltip>
      ),
      costPercentage: ({ value }) => (
        <Tooltip title={`${value || 0}%`} placement="topLeft">
          <span
            style={{
              color: value > 0 ? '#1890ff' : '#666',
              fontWeight: 500
            }}>
            {value || 0}%
          </span>
        </Tooltip>
      )
    }),
    []
  );

  // Handle sorting
  const handleSort = (key, direction) => {
    console.log('Sorting by:', key, direction);
    // Sorting is handled internally in CustomDataTable
  };

  const handleRefresh = async () => {
    console.log('Refreshing data...');
    // Implement refresh logic here
    message.info('Refreshing data...');
  };

  // Filter columns based on current view
  const filteredColumns = useMemo(() => {
    if (currentView && currentView.columns) {
      return allColumns.filter((col) => currentView.columns.includes(col.key));
    }
    return allColumns;
  }, [allColumns, currentView]);

  // Prepare context menu actions based on context (header vs row)
  const getContextMenuActions = () => {
    const actions = [];
    const rows = contextMenu.rows;
    const clickedRow = contextMenu.clickedRow;
    const isHeaderMenu = contextMenu.type === 'header';
    const columnKey = contextMenu.columnKey;

    if (isHeaderMenu) {
      const column = allColumns.find(col => col.key === columnKey);
      // Best Fit
      actions.push({
        label: tableRef.current?.isBestFitEnabled() ? 'Disable Best Fit' : 'Enable Best Fit',
        onClick: () => tableRef.current?.toggleBestFit()
      });

      // Group by actions
      actions.push({
        label: `Group by ${column?.title}`,
        onClick: () => handleGroupByColumn(columnKey)
      });

      // Ungroup action if currently grouped by this column
      actions.push({
        label: `Ungroup by ${column?.title}`,
        onClick: () => handleUngroupByColumn(columnKey)
      });

      // Aggregation actions for numeric columns
      if (column?.type === 'number') {
        actions.push({
          label: `Sum ${column?.title}`,
          onClick: () => handleAggregateColumn(columnKey, 'sum')
        });
        actions.push({
          label: `Average ${column?.title}`,
          onClick: () => handleAggregateColumn(columnKey, 'average')
        });
      }
    }



    // Row-specific actions
    if (!isHeaderMenu) {
      const isMultiple = rows.length > 1;
      const isGroupedItem = clickedRow?._isGroupedItem;
      const hasExistingGroups = availableGroups.length > 0;

      actions.push(
        {
          label: 'Split Cash Flow',
          onClick: () => handleSplitCashFlow(rows)
        },
        {
          label: 'Drill Down',
          onClick: () => handleDrillDown(rows)
        }
      );

      // Group actions for multiple selection
      if (isMultiple) {
        actions.push({
          label: 'Create New Group',
          onClick: () => handleCreateNewGroup(rows)
        });

        if (hasExistingGroups) {
          actions.push({
            label: 'Add to Existing Group',
            onClick: () => handleAddToExistingGroup(rows)
          });
        }
      }

      // Remove from group action for grouped items
      if (isGroupedItem) {
        actions.push({
          label: 'Remove from Group',
          onClick: () => handleRemoveFromGroup(clickedRow)
        });
      }
    }

    return actions;
  };

  // Get saved views from localStorage
  const savedViews = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('cashflowViews') || '[]');
    } catch (error) {
      console.error('Error loading saved views:', error);
      return [];
    }
  }, []);

  return (
    <div className="cashflow-table">
      <div className="table-toolbar">
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            Refresh
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={data.length === 0} // Disable if no data
          >
            Export ({data.length}) {/* Show total record count */}
          </Button>
          <Button
            icon={<SaveOutlined />}
            onClick={handleShowSaveViewModal}
            disabled={data.length === 0} // Disable if no data
          >Save Current View</Button>
          <Button
            icon={<SettingOutlined />}
            onClick={handleShowColumnsModal}
            disabled={data.length === 0} // Disable if no data
          >Show/Hide Columns</Button>

          {/* Saved Views Dropdown */}
          {savedViews.length > 0 && (
            <Select
              placeholder="Load Saved View"
              style={{ width: 200 }}
              onChange={handleLoadView}
            >
              {savedViews.map(view => (
                <Option key={view.id} value={view.id}>
                  {view.name}
                </Option>
              ))}
            </Select>
          )}
        </Space>

        <div className="table-info">
          Showing {data.length} records
          {selectedRows.length > 0 && ` (${selectedRows.length} selected)`}
        </div>
      </div>

      <CustomDataTable
        ref={tableRef}
        data={data}
        columns={filteredColumns}
        allColumns={allColumns}
        loading={loading}
        selection={true}
        onSelectionChange={setSelectedRows}
        onSort={handleSort}
        onContextMenu={handleContextMenu}
        slots={slots}
        rowClassName="cashflow-row"
        stickyHeader={true}
      />

      {/* Context Menu */}
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          actions={getContextMenuActions()}
        />
      )}

      {/* Create New Group Modal */}
      <Modal
        open={groupModalVisible}
        onClose={handleCancelGroup}
        title="Create New Group"
        onSubmit={handleConfirmNewGroup}
        submitLabel="Create Group"
        cancelLabel="Cancel"
        persistent={false}
        maxWidth={500}
      >
        <div className="modal-content-wrapper">
          <p className="modal-description">
            Enter a name for the new group containing {rowsToGroup.length} items:
          </p>
          <Input
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onPressEnter={handleConfirmNewGroup}
            autoFocus
            className="custom-input"
          />
        </div>
      </Modal>

      {/* Add to Existing Group Modal */}
      <Modal
        open={addToGroupModalVisible}
        onClose={handleCancelGroup}
        title="Add to Existing Group"
        showDefaultActions={true}
        onSubmit={handleConfirmAddToGroup}
        submitLabel="Apply"
        cancelLabel="Cancel"
        persistent={false}
        maxWidth={500}
      >
        <div className="modal-content-wrapper">
          <p className="modal-description">
            Select a group to add {rowsToGroup.length} items:
          </p>
          <Select
            placeholder="Select group"
            style={{ width: '100%' }}
            value={selectedGroup}
            onChange={setSelectedGroup}
            className="custom-select"
          >
            {availableGroups.map((group) => (
              <Option key={group.id} value={group.id}>
                {group.name} ({group.count} items)
              </Option>
            ))}
          </Select>
        </div>
      </Modal>

      {/* Columns Configuration Modal */}
      <Modal
        open={columnsModalVisible}
        onClose={() => setColumnsModalVisible(false)}
        title="Configure Columns"
        onSubmit={() => {
          if (tableRef.current) {
            tableRef.current.updateColumns(selectedColumns, columnOrder);
          }
          setColumnsModalVisible(false);
          message.success('Columns updated successfully');
        }}
        submitLabel='Apply'
        persistent={true}
        maxWidth={800}
      >
        <div className="modal-content-wrapper">
          <p className="modal-description">
            Select and reorder columns to display in the table:
          </p>

          <div className="columns-configuration">
            <div className="columns-list">
              {allColumns.map((column) => {
                const id = `col-${column.key}`;
                const checked = selectedColumns.includes(column.key);

                // helper: toggle function
                const toggle = () => {
                  if (!checked) {
                    setSelectedColumns((prev) => [...prev, column.key]);
                  } else {
                    setSelectedColumns((prev) => prev.filter((key) => key !== column.key));
                  }
                };

                return (
                  <label
                    key={column.key}
                    // نکته: htmlFor را برمی‌داریم تا رفتار پیش‌فرضِ لیبل فعال نشود
                    // htmlFor={id}
                    className={`column-item clickable ${checked ? 'is-checked' : ''}`}
                    onClick={(e) => {
                      // بسیار مهم: جلوگیری از رفتار پیش‌فرض لیبل که باعث دوبار-تاگل می‌شود
                      e.preventDefault();
                      toggle();
                    }}
                    onKeyDown={(e) => {
                      // دسترسی‌پذیری: Space/Enter هم toggle کند
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        toggle();
                      }
                    }}
                    role="checkbox"
                    aria-checked={checked}
                    tabIndex={0} // کل آیتم فوکوس‌پذیر
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      id={id}
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        // اگر مستقیماً روی خود input کلیک شد، همین‌جا هندل می‌کنیم
                        if (e.target.checked) {
                          setSelectedColumns((prev) => [...prev, column.key]);
                        } else {
                          setSelectedColumns((prev) => prev.filter((key) => key !== column.key));
                        }
                      }}
                      style={{ marginRight: 8, pointerEvents: 'auto' }}
                    />
                    <span className="column-title">{column.title}</span>
                    <span className="column-type">{column.type}</span>
                  </label>
                );
              })}
            </div>


            {/* (Optional) If you later want drag-reorder inside modal, you can add a DnD list here
          and, on drop, update `setColumnOrder(newOrderKeys)` directly. */}
          </div>
        </div>
      </Modal>

      {/* Save View Modal */}
      <Modal
        open={saveViewModalVisible}
        onClose={() => setSaveViewModalVisible(false)}
        title="Save Current View"
        onSubmit={handleSaveView}
        submitLabel="Save View"
        cancelLabel="Cancel"
        persistent={false}
        maxWidth={500}
      >
        <div className="modal-content-wrapper">
          <p className="modal-description">
            Enter a name for this view configuration:
          </p>
          <Input
            placeholder="View name"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            onPressEnter={handleSaveView}
            autoFocus
            className="custom-input"
          />
        </div>
      </Modal>
    </div>
  );
};

export default CashFlowTable;