import React, { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext.jsx';

const Notification = () => {
  const { notification, hideNotification } = useContext(NotificationContext);

  if (!notification) return null;

  const getNotificationStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-black';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`${getNotificationStyles(notification.type)} p-4 rounded-lg shadow-lg flex items-center justify-between`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {notification.type === 'success' && '✓'}
            {notification.type === 'error' && '✕'}
            {notification.type === 'warning' && '⚠'}
            {notification.type === 'info' && 'ℹ'}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">
              {notification.message}
            </p>
          </div>
        </div>
        <button
          onClick={hideNotification}
          className="ml-4 flex-shrink-0 hover:opacity-75 transition-opacity"
        >
          <span className="sr-only">Close</span>
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Notification;
