// SearchableComboBox.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {  Tag, } from 'antd';
import { CloseOutlined, DownOutlined } from '@ant-design/icons';
import './SearchableComboBox.scss';

const SearchableComboBox = ({
  value,
  onChange,
  items = [],
  itemTitle = 'title',
  itemValue = 'id',
  placeholder = 'Select items...',
  clearable = true,
  disabled = false,
  multiple = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Get value from item using itemValue key
  const getItemValue = (item) => {
    if (!item) return undefined;
    if (typeof item !== 'object') return item;
    return item[itemValue] !== undefined ? item[itemValue] : undefined;
  };

  // Get display text from item using itemTitle key
  const getItemTitle = (item) => {
    if (!item) return '';
    if (typeof item !== 'object') return String(item);
    return item[itemTitle] !== undefined ? String(item[itemTitle]) : 'Unknown';
  };

  // Initialize selected items based on value prop
  useEffect(() => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      setSelectedItems([]);
      return;
    }

    try {
      if (multiple && Array.isArray(value)) {
        const itemsToSelect = value.map(val => {
          if (typeof val === 'object' && val !== null) {
            return val;
          } else {
            const found = items.find(item => getItemValue(item) == val);
            return found || { [itemValue]: val, [itemTitle]: `ID: ${val}` };
          }
        });
        setSelectedItems(itemsToSelect);
      } else if (!multiple) {
        let actualValue = value;
        if (Array.isArray(value) && value.length === 1) {
          actualValue = value[0];
        }

        if (actualValue === null || actualValue === undefined || actualValue === '') {
          setSelectedItems([]);
          return;
        }

        let item;
        if (typeof actualValue === 'object' && actualValue !== null) {
          item = actualValue;
        } else {
          item = items.find(item => getItemValue(item) == actualValue);
        }

        if (item) {
          setSelectedItems([item]);
        } else if (actualValue) {
          const placeholderItem = {
            [itemValue]: actualValue,
            [itemTitle]: `ID: ${actualValue}`
          };
          setSelectedItems([placeholderItem]);
        } else {
          setSelectedItems([]);
        }
      }
    } catch (error) {
      console.error('Error initializing selected items:', error);
      setSelectedItems([]);
    }
  }, [value, multiple, items, itemValue, itemTitle]);

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    
    return items.filter(item => {
      const title = getItemTitle(item).toLowerCase();
      return title.includes(searchTerm.toLowerCase());
    });
  }, [items, searchTerm]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle item selection
  const handleSelectItem = (item) => {
    if (multiple) {
      const isAlreadySelected = selectedItems.some(selected => getItemValue(selected) === getItemValue(item));
      
      if (isAlreadySelected) {
        // Remove if already selected
        const newSelected = selectedItems.filter(selected => getItemValue(selected) !== getItemValue(item));
        setSelectedItems(newSelected);
        onChange?.(newSelected.map(selected => getItemValue(selected)));
      } else {
        // Add to selection
        const newSelected = [...selectedItems, item];
        setSelectedItems(newSelected);
        onChange?.(newSelected.map(selected => getItemValue(selected)));
      }
    } else {
      // Single selection
      setSelectedItems([item]);
      onChange?.(getItemValue(item));
      setIsDropdownOpen(false);
      setSearchTerm('');
    }
  };

  // Remove a single selected item
  const handleRemoveItem = (itemToRemove, e) => {
    e.stopPropagation();
    const newSelected = selectedItems.filter(item => getItemValue(item) !== getItemValue(itemToRemove));
    setSelectedItems(newSelected);
    
    if (multiple) {
      onChange?.(newSelected.map(item => getItemValue(item)));
    } else {
      onChange?.(null);
    }
  };

  // Clear all selections
  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedItems([]);
    onChange?.(multiple ? [] : null);
    setSearchTerm('');
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (disabled) return;
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchTerm('');
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsFocused(true);
    if (!isDropdownOpen) {
      setIsDropdownOpen(true);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    setIsFocused(false);
    // Don't close dropdown immediately to allow for item selection
  };

  // Check if item is selected
  const isItemSelected = (item) => {
    return selectedItems.some(selected => getItemValue(selected) === getItemValue(item));
  };

  // Render selected items as tags in input
  const renderSelectedTags = () => {

    return (
      <div className="selected-tags-container">
        {selectedItems.map((item, index) => {
          const itemKey = getItemValue(item);
          const itemDisplayTitle = getItemTitle(item);
          const key = itemKey !== undefined ? `tag-${itemKey}` : `tag-${index}`;

          return (
            <Tag
              key={key}
              closable={!disabled && clearable}
              onClose={(e) => handleRemoveItem(item, e)}
              className="selected-tag"
            >
              {itemDisplayTitle}
            </Tag>
          );
        })}
      </div>
    );
  };

  return (
    <div className="searchable-combobox" ref={dropdownRef}>
      {/* Main input with tags */}
      <div 
        className={`combobox-input ${isFocused ? 'focused' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={toggleDropdown}
      >
        <div className="input-content">
          {renderSelectedTags()}
          
          {/* Search input for filtering */}
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={selectedItems.length === 0 ? placeholder : ''}
            disabled={disabled}
          />
        </div>
        
        <div className="input-suffix">
          {clearable && selectedItems.length > 0 && (
            <CloseOutlined
              onClick={handleClear}
              className="clear-icon"
            />
          )}
          <DownOutlined 
            className={`dropdown-arrow ${isDropdownOpen ? 'rotated' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <div className="combobox-dropdown">
          <div className="dropdown-content">
            {filteredItems.length === 0 ? (
              <div className="no-results">
                {searchTerm ? 'No items found' : 'No items available'}
              </div>
            ) : (
              <div className="items-list">
                {filteredItems.map((item, index) => {
                  const isSelected = isItemSelected(item);
                  const itemTitleText = getItemTitle(item);
                  
                  return (
                    <div
                      key={getItemValue(item) || index}
                      className={`dropdown-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectItem(item)}
                    >
                      <span className="item-text">{itemTitleText}</span>
                      {isSelected && (
                        <span className="check-mark">✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableComboBox;