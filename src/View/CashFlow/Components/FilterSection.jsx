import React, { useState } from 'react';
import { Button, Space, Row, Col, Card, Select, Input } from 'antd';
import { FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { filterOptions } from '../mockData';
import './FilterSection.scss';

const { Option } = Select;

const FilterSection = ({ onFilterApply, currentView }) => {
  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');

  const handleFilterChange = (field, value) => {
    const newFilters = {
      ...filters,
      [field]: value
    };
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFilterApply(filters);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchText('');
    onFilterApply({});
  };

  return (
    <div className="filter-section">
      <Row gutter={[16, 16]} align="middle" className='d-flex'>
        <Col span={8} >
          <Input
            placeholder="Search columns..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Col>

        <Col span={8} >
          <Space wrap size="small">
            <Select
              placeholder="Cashflow Status"
              style={{ width: 160 }}
              value={filters.cashflowStatus}
              onChange={(value) => handleFilterChange('cashflowStatus', value)}
              allowClear
              mode="multiple"
            >
              {filterOptions.cashflowStatus.map(status => (
                <Option key={status} value={status}>{status}</Option>
              ))}
            </Select>

            <Select
              placeholder="Buy/Sell"
              style={{ width: 120 }}
              value={filters.buySell}
              onChange={(value) => handleFilterChange('buySell', value)}
              allowClear
            >
              {filterOptions.buySell.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>

            <Select
              placeholder="Invoice Status"
              style={{ width: 160 }}
              value={filters.invoiceStatus}
              onChange={(value) => handleFilterChange('invoiceStatus', value)}
              allowClear
              mode="multiple"
            >
              {filterOptions.invoiceStatus.map(status => (
                <Option key={status} value={status}>{status}</Option>
              ))}
            </Select>

            <Select
              placeholder="Commodity"
              style={{ width: 140 }}
              value={filters.commodity}
              onChange={(value) => handleFilterChange('commodity', value)}
              allowClear
              mode="multiple"
            >
              {filterOptions.commodity.map(commodity => (
                <Option key={commodity} value={commodity}>{commodity}</Option>
              ))}
            </Select>
          </Space>
        </Col>

        <Col span={8} >
          <Space>
            <Button
              type="primary"
              icon={<FilterOutlined />}
              onClick={handleApplyFilters}
            >
              Apply
            </Button>
            <Button onClick={handleClearFilters}>
              Clear
            </Button>
          </Space>
        </Col>
      </Row>

      {currentView && (
        <div className="current-view-info">
          <span>Active View: <strong>{currentView.name}</strong></span>
        </div>
      )}
    </div>
  );
};

export default FilterSection;