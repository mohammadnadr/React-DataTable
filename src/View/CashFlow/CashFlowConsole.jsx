import React, { useState, useEffect } from 'react';
import { Card, message } from 'antd';
import FilterSection from './Components/FilterSection';
import CashFlowTable from './Components/CashFlowTable';
import ViewManager from './Components/ViewManager';
import { cashflowMockData } from './mockData';
import './CashflowConsole.scss';

const CashFlowConsole = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState(null);
  const [savedViews, setSavedViews] = useState([]);

  // Storage keys
  const STORAGE_KEYS = {
    VIEWS: 'cashflow_views',
    CURRENT_VIEW: 'cashflow_current_view'
  };

  useEffect(() => {
    loadInitialData();
    loadSavedViews();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await axios.get('/api/cashflows');
      // setData(response.data);

      // Using mock data for now
      setData(cashflowMockData);
      setFilteredData(cashflowMockData);
    } catch (error) {
      message.error('Failed to load cashflow data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedViews = () => {
    try {
      const viewsFromStorage = localStorage.getItem(STORAGE_KEYS.VIEWS);
      const currentViewFromStorage = localStorage.getItem(STORAGE_KEYS.CURRENT_VIEW);

      const views = viewsFromStorage ? JSON.parse(viewsFromStorage) : [];
      const currentView = currentViewFromStorage ? JSON.parse(currentViewFromStorage) : null;

      setSavedViews(views);

      if (currentView) {
        setCurrentView(currentView);
        // Apply view filters
        handleFilterApply(currentView.filters);
      }
    } catch (error) {
      console.error('Error loading views from storage:', error);
      setSavedViews([]);
    }
  };

  const saveToStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to storage (${key}):`, error);
      message.error('Failed to save data');
    }
  };

  const handleFilterApply = (filters) => {
    let filtered = [...data];

    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key].length > 0) {
        filtered = filtered.filter(item => filters[key].includes(item[key]));
      }
    });

    setFilteredData(filtered);
  };

  const handleViewSave = (viewData) => {
    const newView = {
      id: Date.now().toString(),
      name: viewData.name,
      description: viewData.description,
      filters: viewData.filters || {},
      columns: viewData.columns || [],
      createdAt: new Date().toISOString()
    };

    const updatedViews = [...savedViews, newView];
    setSavedViews(updatedViews);
    setCurrentView(newView);

    // Save to localStorage
    saveToStorage(STORAGE_KEYS.VIEWS, updatedViews);
    saveToStorage(STORAGE_KEYS.CURRENT_VIEW, newView);

    message.success('View saved successfully');
  };

  const handleViewLoad = (view) => {
    setCurrentView(view);
    saveToStorage(STORAGE_KEYS.CURRENT_VIEW, view);

    // Apply view filters
    handleFilterApply(view.filters);
    message.info(`Loaded view: ${view.name}`);
  };

  const handleViewDelete = (viewId) => {
    const updatedViews = savedViews.filter(view => view.id !== viewId);
    setSavedViews(updatedViews);
    saveToStorage(STORAGE_KEYS.VIEWS, updatedViews);

    if (currentView && currentView.id === viewId) {
      setCurrentView(null);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_VIEW);
    }

    message.success('View deleted successfully');
  };

  const handleClearAllViews = () => {
    setSavedViews([]);
    setCurrentView(null);
    localStorage.removeItem(STORAGE_KEYS.VIEWS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_VIEW);
    message.success('All views cleared');
  };

  const handleResetToDefault = () => {
    setCurrentView(null);
    setFilteredData(cashflowMockData);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_VIEW);
    message.info('Reset to default view');
  };

  return (
      <div className="console-card">
        {/*<ViewManager*/}
        {/*  savedViews={savedViews}*/}
        {/*  currentView={currentView}*/}
        {/*  onViewSave={handleViewSave}*/}
        {/*  onViewLoad={handleViewLoad}*/}
        {/*  onViewDelete={handleViewDelete}*/}
        {/*  onClearAllViews={handleClearAllViews}*/}
        {/*  onResetToDefault={handleResetToDefault}*/}
        {/*/>*/}

        {/*<FilterSection*/}
        {/*  onFilterApply={handleFilterApply}*/}
        {/*  currentView={currentView}*/}
        {/*/>*/}

        <CashFlowTable
          data={filteredData}
          loading={loading}
          currentView={currentView}
        />
      </div>
  );
};

export default CashFlowConsole;