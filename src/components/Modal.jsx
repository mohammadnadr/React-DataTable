// Modal.jsx
import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import './Modal.scss';

const Modal = ({
  open = false,
  onClose,
  title,
  children,
  actions,
  persistent = false,
  maxWidth = 500,
  minWidth,
  maxHeight = '90vh',
  minHeight,
  showDefaultActions = true,
  onSubmit,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  hideActions = false,
  closeIcon = true
}) => {
  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !persistent) {
      onClose?.();
    }
  };

  const handleSubmit = () => {
    onSubmit?.();
  };

  const handleCancel = () => {
    onClose?.();
  };

  const defaultActions = (
    <div className="modal-actions-container">
      <button
        className="custom-btn custom-btn-secondary"
        onClick={handleCancel}
      >
        {cancelLabel}
      </button>
      <button
        className="custom-btn custom-btn-primary"
        onClick={handleSubmit}
      >
        {submitLabel}
      </button>
    </div>
  );

  const finalActions = hideActions
    ? null 
    : actions !== undefined 
      ? actions 
      : showDefaultActions 
        ? defaultActions 
        : null;

  const modalStyle = {
    maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
    minWidth: minWidth ? (typeof minWidth === 'number' ? `${minWidth}px` : minWidth) : undefined,
    maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
    minHeight: minHeight ? (typeof minHeight === 'number' ? `${minHeight}px` : minHeight) : undefined,
  };

  return (
    <div className="custom-modal-overlay" onClick={handleOverlayClick}>
      <div 
        className="custom-modal" 
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
      >
        <div className="custom-modal-header">
          <div className="custom-modal-title">
            {typeof title === 'string' ? (
              <h2>{title}</h2>
            ) : (
              title
            )}
          </div>
          {closeIcon && (
            <button
              className="custom-modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              <CloseOutlined />
            </button>
          )}
        </div>
        
        <div className="custom-modal-content">
          {children}
        </div>
        
        {finalActions && (
          <div className="custom-modal-actions">
            {finalActions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;