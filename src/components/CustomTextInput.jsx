import React, { useState, useRef, useEffect } from 'react';
import { Input } from 'antd';
import { CloseOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import './CustomTextInput.scss';

const CustomTextInput = (props) => {
  const {
    value,
    onChange,
    onBlur,
    onFocus,
    placeholder = 'Enter text...',
    type = 'text',
    clearable = true,
    disabled = false,
    readOnly = false,
    required = false,
    error = false,
    success = false,
    prefix,
    suffix,
    maxLength,
    showCount = false,
    autoFocus = false,
    size = 'default',
    className = '',
    wrapperClassName = '',
    label,
    helperText,
    hideNumberSpinners = true,
    ...restProps
  } = props;

  const [internalValue, setInternalValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    let newValue = e.target.value;

    if (type === 'number' && hideNumberSpinners) {
      newValue = newValue.replace(/[^\d.]/g, '');

      const dotCount = (newValue.match(/\./g) || []).length;
      if (dotCount > 1) {
        const firstDotIndex = newValue.indexOf('.');
        newValue = newValue.substring(0, firstDotIndex + 1) + newValue.substring(firstDotIndex + 1).replace(/\./g, '');
      }
    }

    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handlePaste = (e) => {
    if (type === 'number' && hideNumberSpinners) {
      const pasteData = e.clipboardData.getData('text');
      if (!/^\d*\.?\d*$/.test(pasteData)) {
        e.preventDefault();
      }
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setInternalValue('');
    onChange?.('');
    inputRef.current?.focus();
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getInputType = () => {
    if (type === 'password') {
      return showPassword ? 'text' : 'password';
    }
    return type;
  };

  const getInputMode = () => {
    if (type === 'number') {
      return 'decimal';
    }
    if (type === 'email') {
      return 'email';
    }
    if (type === 'tel') {
      return 'tel';
    }
    return 'text';
  };

  const renderSuffixIcons = () => {
    const icons = [];

    if (clearable && internalValue && !disabled && !readOnly) {
      icons.push(
        <CloseOutlined
          key="clear"
          className="custom-text-input__clear-icon"
          onClick={handleClear}
        />
      );
    }

    if (type === 'password' && !disabled && !readOnly) {
      icons.push(
        showPassword ? (
          <EyeInvisibleOutlined
            key="password"
            className="custom-text-input__password-icon"
            onClick={togglePasswordVisibility}
          />
        ) : (
          <EyeOutlined
            key="password"
            className="custom-text-input__password-icon"
            onClick={togglePasswordVisibility}
          />
        )
      );
    }

    if (suffix) {
      icons.push(
        <span key="custom-suffix" className="custom-text-input__custom-suffix">
          {suffix}
        </span>
      );
    }

    return icons.length > 0 ? icons : null;
  };

  const getWrapperClasses = () => {
    return [
      'custom-text-input__wrapper',
      `custom-text-input__wrapper--${size}`,
      isFocused && 'custom-text-input__wrapper--focused',
      disabled && 'custom-text-input__wrapper--disabled',
      readOnly && 'custom-text-input__wrapper--readonly',
      error && 'custom-text-input__wrapper--error',
      success && 'custom-text-input__wrapper--success',
      type === 'number' && hideNumberSpinners && 'custom-text-input__wrapper--no-spinners',
      wrapperClassName
    ].filter(Boolean).join(' ');
  };

  const getInputClasses = () => {
    return [
      'custom-text-input__input',
      `custom-text-input__input--${size}`,
      type === 'number' && hideNumberSpinners && 'custom-text-input__input--no-spinners',
      className
    ].filter(Boolean).join(' ');
  };

  return (
    <div className="custom-text-input">
      {label && (
        <label className="custom-text-input__label">
          {label}
          {required && <span className="custom-text-input__required">*</span>}
        </label>
      )}

      <div className={getWrapperClasses()}>
        {prefix && (
          <span className="custom-text-input__prefix">
            {prefix}
          </span>
        )}

        <Input
          ref={inputRef}
          value={internalValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={placeholder}
          type={getInputType()}
          inputMode={getInputMode()}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={type === 'number' ? undefined : maxLength}
          showCount={showCount}
          autoFocus={autoFocus}
          prefix={null}
          suffix={null}
          className={getInputClasses()}
          {...restProps}
        />

        {renderSuffixIcons() && (
          <div className="custom-text-input__suffix-icons">
            {renderSuffixIcons()}
          </div>
        )}
      </div>
      {(helperText || (showCount && maxLength && type !== 'number')) &&
        <div className="custom-text-input__footer">
          {helperText && (
            <div className={`custom-text-input__helper-text ${
              error ? 'custom-text-input__helper-text--error' : ''
            }`}>
              {helperText}
            </div>
          )}

          {showCount && maxLength && type !== 'number' && (
            <div className="custom-text-input__char-count">
              {internalValue.length}/{maxLength}
            </div>
          )}
        </div>
      }

    </div>
  );
};

export default CustomTextInput;