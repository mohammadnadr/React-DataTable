// CustomDataTable.jsx
import React, {  useState, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { Tooltip, Tag, Button } from 'antd';
import './CustomDataTable.scss';
import { CaretDownOutlined, CaretRightOutlined, SortAscendingOutlined, SortDescendingOutlined, HolderOutlined } from '@ant-design/icons';

const CustomDataTable = forwardRef(({
                                        data = [],
                                        columns = [],
                                        pinnedColumns = [],
                                        loading = false,
                                        selection = false,
                                        onSelectionChange = () => {},
                                        onSort = () => {},
                                        onContextMenu = null,
                                        slots = {},
                                        rowClassName = '',
                                        stickyHeader = false,
                                        enableGrouping = true,
                                        enableAggregation = true,
                                        enableColumnReordering = true
                                    }, ref) => {
    const [selectedRows, setSelectedRows] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [activeGroups, setActiveGroups] = useState([]);
    const [columnOrder, setColumnOrder] = useState(columns.map(col => col.key));
    const [visibleColumns, setVisibleColumns] = useState(columns.map(col => col.key));
    const [bestFitEnabled, setBestFitEnabled] = useState(false);
    const [columnAggregations, setColumnAggregations] = useState({});

    const [draggedColKey, setDraggedColKey] = useState(null);
    const [dragOverColKey, setDragOverColKey] = useState(null);
    const dragActiveRef = useRef(false);

    // Separate pinned and regular columns
    const { pinnedColumns: displayPinnedColumns, regularColumns: displayRegularColumns } = useMemo(() => {
        const pinned = columns.filter(col => pinnedColumns.includes(col.key));
        const regular = columns.filter(col => !pinnedColumns.includes(col.key));
        return { pinnedColumns: pinned, regularColumns: regular };
    }, [columns, pinnedColumns]);

    // Process and sort data
    const processedData = useMemo(() => {
        let processed = [...data];

        if (sortConfig.key) {
            processed.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;

                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return sortConfig.direction === 'asc'
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                } else {
                    return sortConfig.direction === 'asc'
                        ? (aVal || 0) - (bVal || 0)
                        : (bVal || 0) - (aVal || 0);
                }
            });
        }

        return processed;
    }, [data, sortConfig]);

    // Build hierarchical grouped data
    const buildHierarchicalData = useMemo(() => {
        if (activeGroups.length === 0) {
            return processedData.map(item => ({
                ...item,
                _level: 0,
                _isDataRow: true
            }));
        }

        const groupDataRecursively = (items, level = 0, parentGroupPath = []) => {
            if (level >= activeGroups.length) {
                return items.map(item => ({
                    ...item,
                    _level: level,
                    _groupPath: [...parentGroupPath],
                    _isDataRow: true,
                    _parentGroupId: parentGroupPath.length > 0 ? parentGroupPath[parentGroupPath.length - 1].groupId : null
                }));
            }

            const currentGroupKey = activeGroups[level];
            const groups = {};

            // Group items by current level
            items.forEach(item => {
                const groupValue = item[currentGroupKey] || 'Unknown';
                const groupId = `group-${currentGroupKey}-${groupValue}-${level}-${parentGroupPath.map(p => p.groupId).join('-')}`;

                if (!groups[groupId]) {
                    groups[groupId] = {
                        groupValue,
                        items: [],
                        groupId,
                        groupKey: currentGroupKey
                    };
                }
                groups[groupId].items.push(item);
            });

            const result = [];

            // Create group headers and recursively process subgroups
            Object.values(groups).forEach(({ groupValue, items, groupId, groupKey }) => {
                const currentGroupPath = [...parentGroupPath, {
                    key: groupKey,
                    value: groupValue,
                    groupId: groupId
                }];

                // Add group header
                result.push({
                    id: groupId,
                    _isGroupHeader: true,
                    _groupKey: groupId,
                    _level: level,
                    _groupPath: currentGroupPath,
                    groupColumn: groupKey,
                    groupValue: groupValue,
                    itemCount: items.length,
                    totalAmount: items.reduce((sum, item) => sum + (item.amount || item.extendedAmount || 0), 0),
                    _parentGroupId: parentGroupPath.length > 0 ? parentGroupPath[parentGroupPath.length - 1].groupId : null
                });

                // Add subgroup items if group is expanded
                if (expandedGroups.has(groupId)) {
                    const subgroupItems = groupDataRecursively(items, level + 1, currentGroupPath);
                    result.push(...subgroupItems);
                }
            });

            return result;
        };

        return groupDataRecursively(processedData);
    }, [processedData, activeGroups, expandedGroups]);

    // Display data
    const displayData = useMemo(() => {
        return buildHierarchicalData;
    }, [buildHierarchicalData]);

    // Visible & ordered columns for regular section
    const displayRegularColumnsFiltered = useMemo(() => {
        const filtered = displayRegularColumns.filter(col => visibleColumns.includes(col.key));
        return filtered.sort((a, b) => columnOrder.indexOf(a.key) - columnOrder.indexOf(b.key));
    }, [displayRegularColumns, visibleColumns, columnOrder]);

    // Pinned columns (always visible and in pin order)
    const displayPinnedColumnsFiltered = useMemo(() => {
        return displayPinnedColumns.filter(col => visibleColumns.includes(col.key))
            .sort((a, b) => pinnedColumns.indexOf(a.key) - pinnedColumns.indexOf(b.key));
    }, [displayPinnedColumns, visibleColumns, pinnedColumns]);

    // Helper function to check if row is selected
    const isRowSelected = (rowId) => {
        return selectedRows.some(row => row.id === rowId);
    };

    // Group data hierarchically
    const groupDataHierarchically = (columnKey) => {
        if (!enableGrouping) return;

        setActiveGroups(prev => {
            if (prev.includes(columnKey)) return prev;
            return [...prev, columnKey];
        });
    };

    const removeGroup = (columnKey) => {
        setActiveGroups(prev => prev.filter(group => group !== columnKey));

        // Remove from expanded groups as well
        const newExpandedGroups = new Set(expandedGroups);
        expandedGroups.forEach(groupId => {
            if (groupId.includes(`group-${columnKey}`)) {
                newExpandedGroups.delete(groupId);
            }
        });
        setExpandedGroups(newExpandedGroups);
    };

    const clearAllGroups = () => {
        setActiveGroups([]);
        setExpandedGroups(new Set());
    };

    // Handle group toggle
    const handleGroupToggle = (groupId) => {
        const newExpandedGroups = new Set(expandedGroups);

        if (newExpandedGroups.has(groupId)) {
            // Collapse group - remove this group and all its children
            const groupsToRemove = [groupId];

            // Find all child groups
            displayData.forEach(item => {
                if (item._isGroupHeader && item._parentGroupId === groupId) {
                    groupsToRemove.push(item.id);
                }
            });

            groupsToRemove.forEach(id => newExpandedGroups.delete(id));
        } else {
            // Expand group
            newExpandedGroups.add(groupId);
        }

        setExpandedGroups(newExpandedGroups);
    };

    // Expand/Collapse all groups
    const expandAllGroups = () => {
        const allGroupIds = buildHierarchicalData
            .filter(item => item._isGroupHeader)
            .map(group => group.id);
        setExpandedGroups(new Set(allGroupIds));
    };

    const collapseAllGroups = () => {
        setExpandedGroups(new Set());
    };

    // Selection handlers
    const handleRowSelect = (row, checked) => {
        if (!row || !row._isDataRow) return;

        setSelectedRows(prevSelectedRows => {
            let newSelection;

            if (checked) {
                if (!prevSelectedRows.some(selectedRow => selectedRow.id === row.id)) {
                    newSelection = [...prevSelectedRows, row];
                } else {
                    newSelection = prevSelectedRows;
                }
            } else {
                newSelection = prevSelectedRows.filter(selectedRow => selectedRow.id !== row.id);
            }

            onSelectionChange(newSelection);
            return newSelection;
        });
    };

    const handleSelectAll = (checked) => {
        const selectableRows = processedData.filter(row => row.id && row._isDataRow !== false);
        setSelectedRows(() => {
            const newSelection = checked ? selectableRows : [];
            onSelectionChange(newSelection);
            return newSelection;
        });
    };

    // Sorting handler
    const handleSort = (key) => {
        if (dragActiveRef.current) return;

        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        const newSortConfig = { key, direction };
        setSortConfig(newSortConfig);
        onSort(key, direction);
    };

    // Context menu handler
    const handleContextMenu = (event, row, type = 'row', columnKey = null) => {
        event.preventDefault();
        if (onContextMenu) {
            const contextRows = selectedRows.length > 0 && type === 'row'
                ? selectedRows
                : row ? [row] : [];
            onContextMenu(event, contextRows, row, type, columnKey);
        }
    };

    // Column reordering handlers
    const onHeaderDragStart = (e, colKey) => {
        if (!enableColumnReordering) return;

        // Prevent dragging pinned columns
        if (pinnedColumns.includes(colKey)) {
            e.preventDefault();
            return;
        }

        setDraggedColKey(colKey);
        dragActiveRef.current = true;
        try { e.dataTransfer.setData('text/plain', colKey); } catch {}
    };

    const onHeaderDragOver = (e, overKey) => {
        if (!enableColumnReordering) return;
        e.preventDefault();
        if (overKey !== dragOverColKey) setDragOverColKey(overKey);
    };

    const onHeaderDrop = (e, dropTargetKey) => {
        if (!enableColumnReordering) return;
        e.preventDefault();
        const fromKey = draggedColKey;
        const toKey = dropTargetKey;
        setDragOverColKey(null);
        setDraggedColKey(null);

        if (!fromKey || !toKey || fromKey === toKey) {
            setTimeout(() => (dragActiveRef.current = false), 0);
            return;
        }

        setColumnOrder(prev => {
            const next = [...prev].filter(k => k !== fromKey);
            const toIndex = next.indexOf(toKey);
            next.splice(toIndex, 0, fromKey);
            return next;
        });

        setTimeout(() => (dragActiveRef.current = false), 0);
    };

    const onHeaderDragEnd = () => {
        setDragOverColKey(null);
        setDraggedColKey(null);
        setTimeout(() => (dragActiveRef.current = false), 0);
    };

    // Aggregation functions
    const calculateAggregation = (columnKey, operation) => {
        if (!enableAggregation) return;

        const column = columns.find(col => col.key === columnKey);
        if (!column || column.type !== 'number') return;

        let result;
        if (operation === 'sum') {
            result = processedData.reduce((sum, item) => sum + (+item[columnKey] || 0), 0);
        } else if (operation === 'average') {
            const sum = processedData.reduce((sum, item) => sum + (+item[columnKey] || 0), 0);
            const count = processedData.filter(item => +item[columnKey] !== undefined && +item[columnKey] !== null).length;
            result = count > 0 ? sum / count : 0;
        }

        setColumnAggregations(prev => ({
            ...prev,
            [columnKey]: {
                operation,
                value: result,
                formattedValue: operation === 'sum' ? `${result?.toLocaleString()}` : `${result?.toFixed(2)}`
            }
        }));
    };

    // Best Fit handler
    const handleBestFit = () => {
        setBestFitEnabled(prev => !prev);
    };

    // Column management
    const handleUpdateColumns = (newVisibleColumns, newColumnOrder) => {
        setVisibleColumns(newVisibleColumns);
        setColumnOrder(newColumnOrder);
    };

    // Expose API methods
    useImperativeHandle(ref, () => ({
        getSelectedRows: () => selectedRows,
        groupByColumn: (columnKey) => groupDataHierarchically(columnKey),
        ungroupByColumn: (columnKey) => removeGroup(columnKey),
        clearAllGroups: () => clearAllGroups(),
        expandAllGroups: () => expandAllGroups(),
        collapseAllGroups: () => collapseAllGroups(),
        getActiveGroups: () => activeGroups,
        aggregateColumn: (columnKey, operation) => calculateAggregation(columnKey, operation),
        getColumnsState: () => ({
            selectedColumns: visibleColumns,
            columnOrder: columnOrder
        }),
        updateColumns: (newVisibleColumns, newColumnOrder) => handleUpdateColumns(newVisibleColumns, newColumnOrder),
        getCurrentView: () => ({
            columns: visibleColumns,
            columnOrder: columnOrder,
            sortConfig: sortConfig,
            activeGroups: activeGroups,
            expandedGroups: Array.from(expandedGroups),
            aggregations: columnAggregations,
            pinnedColumns: pinnedColumns
        }),
        applyView: (view) => {
            if (view.columns) setVisibleColumns(view.columns);
            if (view.columnOrder) setColumnOrder(view.columnOrder);
            if (view.sortConfig) setSortConfig(view.sortConfig);
            if (view.activeGroups) setActiveGroups(view.activeGroups);
            if (view.expandedGroups) setExpandedGroups(new Set(view.expandedGroups));
            if (view.aggregations) setColumnAggregations(view.aggregations);
            // pinnedColumns will be handled by parent component
        },
        toggleBestFit: () => handleBestFit(),
        isBestFitEnabled: () => bestFitEnabled
    }));

    // Cell renderers
    const renderCellContent = (row, column) => {
        if (row._isGroupHeader) {
            // For group headers in pinned section, only show in first column
            const displayColumns = displayPinnedColumnsFiltered.length > 0 ?
                displayPinnedColumnsFiltered : displayRegularColumnsFiltered;

            if (displayColumns[0] && column.key === displayColumns[0].key) {
                const groupColumn = columns.find(col => col.key === row.groupColumn);
                return (
                    <div className="group-header-cell" style={{ paddingLeft: `${row._level * 20}px` }}>
                        <button
                            className="group-toggle"
                            onClick={() => handleGroupToggle(row.id)}
                            style={{ marginRight: '8px' }}
                        >
                            {expandedGroups.has(row.id) ? <CaretDownOutlined /> : <CaretRightOutlined />}
                        </button>
                        <span className="group-label" style={{ fontWeight: 'bold', marginRight: '8px' }}>
              {groupColumn?.title || row.groupColumn}:
            </span>
                        <span className="group-value" style={{ marginRight: '12px' }}>{row.groupValue}</span>
                        <span className="group-count" style={{ color: '#666' }}>({row.itemCount} items)</span>
                    </div>
                );
            }
            // For other columns in group header rows in pinned section, show empty
            return null;
        }

        const value = row[column.key];
        const slot = slots[column.key];

        if (slot) return slot({ value, row, column });

        let displayValue = value;
        if (column.type === 'number' && typeof value === 'number') {
            displayValue = column.key.includes('Amount') || column.key.includes('price') || column.key.includes('amount')
                ? `$${value.toLocaleString()}`
                : value.toLocaleString();
        } else if (column.type === 'date' && value) {
            displayValue = new Date(value).toLocaleDateString();
        }

        return (
            <Tooltip title={displayValue} placement="topLeft">
                <span className="cell-content">{displayValue || '-'}</span>
            </Tooltip>
        );
    };

    // Render table header for a column set
    const renderTableHeader = (columnsToRender, isPinnedSection = false) => {
        return (
            <tr>
                {selection && !isPinnedSection && (
                    <th className="selection-column">
                        <input
                            type="checkbox"
                            checked={selectedRows.length > 0 && selectedRows.length === processedData.length}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="row-checkbox"
                        />
                    </th>
                )}

                {columnsToRender.map((column) => {
                    const isDragged = draggedColKey === column.key;
                    const isDragOver = dragOverColKey === column.key;

                    return (
                        <th
                            key={column.key}
                            style={{ width: column.width || 'auto' }}
                            className={`column-header ${column.sortable ? 'sortable' : ''} ${
                                sortConfig.key === column.key ? `sorted-${sortConfig.direction}` : ''
                            } ${isDragged ? 'is-dragged' : ''} ${isDragOver ? 'is-drag-over' : ''} ${
                                isPinnedSection ? 'pinned-column' : ''
                            }`}
                            onClick={() => column.sortable && handleSort(column.key)}
                            onContextMenu={(e) => onContextMenu && handleContextMenu(e, null, 'header', column.key)}
                            draggable={enableColumnReordering && !isPinnedSection}
                            onDragStart={(e) => enableColumnReordering && !isPinnedSection && onHeaderDragStart(e, column.key)}
                            onDragOver={(e) => enableColumnReordering && !isPinnedSection && onHeaderDragOver(e, column.key)}
                            onDrop={(e) => enableColumnReordering && !isPinnedSection && onHeaderDrop(e, column.key)}
                            onDragEnd={enableColumnReordering && !isPinnedSection ? onHeaderDragEnd : undefined}
                        >
                            <div className="header-content">
                                {enableColumnReordering && !isPinnedSection && (
                                    <span className="drag-handle" aria-hidden="true"><HolderOutlined /></span>
                                )}
                                <span className="column-title">{column.title}</span>
                                {column.sortable && (
                                    <span className="sort-indicator">
                    {sortConfig.key === column.key
                        ? sortConfig.direction === 'asc'
                            ? <SortAscendingOutlined style={{fontSize:'24px'}}/>
                            : <SortDescendingOutlined style={{fontSize:'24px'}} />
                        : '↕'}
                  </span>
                                )}
                                {enableAggregation && columnAggregations[column.key] && (
                                    <Tooltip
                                        title={`${columnAggregations[column.key].operation}: ${columnAggregations[column.key].formattedValue}`}
                                        placement="top"
                                    >
                                        <Tag
                                            color={
                                                columnAggregations[column.key].operation === 'sum' ? 'cyan' :
                                                    columnAggregations[column.key].operation === 'average' ? 'green' : 'gold'
                                            }
                                            style={{ fontSize: '11px', cursor: 'pointer', marginLeft: '4px' }}
                                        >
                                            {columnAggregations[column.key].operation === 'sum' ? '∑' : 'Avg'}: {columnAggregations[column.key].formattedValue}
                                        </Tag>
                                    </Tooltip>
                                )}
                            </div>
                        </th>
                    );
                })}
            </tr>
        );
    };

    // Render table body rows for a column set
    const renderTableBody = (columnsToRender, isPinnedSection = false) => {
        return displayData.map((row, index) => {
            const isGroupHeader = row._isGroupHeader;
            const isDataRow = row._isDataRow;
            const isSelected = isRowSelected(row.id);

            // For pinned section, only show content in first column for group headers
            const shouldRenderCell = (column, colIndex) => {
                if (isPinnedSection && isGroupHeader) {
                    // In pinned section, only show group header content in first column
                    return colIndex === 0;
                }
                return true;
            };

            return (
                <tr
                    key={row.id || index}
                    className={`${isGroupHeader ? 'group-header-row' : 'data-row'} ${
                        isSelected ? 'selected' : ''
                    } ${isDataRow ? 'data-row-item' : ''} ${rowClassName}`}
                    data-level={row._level}
                    onContextMenu={(e) => onContextMenu && isDataRow && handleContextMenu(e, row, 'row')}
                >
                    {selection && !isPinnedSection && (
                        <td className="selection-column">
                            {isDataRow && (
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => handleRowSelect(row, e.target.checked)}
                                    className="row-checkbox"
                                />
                            )}
                        </td>
                    )}

                    {columnsToRender.map((column, colIndex) => {
                        if (!shouldRenderCell(column, colIndex)) {
                            return (
                                <td
                                    key={column.key}
                                    style={{ width: column.width || 'auto' }}
                                    className={`data-cell ${column.type || ''} ${
                                        isGroupHeader ? 'group-cell' : ''
                                    } ${isPinnedSection ? 'pinned-cell' : ''} empty-group-cell`}
                                >
                                    {/* Empty cell for group headers in pinned section (except first column) */}
                                </td>
                            );
                        }

                        return (
                            <td
                                key={column.key}
                                style={{ width: column.width || 'auto' }}
                                className={`data-cell ${column.type || ''} ${
                                    isGroupHeader ? 'group-cell' : ''
                                } ${colIndex === 0 && isGroupHeader ? 'first-column-group' : ''} ${
                                    isPinnedSection ? 'pinned-cell' : ''
                                }`}
                            >
                                {renderCellContent(row, column)}
                            </td>
                        );
                    })}
                </tr>
            );
        });
    };

    // Active groups display component
    const ActiveGroupsDisplay = () => {
        if (activeGroups.length === 0) return null;

        return (
            <div className="active-groups-display">
                <div className="groups-breadcrumb">
                    <span className="groups-label">Grouped by:</span>
                    {activeGroups.map((groupKey, index) => {
                        const column = columns.find(col => col.key === groupKey);
                        return (
                            <React.Fragment key={groupKey}>
                                <Tag
                                    closable
                                    onClose={() => removeGroup(groupKey)}
                                    className="group-tag m-0"
                                    color="blue"
                                >
                                    {column?.title || groupKey}
                                </Tag>
                                {index < activeGroups.length - 1 && (
                                    <span className="group-separator"> → </span>
                                )}
                            </React.Fragment>
                        );
                    })}
                    {activeGroups.length > 0 && (
                        <Button
                            type="link"
                            size="small"
                            onClick={clearAllGroups}
                            className="clear-all-groups"
                        >
                            Clear All
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="custom-data-table">
            {/* Active Groups Display */}
            <ActiveGroupsDisplay />

            <div className="data-table-container">
                {/* Pinned Columns Section */}
                {displayPinnedColumnsFiltered.length > 0 && (
                    <div className="pinned-columns-section">
                        <table className="data-table pinned-table">
                            <thead className={stickyHeader ? 'sticky-header' : ''}>
                            {renderTableHeader(displayPinnedColumnsFiltered, true)}
                            </thead>
                            <tbody>
                            {renderTableBody(displayPinnedColumnsFiltered, true)}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Regular Columns Section */}
                <div className={`regular-columns-section ${displayPinnedColumnsFiltered.length > 0 ? 'with-pinned' : ''}`}>
                    <table className="data-table regular-table">
                        <thead className={stickyHeader ? 'sticky-header' : ''}>
                        {renderTableHeader(displayRegularColumnsFiltered)}
                        </thead>
                        <tbody>
                        {renderTableBody(displayRegularColumnsFiltered)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
});

export default CustomDataTable;