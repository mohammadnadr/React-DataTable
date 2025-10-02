import React, { useState } from 'react';
import { Button, Space, Modal, Form, Input, List, Tag, Popconfirm, Select } from 'antd';
import {
  SaveOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  ClearOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import './ViewManager.scss';

const { Option } = Select;

const ViewManager = ({
                       savedViews,
                       currentView,
                       onViewSave,
                       onViewLoad,
                       onViewDelete,
                       onClearAllViews,
                       onResetToDefault
                     }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [saveForm] = Form.useForm();

  const handleSaveView = (values) => {
    onViewSave({
      name: values.name,
      description: values.description,
      filters: values.filters || {},
      columns: values.columns || []
    });
    setIsModalVisible(false);
    saveForm.resetFields();
  };

  // Sample views data
  const sampleViews = [
    {
      id: 'sample-1',
      name: 'Active Trades',
      description: 'Show all active cashflow records',
      filters: { cashflowStatus: ['Active'] },
      columns: ['cashflowNumber', 'tradeNumber', 'buySell', 'commodity', 'quantity', 'price']
    },
    {
      id: 'sample-2',
      name: 'Pending Invoices',
      description: 'Records waiting for invoicing',
      filters: { invoiceStatus: ['Not Invoiced'] },
      columns: ['cashflowNumber', 'tradeNumber', 'counterpart', 'quantity', 'extendedAmount']
    }
  ];

  // Simple select dropdown for saved views
  const handleViewSelect = (viewId) => {
    const view = savedViews.find(v => v.id === viewId);
    if (view) {
      onViewLoad(view);
    }
  };

  // Simple select dropdown for sample views
  const handleSampleViewSelect = (viewId) => {
    const view = sampleViews.find(v => v.id === viewId);
    if (view) {
      onViewLoad(view);
    }
  };

  return (
    <div className="view-manager">
      <div className="view-manager-header">
        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Save View
          </Button>

          {/* Saved Views Dropdown Replacement */}
          <Select
            placeholder="Load Saved View"
            style={{ width: 200 }}
            value={currentView?.id}
            onChange={handleViewSelect}
            disabled={savedViews.length === 0}
          >
            {savedViews.map(view => (
              <Option key={view.id} value={view.id}>
                {view.name}
              </Option>
            ))}
          </Select>

          {/* Sample Views Dropdown Replacement */}
          <Select
            placeholder="Sample Views"
            style={{ width: 150 }}
            onChange={handleSampleViewSelect}
          >
            {sampleViews.map(view => (
              <Option key={view.id} value={view.id}>
                {view.name}
              </Option>
            ))}
          </Select>

          <Button
            icon={<ReloadOutlined />}
            onClick={onResetToDefault}
          >
            Reset
          </Button>

          {savedViews.length > 0 && (
            <Popconfirm
              title="Clear all views?"
              description="Are you sure you want to delete all saved views?"
              onConfirm={onClearAllViews}
              okText="Yes"
              cancelText="No"
            >
              <Button icon={<ClearOutlined />} danger>
                Clear All
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      {savedViews.length > 0 && (
        <div className="saved-views-list">
          <h4>Saved Views:</h4>
          <List
            size="small"
            dataSource={savedViews}
            renderItem={view => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    size="small"
                    onClick={() => onViewLoad(view)}
                  >
                    Load
                  </Button>,
                  <Button
                    type="link"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => onViewDelete(view.id)}
                  />
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span>{view.name}</span>
                      {currentView?.id === view.id && (
                        <Tag color="blue">Active</Tag>
                      )}
                    </Space>
                  }
                  description={view.description}
                />
              </List.Item>
            )}
          />
        </div>
      )}

      <Modal
        title="Save Current View"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          saveForm.resetFields();
        }}
        onOk={() => saveForm.submit()}
      >
        <Form
          form={saveForm}
          layout="vertical"
          onFinish={handleSaveView}
        >
          <Form.Item
            name="name"
            label="View Name"
            rules={[{ required: true, message: 'Please enter a view name' }]}
          >
            <Input placeholder="Enter view name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea
              placeholder="Enter view description"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ViewManager;