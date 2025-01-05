import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

interface Notification {
    id: number;
    message: string;
}


// in-dev

const NotificationsDropdown: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const handleToggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleClearNotifications = () => {
        setNotifications([]);
    };

    return (
        <div className="notifications-dropdown">
            <button className="notification-button" onClick={handleToggleDropdown}>
                <FontAwesomeIcon icon={faBell} style={{ color: 'white' }} />
            </button>

            {isOpen && (
                <div className="dropdown-content">
                    {notifications.length === 0 ? (
                        <p>No notifications</p>
                    ) : (
                        <ul>
                            {notifications.map((notification) => (
                                <li key={notification.id}>{notification.message}</li>
                            ))}
                        </ul>
                    )}

                    <button onClick={handleClearNotifications}>Clear Notifications</button>
                </div>
            )}
        </div>
    );
};

export default NotificationsDropdown;