

# Mohammad Nadr
# React Data Table Grid
### Built with the tools and technologies:

<p>
  <img src="https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white" alt="JSON" />
  <img src="https://img.shields.io/badge/Markdown-000000?style=for-the-badge&logo=markdown&logoColor=white" alt="Markdown" />
  <img src="https://img.shields.io/badge/npm-CB0000?style=for-the-badge&logo=npm&logoColor=white" alt="npm" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=000" alt="JavaScript" />
  <img src="https://img.shields.io/badge/React-0A7EA4?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=sass&logoColor=white" alt="Sass" />
</p>

## Overview

React-DataTable is a versatile React component library that empowers developers to create sophisticated, interactive data grids with ease. It offers a rich set of features for displaying, sorting, filtering, grouping, and exporting data, all optimized for large and dynamic datasets.

### Why React-DataTable?

This project streamlines complex data management tasks and enhances user experience through a collection of reusable, customizable components. The core features include:

🎯 Advanced Data Handling: Supports sorting, filtering, grouping, and aggregation for comprehensive data analysis.

🧩 Reusable UI Components: Includes modals, context menus, searchable combo boxes, and custom inputs for flexible UI design.

🚀 Performance & Responsiveness: Designed to efficiently render large datasets across various devices and screen sizes.

🔧 Seamless Integration: Built with React and Ant Design, ensuring smooth integration into existing projects.

📊 Data Export & Management: Facilitates exporting data, saving/loading views, and managing complex workflows.
## Live Demo

Check out the live demo at: [https://mohammadnadr.github.io/React-DataTable/](https://mohammadnadr.github.io/React-DataTable/)

## Features

### 🎯 Core Features
- **High Performance**: Optimized for large datasets with virtual scrolling
- **Flexible Data Sources**: Support for local and remote data
- **Advanced Sorting**: Multi-column sorting with custom sort functions
- **Powerful Filtering**: Column-based filtering with multiple filter types
- **Row Selection**: Single and multi-row selection with checkboxes

### 🎨 Advanced Features
- **Column Grouping**: Hierarchical grouping with expand/collapse functionality
- **Data Aggregation**: Sum, average, count, and custom aggregations
- **Column Reordering**: Drag-and-drop column rearrangement
- **Custom Rendering**: Slot-based custom cell and header rendering
- **Context Menu**: Right-click context menus for rows and headers
- **Export Capabilities**: Export to Excel, CSV, and PDF formats
- **Saved Views**: Save and load custom table configurations
- **Responsive Design**: Mobile-friendly and responsive layout

### 🔧 Customization
- **Custom Styling**: Full CSS customization with SCSS support
- **Custom Components**: Inject custom React components into cells
- **Theme Support**: Light and dark theme compatibility
- **Localization**: Multi-language support
- **Accessibility**: WCAG 2.1 compliant with keyboard navigation

## Installation

### Using npm
```bash
npm install react-pro-datagrid
```

### Using yarn
```bash
yarn add react-pro-datagrid
```

### Peer Dependencies
This package requires the following peer dependencies:
```bash
npm install react react-dom antd
```

## Quick Start

```jsx
import React from 'react';
import { GenericDataTable } from 'react-pro-datagrid';

const App = () => {
  const data = [
    { id: 1, name: 'John Doe', age: 28, department: 'Engineering' },
    { id: 2, name: 'Jane Smith', age: 32, department: 'Marketing' },
    { id: 3, name: 'Bob Johnson', age: 45, department: 'Sales' }
  ];

  const columns = [
    { key: 'name', title: 'Name', width: 150, sortable: true, type: 'string' },
    { key: 'age', title: 'Age', width: 100, sortable: true, type: 'number' },
    { key: 'department', title: 'Department', width: 120, sortable: true, type: 'string' }
  ];

  return (
    <GenericDataTable
      data={data}
      columns={columns}
      title="Employee Data"
      loading={false}
    />
  );
};

export default App;
```

## Core Components

### GenericDataTable
The main component that provides all table functionality.

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | Array | `[]` | Array of data objects |
| `columns` | Array | `[]` | Column configuration array |
| `loading` | Boolean | `false` | Loading state |
| `title` | String | `"Data Table"` | Table title |
| `selection` | Boolean | `true` | Enable row selection |
| `onSelectionChange` | Function | - | Callback when selection changes |
| `onRefresh` | Function | - | Callback for refresh action |
| `onExport` | Function | - | Custom export handler |
| `enableGrouping` | Boolean | `false` | Enable data grouping |
| `enableAggregation` | Boolean | `false` | Enable data aggregation |
| `enableColumnReordering` | Boolean | `false` | Enable column reordering |
| `contextMenuActions` | Object | `{}` | Context menu configuration |
| `slots` | Object | `{}` | Custom render slots |
| `stickyHeader` | Boolean | `true` | Enable sticky header |

### Column Configuration
```jsx
const columns = [
  {
    key: 'id',
    title: 'ID',
    width: 100,
    sortable: true,
    type: 'number',
    filterable: true
  },
  {
    key: 'name', 
    title: 'Name',
    width: 200,
    sortable: true,
    type: 'string',
    filterable: true
  }
];
```

## Advanced Usage

### Custom Cell Rendering
```jsx
const slots = {
  status: ({ value, row }) => (
    <Tag color={value === 'active' ? 'green' : 'red'}>
      {value.toUpperCase()}
    </Tag>
  ),
  amount: ({ value, row }) => (
    <span style={{ 
      color: value > 0 ? 'green' : 'red',
      fontWeight: 'bold'
    }}>
      ${value.toLocaleString()}
    </span>
  )
};

<GenericDataTable
  data={data}
  columns={columns}
  slots={slots}
/>
```

### Data Grouping
```jsx
<GenericDataTable
  data={data}
  columns={columns}
  enableGrouping={true}
  onGroup={(groupedData) => console.log('Grouped:', groupedData)}
/>
```

### Context Menu
```jsx
const contextMenuActions = {
  rowActions: (rows, clickedRow) => [
    {
      label: 'Edit Row',
      onClick: () => handleEdit(clickedRow)
    },
    {
      label: 'Delete Row', 
      onClick: () => handleDelete(clickedRow)
    }
  ]
};

<GenericDataTable
  data={data}
  columns={columns}
  contextMenuActions={contextMenuActions}
/>
```

### Custom Export
```jsx
const handleExport = (data, selectedRows) => {
  // Custom export logic
  exportToExcel(selectedRows.length > 0 ? selectedRows : data);
};

<GenericDataTable
  data={data}
  columns={columns}
  onExport={handleExport}
/>
```

## API Reference

### Column Properties
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `key` | String | Yes | Unique identifier for the column |
| `title` | String | Yes | Display title for the column |
| `width` | String/Number | No | Column width (px or %) |
| `sortable` | Boolean | No | Enable sorting for this column |
| `type` | String | No | Data type: 'string', 'number', 'date' |
| `filterable` | Boolean | No | Enable filtering for this column |
| `hidden` | Boolean | No | Hide column by default |

### Data Types
- **string**: Text data with string sorting
- **number**: Numeric data with numerical sorting
- **date**: Date objects with date sorting
- **boolean**: Boolean values with toggle display

### Event Handlers
- `onSort`: Triggered when column sorting changes
- `onFilter`: Triggered when filters are applied
- `onRowClick`: Triggered when a row is clicked
- `onSelectionChange`: Triggered when row selection changes
- `onGroupChange`: Triggered when grouping changes

## Examples

### Cash Flow Management
```jsx
import { CashFlowConsole } from 'react-pro-datagrid';

const App = () => {
  return (
    <div className="app">
      <CashFlowConsole />
    </div>
  );
};
```

### Custom Toolbar
```jsx
const customButtons = [
  {
    label: 'Custom Action',
    onClick: () => alert('Custom action triggered'),
    icon: <UserOutlined />
  }
];

<GenericDataTable
  data={data}
  columns={columns}
  customButtons={customButtons}
/>
```

### Modal Mode
```jsx
<GenericDataTable
  data={data}
  columns={columns}
  modalMode={true}
  hideToolbar={true}
/>
```

## Styling and Themes

### Custom CSS Variables
```css
:root {
  --table-header-bg: #fafafa;
  --table-row-hover: #f5f5f5;
  --table-border-color: #f0f0f0;
  --table-selected-bg: #e6f7ff;
}
```

### SCSS Customization
Import and override SCSS variables:
```scss
@import '~react-pro-datagrid/dist/scss/variables';

$table-header-bg: #your-color;
$table-font-size: 14px;

@import '~react-pro-datagrid/dist/scss/main';
```

## Performance Tips

1. **Virtual Scrolling**: Enable for datasets larger than 1000 rows
2. **Memoization**: Use `React.memo` for custom cell components
3. **Column Optimization**: Only include necessary columns
4. **Data Pagination**: Use server-side pagination for large datasets

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
git clone https://github.com/mohammadnadr/React-DataTable.git
cd React-DataTable
npm install
npm start
```

### Building for Production
```bash
npm run build
```

### Running Tests
```bash
npm test
```

## License

MIT License - see LICENSE file for details.

## Support

- 📧 Email: amoo.nadr81@gmail.com
- 🐛 [Issue Tracker](https://github.com/mohammadnadr/React-DataTable/issues)

[//]: # (- 📖 [Documentation]&#40;https://mohammadnadr.github.io/React-DataTable/docs&#41;)

## Changelog

### v0.1.2
- Added advanced grouping functionality
- Improved performance for large datasets
- Enhanced export capabilities
- Added context menu support
- Fixed sorting and filtering bugs

### v0.1.0
- Initial release with basic table functionality
- Sorting and filtering capabilities
- Excel export functionality
- Custom column rendering

---

Built with ❤️ by [Mohammad Nadr](https://github.com/mohammadnadr)
