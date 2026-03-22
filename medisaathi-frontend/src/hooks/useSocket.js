import { useEffect, useRef } from 'react';
import { getSocket, connectSocket } from '../utils/socket.js';


const useSocket = (branchId, eventHandlers = {}) => {
  const handlersRef = useRef(eventHandlers);

  // Keep handlers ref updated without re-running effect
  useEffect(() => {
    handlersRef.current = eventHandlers;
  });

  useEffect(() => {
    if (!branchId) return;

    const socket = connectSocket();

    socket.emit('join:branch', branchId);

    // Register all event handlers
    const entries = Object.entries(handlersRef.current);
    entries.forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      // Cleanup on unmount
      entries.forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      socket.emit('leave:branch', branchId);
    };
  }, [branchId]);
};

export default useSocket;