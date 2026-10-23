import { useEffect, useState } from 'react';
import { socketService } from '../../../shared/services/socket';

export const useOrderSocket = (orderId) => {
  const [driverLocation, setDriverLocation] = useState(null);

  useEffect(() => {
    const socket = socketService.connect();
    
    socket.emit('subscribe_order', { orderId });
    
    socket.on('driver_location', (data) => {
      setDriverLocation(data);
    });

    return () => {
      socket.off('driver_location');
    };
  }, [orderId]);

  return { driverLocation };
};
