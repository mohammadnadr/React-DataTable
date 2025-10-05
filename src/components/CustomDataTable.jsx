// CustomDataTable.jsx
import React, { useEffect,useState, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { Tooltip,Tag } from 'antd';
import './CustomDataTable.scss';
import { CaretDownOutlined,CaretRightOutlined ,SortAscendingOutlined,SortDescendingOutlined } from '@ant-design/icons';

const CustomDataTable = forwardRef(({
                                      data = [],
                                      columns = [],
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
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [groupedData, setGroupedData] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [columnGroups, setColumnGroups] = useState({});
  const [columnAggregations, setColumnAggregations] = useState({});
  const [visibleColumns, setVisibleColumns] = useState(columns.map(col => col.key));
  const [columnOrder, setColumnOrder] = useState(columns.map(col => col.key));
  const [bestFitEnabled, setBestFitEnabled] = useState(false);

  const [draggedColKey, setDraggedColKey] = useState(null);
  const [dragOverColKey, setDragOverColKey] = useState(null);
  const dragActiveRef = useRef(false);

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

  // Grouping helpers
  const groupDataByColumn = (columnKey) => {
    if (!enableGrouping) return;
    
    const groups = {};
    processedData.forEach(item => {
      const groupValue = item[columnKey] || 'Unknown';
      if (!groups[groupValue]) groups[groupValue] = [];
      groups[groupValue].push(item);
    });

    const newGroups = Object.entries(groups).map(([value, items]) => ({
      id: `col-group-${columnKey}-${value}`,
      name: value,
      columnKey: columnKey,
      items: items,
      count: items.length,
      totalAmount: items.reduce((sum, item) => sum + (item.amount || item.extendedAmount || 0), 0)
    }));

    setColumnGroups(prev => ({ ...prev, [columnKey]: newGroups }));
  };

  const ungroupDataByColumn = (columnKey) => {
    setColumnGroups(prev => {
      const newGroups = { ...prev };
      delete newGroups[columnKey];
      return newGroups;
    });
  };

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

  // Display data
  const displayData = useMemo(() => {
    const flattened = [];

    Object.values(columnGroups).flat().forEach(group => {
      flattened.push({ ...group, _isColumnGroupHeader: true, _groupKey: group.id, id: group.id });
      if (expandedGroups.has(group.id)) {
        group.items.forEach(item => {
          flattened.push({ ...item, _isGroupedItem: true, _groupId: group.id });
        });
      }
    });

    groupedData.forEach(group => {
      flattened.push({ ...group, _isGroupHeader: true, _groupKey: group.id, id: group.id });
      if (expandedGroups.has(group.id)) {
        group.items.forEach(item => {
          flattened.push({ ...item, _isGroupedItem: true, _groupId: group.id });
        });
      }
    });

    const allGroupedItems = new Set();
    Object.values(columnGroups).flat().forEach(group => {
      group.items.forEach(item => allGroupedItems.add(item.id));
    });
    groupedData.forEach(group => {
      group.items.forEach(item => allGroupedItems.add(item.id));
    });

    const ungroupedData = processedData.filter(item => !allGroupedItems.has(item.id));
    flattened.push(...ungroupedData);

    return flattened;
  }, [processedData, groupedData, columnGroups, expandedGroups]);

  // Visible & ordered columns
  const displayColumns = useMemo(() => {
    const filtered = columns.filter(col => visibleColumns.includes(col.key));
    return filtered.sort((a, b) => columnOrder.indexOf(a.key) - columnOrder.indexOf(b.key));
  }, [columns, visibleColumns, columnOrder]);

  // Selection
  const handleRowSelect = (rowId, checked) => {
    if (!rowId || rowId.toString().startsWith('group-')) return;
    const newSelection = new Set(selectedRows);
    if (checked) newSelection.add(rowId);
    else newSelection.delete(rowId);
    setSelectedRows(newSelection);
    onSelectionChange(Array.from(newSelection));
  };

  const handleSelectAll = (checked) => {
    const selectableRows = processedData.filter(row => row.id && !row.id.toString().startsWith('group-'));
    if (checked) {
      const allIds = selectableRows.map(row => row.id);
      setSelectedRows(new Set(allIds));
      onSelectionChange(allIds);
    } else {
      setSelectedRows(new Set());
      onSelectionChange([]);
    }
  };

  // Sorting
  const handleSort = (key) => {
    if (dragActiveRef.current) return;

    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);
    onSort(key, direction);
  };

  // Context menu
  const handleContextMenu = (event, row, type = 'row', columnKey = null) => {
    event.preventDefault();
    if (onContextMenu) {
      const selectedRowsArray = Array.from(selectedRows);
      const contextRows = selectedRowsArray.length > 0 && type === 'row'
        ? processedData.filter(item => selectedRowsArray.includes(item.id))
        : [row];
      onContextMenu(event, contextRows, row, type, columnKey);
    }
  };

  const handleGroupToggle = (groupId) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (newExpandedGroups.has(groupId)) newExpandedGroups.delete(groupId);
    else newExpandedGroups.add(groupId);
    setExpandedGroups(newExpandedGroups);
  };

  // Manual grouping
  const handleCreateGroup = (groupName, rows) => {
    if (!enableGrouping) return;
    
    const newGroup = {
      id: `manual-group-${Date.now()}`,
      name: groupName,
      items: rows,
      count: rows.length,
      totalAmount: rows.reduce((sum, item) => sum + (item.amount || item.extendedAmount || 0), 0)
    };
    setGroupedData(prev => [...prev, newGroup]);
  };

  const handleAddToGroup = (groupId, rows) => {
    if (!enableGrouping) return;
    
    setGroupedData(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
            ...group,
            items: [...group.items, ...rows],
            count: group.items.length + rows.length,
            totalAmount: group.totalAmount + rows.reduce((sum, item) => sum + (item.amount || item.extendedAmount || 0), 0)
          }
          : group
      )
    );
  };

  const handleRemoveFromGroup = (groupId, rowId) => {
    setGroupedData(prev =>
      prev
        .map(group => {
          if (group.id === groupId) {
            const newItems = group.items.filter(item => item.id !== rowId);
            return {
              ...group,
              items: newItems,
              count: newItems.length,
              totalAmount: newItems.reduce((sum, item) => sum + (item.amount || item.extendedAmount || 0), 0)
            };
          }
          return group;
        })
        .filter(group => group.count > 0)
    );
  };

  // Column management API
  const handleUpdateColumns = (newVisibleColumns, newColumnOrder) => {
    setVisibleColumns(newVisibleColumns);
    setColumnOrder(newColumnOrder);
  };

  // DnD handlers for headers
  const onHeaderDragStart = (e, colKey) => {
    if (!enableColumnReordering) return;
    
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

  useImperativeHandle(ref, () => ({
    groupByColumn: (columnKey) => groupDataByColumn(columnKey),
    ungroupByColumn: (columnKey) => ungroupDataByColumn(columnKey),
    aggregateColumn: (columnKey, operation) => calculateAggregation(columnKey, operation),
    createGroup: (groupName, rows) => handleCreateGroup(groupName, rows),
    addToGroup: (groupId, rows) => handleAddToGroup(groupId, rows),
    removeFromGroup: (groupId, rowId) => handleRemoveFromGroup(groupId, rowId),
    getAvailableGroups: () => groupedData,
    getColumnsState: () => ({
      selectedColumns: visibleColumns,
      columnOrder: columnOrder
    }),
    updateColumns: (newVisibleColumns, newColumnOrder) => handleUpdateColumns(newVisibleColumns, newColumnOrder),
    getCurrentView: () => ({
      columns: visibleColumns,
      columnOrder: columnOrder,
      sortConfig: sortConfig,
      groups: columnGroups,
      aggregations: columnAggregations
    }),
    applyView: (view) => {
      if (view.columns) setVisibleColumns(view.columns);
      if (view.columnOrder) setColumnOrder(view.columnOrder);
      if (view.sortConfig) setSortConfig(view.sortConfig);
      if (view.groups) setColumnGroups(view.groups);
      if (view.aggregations) setColumnAggregations(view.aggregations);
    },
    toggleBestFit: () => handleBestFit(),
    isBestFitEnabled: () => bestFitEnabled
  }));

  // Cell renderers
  const renderCellContent = (row, column) => {
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
        <span className="cell-content"
              style={getCellContentStyle()}>{displayValue || '-'}</span>
      </Tooltip>
    );
  };

  // Group header
  const renderGroupHeader = (row) => {
    const isColumnGroup = row._isColumnGroupHeader;
    const isExpanded = expandedGroups.has(row.id);

    return (
      <tr className={`group-header ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <td colSpan={displayColumns.length + (selection ? 1 : 0)}>
          <div className="group-header-content">
            <button className="group-toggle" onClick={() => handleGroupToggle(row.id)}>
              {isExpanded ? <CaretDownOutlined />: <CaretRightOutlined /> }
            </button>
            <span className="group-name">
              {isColumnGroup ? `${row.columnKey}: ${row.name}` : row.name}
            </span>
            <span className="group-count">({row.count} items)</span>
            {row.totalAmount && (
              <span className="group-total">
                Total: ${row.totalAmount.toLocaleString()}
              </span>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Best Fit handler
  const handleBestFit = () => {
    setBestFitEnabled(prev => !prev);
  };

  useEffect(() => {
    setBestFitEnabled(false);
  }, [visibleColumns, columnOrder]);

  const getCellContentStyle = () => {
    return bestFitEnabled ? { width: 'auto', minWidth: 'fit-content' } : {};
  };

  return (
    <div className="custom-data-table">
      <table className="data-table">
        {/* Table Header */}
        <thead className={stickyHeader ? 'sticky-header' : ''}>
        <tr>
          {selection && (
            <th className="selection-column">
              <input
                type="checkbox"
                checked={selectedRows.size > 0 && selectedRows.size === processedData.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="row-checkbox"
              />
            </th>
          )}

          {displayColumns.map((column) => {
            const isDragged = draggedColKey === column.key;
            const isDragOver = dragOverColKey === column.key;

            return (
              <th
                key={column.key}
                style={{ width: column.width || 'auto' }}
                className={`column-header ${column.sortable ? 'sortable' : ''} ${
                  sortConfig.key === column.key ? `sorted-${sortConfig.direction}` : ''
                } ${isDragged ? 'is-dragged' : ''} ${isDragOver ? 'is-drag-over' : ''}`}
                onClick={() => column.sortable && handleSort(column.key)}
                onContextMenu={(e) => onContextMenu && handleContextMenu(e, null, 'header', column.key)}
                draggable={enableColumnReordering}
                onDragStart={(e) => enableColumnReordering && onHeaderDragStart(e, column.key)}
                onDragOver={(e) => enableColumnReordering && onHeaderDragOver(e, column.key)}
                onDrop={(e) => enableColumnReordering && onHeaderDrop(e, column.key)}
                onDragEnd={enableColumnReordering ? onHeaderDragEnd : undefined}
              >
                <div className="header-content">
                  {enableColumnReordering && (
                    <span className="drag-handle" aria-hidden="true">⋮⋮</span>
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
                        style={{ fontSize: '11px', cursor: 'pointer' }}
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
        </thead>

        {/* Table Body */}
        <tbody>
        {loading ? (
          <tr>
            <td colSpan={displayColumns.length + (selection ? 1 : 0)} className="loading-cell">Loading...</td>
          </tr>
        ) : displayData.length === 0 ? (
          <tr>
            <td colSpan={displayColumns.length + (selection ? 1 : 0)} className="empty-cell">No data available</td>
          </tr>
        ) : (
          displayData.map((row, index) => {
            if (row._isGroupHeader || row._isColumnGroupHeader) return renderGroupHeader(row);

            const isSelected = selectedRows.has(row.id);
            const isGrouped = row._isGroupedItem;

            return (
              <tr
                key={row.id || index}
                className={`data-row ${isSelected ? 'selected' : ''} ${isGrouped ? 'grouped' : ''} ${rowClassName}`}
                onContextMenu={(e) => onContextMenu && handleContextMenu(e, row, 'row')}
              >
                {selection && (
                  <td className="selection-column">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleRowSelect(row.id, e.target.checked)}
                      className="row-checkbox"
                    />
                  </td>
                )}
                {displayColumns.map((column) => (
                  <td
                    key={column.key}
                    style={{ width: column.width || 'auto' }}
                    className={`data-cell ${column.type || ''}`}
                  >
                    {renderCellContent(row, column)}
                  </td>
                ))}
              </tr>
            );
          })
        )}
        </tbody>
      </table>
    </div>
  );
});

export default CustomDataTable;