// GenericDataTable.jsx
import React, { useState, useRef, useMemo } from 'react';
import { Button, Space, Input, Select, Tooltip, message, Modal } from 'antd';
import { DownloadOutlined, ReloadOutlined, SettingOutlined, SaveOutlined } from '@ant-design/icons';
import CustomDataTable from './CustomDataTable';
import ContextMenu from './ContextMenu';
import './GenericDataTable.scss';

import * as XLSX from 'xlsx';

const { Option } = Select;

const GenericDataTable = ({
  data = [],
  columns = [],
  loading = false,
  title = "Data Table",
  onRefresh = () => {},
  onExport = null,
  enableGrouping = true,
  enableAggregation = true,
  enableColumnReordering = true,
  contextMenuActions = {},
  slots = {},
  rowClassName = '',
  stickyHeader = true
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    rows: [],
    clickedRow: null,
    type: null,
    columnKey: null
  });
  const [columnsModalVisible, setColumnsModalVisible] = useState(false);
  const [saveViewModalVisible, setSaveViewModalVisible] = useState(false);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [addToGroupModalVisible, setAddToGroupModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [rowsToGroup, setRowsToGroup] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [viewName, setViewName] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [columnOrder, setColumnOrder] = useState([]);

  const tableRef = useRef(null);

  // Handle context menu
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

  // Default export function
  const handleDefaultExport = async () => {
    try {
      message.loading('Preparing Excel file...', 0);

      const columnsState = tableRef.current?.getColumnsState();
      const visibleColumns = columnsState?.selectedColumns || [];

      const exportColumns = columns
        .filter(col => visibleColumns.includes(col.key))
        .map(col => ({
          key: col.key,
          title: col.title
        }));

      const exportData = data.map(row => {
        const exportRow = {};
        exportColumns.forEach(col => {
          let value = row[col.key];
          if (col.key.includes('Amount') || col.key.includes('price') || col.key.includes('amount')) {
            value = value ? `$${Number(value).toLocaleString()}` : '-';
          } else if (typeof value === 'number') {
            value = value.toLocaleString();
          } else if (col.type === 'date' && value) {
            value = new Date(value).toLocaleDateString();
          }
          exportRow[col.title] = value || '-';
        });
        return exportRow;
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Data Export');

      const fileName = `${title.toLowerCase().replace(/\s+/g, '_')}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      message.destroy();
      message.success(`Exported ${exportData.length} records successfully`);
    } catch (error) {
      console.error('Export error:', error);
      message.destroy();
      message.error('Failed to export data');
    }
  };

  // Handle export (custom or default)
  const handleExport = () => {
    if (onExport) {
      onExport(data, selectedRows);
    } else {
      handleDefaultExport();
    }
  };

  // Group management
  const handleCreateNewGroup = (rows) => {
    if (!enableGrouping) return;
    setRowsToGroup(rows);
    setGroupModalVisible(true);
    handleCloseContextMenu();
  };

  const handleAddToExistingGroup = (rows) => {
    if (!enableGrouping) return;
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

  const handleRemoveFromGroup = (row) => {
    if (row._groupId && tableRef.current) {
      tableRef.current.removeFromGroup(row._groupId, row.id);
      message.success('Removed from group successfully');
    }
  };

  // View management
  const handleShowColumnsModal = () => {
    if (tableRef.current) {
      const currentState = tableRef.current.getColumnsState();
      setSelectedColumns(currentState.selectedColumns);
      setColumnOrder(currentState.columnOrder);
    }
    setColumnsModalVisible(true);
    handleCloseContextMenu();
  };

  const handleShowSaveViewModal = () => {
    setSaveViewModalVisible(true);
    handleCloseContextMenu();
  };

  const handleSaveView = () => {
    if (viewName.trim() && tableRef.current) {
      const viewData = tableRef.current.getCurrentView();
      const savedViews = JSON.parse(localStorage.getItem(`${title}_views`) || '[]');
      const newView = {
        id: `view-${Date.now()}`,
        name: viewName.trim(),
        ...viewData,
        createdAt: new Date().toISOString()
      };

      savedViews.push(newView);
      localStorage.setItem(`${title}_views`, JSON.stringify(savedViews));

      setSaveViewModalVisible(false);
      setViewName('');
      message.success('View saved successfully');
    }
  };

  const handleLoadView = (viewId) => {
    const savedViews = JSON.parse(localStorage.getItem(`${title}_views`) || '[]');
    const view = savedViews.find(v => v.id === viewId);
    if (view && tableRef.current) {
      tableRef.current.applyView(view);
      message.success(`View "${view.name}" loaded successfully`);
    }
  };

  // Context menu actions
  const getContextMenuActions = () => {
    const actions = [];
    const rows = contextMenu.rows;
    const clickedRow = contextMenu.clickedRow;
    const isHeaderMenu = contextMenu.type === 'header';
    const columnKey = contextMenu.columnKey;

    if (isHeaderMenu) {
      const column = columns.find(col => col.key === columnKey);
      
      // Best Fit
      actions.push({
        label: tableRef.current?.isBestFitEnabled() ? 'Disable Best Fit' : 'Enable Best Fit',
        onClick: () => tableRef.current?.toggleBestFit()
      });

      // Group by actions
      if (enableGrouping) {
        actions.push({
          label: `Group by ${column?.title}`,
          onClick: () => tableRef.current?.groupByColumn(columnKey)
        });

        actions.push({
          label: `Ungroup by ${column?.title}`,
          onClick: () => tableRef.current?.ungroupByColumn(columnKey)
        });
      }

      // Aggregation actions
      if (enableAggregation && column?.type === 'number') {
        actions.push({
          label: `Sum ${column?.title}`,
          onClick: () => tableRef.current?.aggregateColumn(columnKey, 'sum')
        });
        actions.push({
          label: `Average ${column?.title}`,
          onClick: () => tableRef.current?.aggregateColumn(columnKey, 'average')
        });
      }
    } else {
      // Row actions
      const isMultiple = rows.length > 1;
      const isGroupedItem = clickedRow?._isGroupedItem;
      const hasExistingGroups = availableGroups.length > 0;

      // Custom context menu actions
      if (contextMenuActions.rowActions) {
        actions.push(...contextMenuActions.rowActions(rows, clickedRow));
      }

      // Group actions
      if (enableGrouping) {
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

        if (isGroupedItem) {
          actions.push({
            label: 'Remove from Group',
            onClick: () => handleRemoveFromGroup(clickedRow)
          });
        }
      }
    }

    // Common actions
    actions.push({
      label: 'Show/Hide Columns',
      onClick: handleShowColumnsModal
    });

    return actions;
  };

  // Get saved views
  const savedViews = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(`${title}_views`) || '[]');
    } catch (error) {
      console.error('Error loading saved views:', error);
      return [];
    }
  }, [title]);

  return (
    <div className="generic-data-table">
      <div className="table-toolbar">
        <Space>
          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
            Refresh
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={data.length === 0}
          >
            Export ({data.length})
          </Button>
          <Button
            icon={<SaveOutlined />}
            onClick={handleShowSaveViewModal}
            disabled={data.length === 0}
          >
            Save Current View
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={handleShowColumnsModal}
            disabled={data.length === 0}
          >
            Show/Hide Columns
          </Button>

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
        columns={columns}
        loading={loading}
        selection={true}
        onSelectionChange={setSelectedRows}
        onSort={(key, direction) => console.log('Sorting by:', key, direction)}
        onContextMenu={handleContextMenu}
        slots={slots}
        rowClassName={rowClassName}
        stickyHeader={stickyHeader}
        enableGrouping={enableGrouping}
        enableAggregation={enableAggregation}
        enableColumnReordering={enableColumnReordering}
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

      {/* Modals */}
      <Modal
        open={groupModalVisible}
        onClose={() => setGroupModalVisible(false)}
        title="Create New Group"
        onOk={handleConfirmNewGroup}
        onCancel={() => setGroupModalVisible(false)}
      >
        <Input
          placeholder="Group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          onPressEnter={handleConfirmNewGroup}
          autoFocus
        />
      </Modal>

      <Modal
        open={addToGroupModalVisible}
        onClose={() => setAddToGroupModalVisible(false)}
        title="Add to Existing Group"
        onOk={handleConfirmAddToGroup}
        onCancel={() => setAddToGroupModalVisible(false)}
      >
        <Select
          placeholder="Select group"
          style={{ width: '100%' }}
          value={selectedGroup}
          onChange={setSelectedGroup}
        >
          {availableGroups.map((group) => (
            <Option key={group.id} value={group.id}>
              {group.name} ({group.count} items)
            </Option>
          ))}
        </Select>
      </Modal>

      <Modal
        open={columnsModalVisible}
        onClose={() => setColumnsModalVisible(false)}
        title="Configure Columns"
        onOk={() => {
          if (tableRef.current) {
            tableRef.current.updateColumns(selectedColumns, columnOrder);
          }
          setColumnsModalVisible(false);
          message.success('Columns updated successfully');
        }}
        onCancel={() => setColumnsModalVisible(false)}
        width={800}
      >
        <div className="columns-configuration">
            <div className="columns-list">

          {columns.map((column) => (
            <label key={column.key} className="column-item">
              <input
                type="checkbox"
                checked={selectedColumns.includes(column.key)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedColumns((prev) => [...prev, column.key]);
                  } else {
                    setSelectedColumns((prev) => prev.filter((key) => key !== column.key));
                  }
                }}
              />
              <span className="column-title">{column.title}</span>
              <span className="column-type">{column.type}</span>
            </label>
          ))}
            </div>
        </div>
      </Modal>

      <Modal
        open={saveViewModalVisible}
        onClose={() => setSaveViewModalVisible(false)}
        title="Save Current View"
        onOk={handleSaveView}
        onCancel={() => setSaveViewModalVisible(false)}
      >
        <Input
          placeholder="View name"
          value={viewName}
          onChange={(e) => setViewName(e.target.value)}
          onPressEnter={handleSaveView}
          autoFocus
        />
      </Modal>
    </div>
  );
};

export default GenericDataTable;