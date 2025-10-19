// GenericDataTable.jsx
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Button, Space, Input, Select, message } from 'antd';
import { toast, Bounce } from 'react-toastify';

import Modal from './Modal';
import { DownloadOutlined, ReloadOutlined, SettingOutlined, SaveOutlined, CloseOutlined, FilterOutlined } from '@ant-design/icons';
import CustomDataTable from './CustomDataTable';
import ContextMenu from './ContextMenu';

import SearchableComboBox from './SearchableComboBox';
import CustomTextInput from './CustomTextInput';
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
                              enableGrouping = false,
                              enableAggregation = false,
                              enableColumnReordering = false,
                              contextMenuActions = {},
                              slots = {},
                              rowClassName = '',
                              stickyHeader = true,
                              customButtons = [],
                              customToolbarComponents = [],
                              modalMode = false,
                              hideToolbar = false,
                              onSelectionChange = null,
                              selection = true
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
    const [viewName, setViewName] = useState('');
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [columnOrder, setColumnOrder] = useState([]);
    const [savedViews, setSavedViews] = useState([]);

    // Filter related states
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [currentFilterColumn, setCurrentFilterColumn] = useState(null);
    const [filterType, setFilterType] = useState(null);
    const [filterValue, setFilterValue] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [isFilterActive, setIsFilterActive] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});

    const tableRef = useRef(null);

    // Load saved views from localStorage
    useEffect(() => {
        if (modalMode) return;
        try {
            const localViews = JSON.parse(localStorage.getItem(`${title}_views`) || '[]');
            setSavedViews(localViews);
        } catch (error) {
            console.error('Error loading saved views:', error);
            toast.error('Error loading saved views:');
            setSavedViews([]);
        }
    }, [title]);

    // Apply all active filters to data
    const applyAllFilters = (filters, originalData) => {
        if (Object.keys(filters).length === 0) {
            return originalData;
        }

        return originalData.filter(row => {
            return Object.entries(filters).every(([columnKey, filterInfo]) => {
                const rowValue = parseFloat(row[columnKey]);
                if (isNaN(rowValue)) return false;

                switch (filterInfo.type) {
                    case 'equal':
                        return rowValue === filterInfo.value;
                    case 'less':
                        return rowValue < filterInfo.value;
                    case 'greater':
                        return rowValue > filterInfo.value;
                    default:
                        return true;
                }
            });
        });
    };

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

    // Handle row selection
    const handleSelectionChange = (selectedRows) => {
        setSelectedRows(selectedRows);
        if (onSelectionChange) {
            onSelectionChange(selectedRows);
        }
    };

    // Get display data (filtered or original)
    const getDisplayData = () => {
        return isFilterActive ? filteredData : data;
    };

    // Default export function
    const handleDefaultExport = async () => {
        try {
            toast.loading('Preparing Excel file...', 0);

            const columnsState = tableRef.current?.getColumnsState();
            const visibleColumns = columnsState?.selectedColumns || [];

            const exportColumns = columns
                .filter(col => visibleColumns.includes(col.key))
                .map(col => ({
                    key: col.key,
                    title: col.title
                }));

            const displayData = getDisplayData();

            const exportData = displayData.map(row => {
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

            toast.dismiss();
            toast.success(`Exported ${exportData.length} records successfully`);
        } catch (error) {
            console.error('Export error:', error);
            toast.dismiss();
            toast.error('Failed to export data');
        }
    };

    // Handle export (custom or default)
    const handleExport = async () => {
        if (onExport) {
            onExport(data, selectedRows);
        } else {
            await handleDefaultExport();
        }
    };

    // Filter related functions
    const handleOpenFilterModal = (columnKey) => {
        setCurrentFilterColumn(columnKey);
        setFilterModalVisible(true);
        handleCloseContextMenu();
    };

    const handleApplyFilter = () => {
        if (!filterType || !filterValue || !currentFilterColumn) {
            toast.error('Please select filter type and enter a value');
            return;
        }

        try {
            const numericValue = parseFloat(filterValue);
            if (isNaN(numericValue)) {
                toast.error('Please enter a valid number');
                return;
            }

            const newActiveFilters = {
                ...activeFilters,
                [currentFilterColumn]: {
                    type: filterType,
                    value: numericValue,
                    displayValue: filterValue
                }
            };

            const filtered = applyAllFilters(newActiveFilters, data);

            setFilteredData(filtered);
            setIsFilterActive(true);
            setActiveFilters(newActiveFilters);

            setFilterModalVisible(false);
            setFilterType(null);
            setFilterValue('');

            toast.success(`Filter applied: ${filtered.length} records found`);
        } catch (error) {
            console.error('Filter error:', error);
            toast.error('Failed to apply filter');
        }
    };

    const handleClearColumnFilter = (columnKey) => {
        const newActiveFilters = { ...activeFilters };
        delete newActiveFilters[columnKey];

        const filtered = applyAllFilters(newActiveFilters, data);

        setActiveFilters(newActiveFilters);
        setFilteredData(filtered);

        const hasActiveFilters = Object.keys(newActiveFilters).length > 0;
        setIsFilterActive(hasActiveFilters);

        const columnTitle = columns.find(col => col.key === columnKey)?.title || columnKey;
        toast.success(`Filter cleared from ${columnTitle}`);
    };

    const handleClearFilter = () => {
        setFilteredData([]);
        setIsFilterActive(false);
        setActiveFilters({});
        setCurrentFilterColumn(null);
        toast.success('All filters cleared');
    };

    // Get filter icon based on filter type
    const getFilterIcon = (filterType) => {
        switch (filterType) {
            case 'equal':
                return <span style={{ fontWeight: 'bold' }}>=</span>;
            case 'less':
                return <span style={{ fontWeight: 'bold' }}>&lt;</span>;
            case 'greater':
                return <span style={{ fontWeight: 'bold' }}>&gt;</span>;
            default:
                return <FilterOutlined />;
        }
    };

    // Render column header with filter indicator
    const renderColumnHeader = (column) => {
        const filterInfo = activeFilters[column.key];

        if (filterInfo) {
            return (
                <div className="column-header-with-filter">
                    <span className="column-title">{column.title}</span>
                    <div
                        className="filter-indicator"
                        data-filter-type={filterInfo.type}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClearColumnFilter(column.key);
                        }}
                    >
                        <span className="filter-icon">{getFilterIcon(filterInfo.type)}</span>
                        <span className="filter-value">{filterInfo.displayValue}</span>
                        <CloseOutlined className="filter-clear" />
                    </div>
                </div>
            );
        }

        return column.title;
    };

    // Get columns with filter indicators
    const getColumnsWithFilterIndicators = () => {
        return columns.map(column => ({
            ...column,
            title: renderColumnHeader(column)
        }));
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

    const handleSaveView = async () => {
        if (viewName.trim() && tableRef.current) {
            const viewData = tableRef.current.getCurrentView();

            const cleanViewData = {
                id: `view-${Date.now()}`,
                name: viewName.trim(),
                columns: viewData.columns,
                columnOrder: viewData.columnOrder,
                sortConfig: viewData.sortConfig,
                activeGroups: viewData.activeGroups || [],
                expandedGroups: viewData.expandedGroups || [],
                createdAt: new Date().toISOString()
            };

            try {
                const storageKey = `${title}_views`;
                const savedViews = JSON.parse(localStorage.getItem(storageKey) || '[]');

                const existingIndex = savedViews.findIndex(v => v.name === viewName.trim());
                if (existingIndex >= 0) {
                    savedViews[existingIndex] = cleanViewData;
                } else {
                    savedViews.push(cleanViewData);
                }

                localStorage.setItem(storageKey, JSON.stringify(savedViews));
                setSavedViews(savedViews);

                setSaveViewModalVisible(false);
                setViewName('');
                toast.success('View saved successfully');
            } catch (error) {
                console.error('Error saving view:', error);
                toast.error('Failed to save view');
            }
        }
    };

    const handleLoadView = (viewId) => {
        const view = savedViews.find(v => v.id === viewId);
        if (view && tableRef.current) {
            tableRef.current.applyView(view);
            toast.success(`View "${view.name}" loaded successfully`);
        }
    };

    const handleDeleteView = (viewId) => {
        try {
            const storageKey = `${title}_views`;
            const updatedViews = savedViews.filter(v => v.id !== viewId);
            localStorage.setItem(storageKey, JSON.stringify(updatedViews));
            setSavedViews(updatedViews);
            toast.success('View deleted successfully');
        } catch (error) {
            console.error('Error deleting view:', error);
            toast.error('Failed to delete view');
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

                const activeGroups = tableRef.current?.getActiveGroups() || [];
                if (activeGroups.includes(columnKey)) {
                    actions.push({
                        label: `Ungroup by ${column?.title}`,
                        onClick: () => tableRef.current?.ungroupByColumn(columnKey)
                    });
                }
            }

            // Group management actions
            const activeGroups = tableRef.current?.getActiveGroups() || [];
            if (activeGroups.length > 0) {
                actions.push({ type: 'divider' });
                actions.push({
                    label: 'Expand All Groups',
                    onClick: () => tableRef.current?.expandAllGroups()
                });
                actions.push({
                    label: 'Collapse All Groups',
                    onClick: () => tableRef.current?.collapseAllGroups()
                });
                actions.push({
                    label: 'Clear All Groups',
                    onClick: () => tableRef.current?.clearAllGroups()
                });
            }

            // Aggregation actions
            if (enableAggregation && column?.type === 'number') {
                actions.push({ type: 'divider' });
                actions.push({
                    label: `Sum ${column?.title}`,
                    onClick: () => tableRef.current?.aggregateColumn(columnKey, 'sum')
                });
                actions.push({
                    label: `Average ${column?.title}`,
                    onClick: () => tableRef.current?.aggregateColumn(columnKey, 'average')
                });

                // Filter action
                actions.push({
                    label: `Filters ${column?.title}`,
                    onClick: () => handleOpenFilterModal(columnKey)
                });
            }
        } else {
            // Custom context menu actions for rows
            if (contextMenuActions.rowActions) {
                actions.push(...contextMenuActions.rowActions(rows, clickedRow));
            }
        }

        return actions;
    };

    const displayData = getDisplayData();

    return (
        <div className="generic-data-table">
            {!modalMode && !hideToolbar && (
                <div className="table-toolbar">
                    <Space>
                        <Button className='rounded-sm elevation-custom' icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
                            Refresh
                        </Button>
                        <Button className='rounded-sm elevation-custom'
                                icon={<DownloadOutlined />}
                                onClick={handleExport}
                                disabled={displayData.length === 0}
                        >
                            Export ({displayData.length})
                        </Button>

                        <Button className='rounded-sm elevation-custom'
                                icon={<SaveOutlined />}
                                onClick={handleShowSaveViewModal}
                                disabled={displayData.length === 0}
                        >
                            Save Current View
                        </Button>
                        <Button className='rounded-sm elevation-custom'
                                icon={<SettingOutlined />}
                                onClick={handleShowColumnsModal}
                                disabled={displayData.length === 0}
                        >
                            Show/Hide Columns
                        </Button>

                        {/* Custom buttons from parent */}
                        {customButtons && customButtons.map((button, index) => (
                            <Button className='rounded-sm elevation-custom'
                                    key={index}
                                    icon={button.icon}
                                    onClick={button.onClick}
                                    disabled={button.disabled}
                                    type={button.type || 'default'}
                                    danger={button.danger}
                                    loading={button.loading}
                            >
                                {button.label}
                            </Button>
                        ))}

                        {/* Custom React components */}
                        {customToolbarComponents && customToolbarComponents.map((Component, index) => (
                            <Component key={index} />
                        ))}

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
                        {/* Clear All Filters button */}
                        {isFilterActive && (
                            <>
                                <Button className='rounded-sm elevation-custom'
                                        icon={<CloseOutlined />}
                                        onClick={handleClearFilter}
                                        type="default"
                                        danger
                                >
                                    Clear All Filters
                                </Button>

                                <span className="active-filters-count">
                  ({Object.keys(activeFilters).length} filter(s) active)
                </span>
                            </>
                        )}
                    </Space>

                    <div className="table-info">
                        Showing {displayData.length} records
                        {isFilterActive && ` (filtered from ${data.length} total)`}
                        {selectedRows.length > 0 && ` (${selectedRows.length} selected)`}
                    </div>
                </div>
            )}

            <CustomDataTable
                ref={tableRef}
                data={displayData}
                columns={getColumnsWithFilterIndicators()}
                loading={loading}
                selection={selection}
                onSelectionChange={handleSelectionChange}
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

            {/* Filter Modal */}
            <Modal
                open={filterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                title={`Filter: ${columns.find(col => col.key === currentFilterColumn)?.title || currentFilterColumn}`}
                onSubmit={handleApplyFilter}
                submitLabel="Apply Filter"
                cancelLabel="Cancel"
                persistent={false}
                maxWidth={500}
            >
                <div className="modal-content-wrapper">
                    <p className="modal-description">
                        Select filter type and enter value:
                    </p>

                    {/* Filter type combobox */}
                    <div style={{ marginBottom: '16px' }}>
                        <label className="filter-label">Filter Type:</label>
                        <SearchableComboBox
                            value={filterType}
                            onChange={setFilterType}
                            items={[
                                { id: 'equal', title: 'Equal to' },
                                { id: 'less', title: 'Less than' },
                                { id: 'greater', title: 'Greater than' }
                            ]}
                            itemTitle="title"
                            itemValue="id"
                            placeholder="Select filter type..."
                            multiple={false}
                        />
                    </div>

                    {/* Filter value input */}
                    <div>
                        <label className="filter-label">Value:</label>
                        <CustomTextInput
                            disabled={!filterType}
                            value={filterValue}
                            onChange={setFilterValue}
                            type="number"
                            placeholder="Enter numeric value..."
                            clearable={true}
                            autoFocus={true}
                        />
                    </div>

                    {/* Column info */}
                    {currentFilterColumn && (
                        <div style={{ marginTop: '16px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                            <small>
                                Filtering column: <strong>{currentFilterColumn}</strong>
                                <br />
                                Data type: <strong>Number</strong>
                            </small>
                        </div>
                    )}
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
                    toast.success('Columns updated successfully');
                }}
                submitLabel='Apply'
                persistent={true}
                maxWidth={800}
            >
                <div className="modal-content-wrapper">
                    <p className="modal-description">
                        Select and reorder columns to display in the table:
                    </p>

                    {/* Select All / Deselect All buttons */}
                    <div className="columns-bulk-actions" style={{ marginBottom: '16px' }}>
                        <button
                            className="custom-btn custom-btn-secondary"
                            onClick={() => {
                                setSelectedColumns(columns.map(col => col.key));
                            }}
                            style={{ marginRight: '8px' }}
                        >
                            Select All
                        </button>
                        <button
                            className="custom-btn custom-btn-secondary"
                            onClick={() => {
                                setSelectedColumns([]);
                            }}
                        >
                            Deselect All
                        </button>
                    </div>

                    <div className="columns-configuration">
                        <div className="columns-list">
                            {columns.map((column) => {
                                const id = `col-${column.key}`;
                                const checked = selectedColumns.includes(column.key);

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
                                        className={`column-item clickable ${checked ? 'is-checked' : ''}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toggle();
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === ' ' || e.key === 'Enter') {
                                                e.preventDefault();
                                                toggle();
                                            }
                                        }}
                                        role="checkbox"
                                        aria-checked={checked}
                                        tabIndex={0}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <input
                                            id={id}
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => {
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

export default GenericDataTable;