import React, { useEffect, useRef } from 'react';
import './ContextMenu.scss';

const ContextMenu = ({ x, y, onClose, actions = [] }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleActionClick = (action) => {
    action.onClick();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 1000
      }}
    >
      <div className="context-menu-content">
        {actions.map((action, index) => (
          <div
            key={index}
            className="context-menu-item"
            onClick={() => handleActionClick(action)}
          >
            {action.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContextMenu;