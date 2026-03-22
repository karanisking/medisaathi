import { useEffect } from 'react';
import { connectSocket } from '../utils/socket.js';
import { useAuth } from '../context/authContext.jsx';

/**
 * Joins the patient's personal socket room for targeted notifications.
 * Call this once in MyToken.jsx so the patient gets "your_turn" events.
 */
const usePatientSocket = (eventHandlers = {}) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?._id) return;

    const socket = connectSocket();
    socket.emit('join:patient', user._id);

    const entries = Object.entries(eventHandlers);
    entries.forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      entries.forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      socket.emit('leave:patient', user._id);
    };
  }, [user?._id]);
};

export default usePatientSocket;