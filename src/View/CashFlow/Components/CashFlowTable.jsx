// CashFlowTable.jsx
import React, { useState, useMemo, useRef } from 'react';
import { Tag, Tooltip, } from 'antd';
import './CashFlowTable.scss';
import GenericDataTable from "components/Hybrids/CustomDataTable/GenericDataTable.jsx"
const CashFlowTable = ({ data, loading, currentView }) => {

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

    // Define all columns
    const columns  = useMemo(
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

    // Action handlers
    const handleSplitCashFlow = (rows) => {
        console.log('Split cash flow for :', rows);
        // Implement view details logic here
    };
    const handleDrillDown = (rows) => {
        console.log('Drill down for:', rows);
        // Implement drill down logic here
    };
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

    const contextMenuActions = {
        rowActions: (rows, clickedRow) => [
            {
                label: 'Split Cash Flow',
                onClick: () => handleSplitCashFlow(clickedRow)
            },
            {
                label: 'Drill Down',
                onClick: () => handleDrillDown(clickedRow)
            }
        ]
    };

    const handleRefresh = () => {
        console.log('refresh');
        // Your refresh logic
    };

    return (
        <GenericDataTable
            data={data}
            columns={columns}
            loading={loading}
            title="Cash_Flow"
            onRefresh={handleRefresh}
            // onExport={handleExport}
            contextMenuActions={contextMenuActions}
            slots={slots}
            enableGrouping={true}
            enableAggregation={true}
            enableColumnReordering={true}
        />
    );
};

export default CashFlowTable;