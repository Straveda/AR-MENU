import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {

        const backendUrl = import.meta.env.VITE_API_BASE_URL 
            ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '') 
            : 'http://localhost:8000';

        const newSocket = io(backendUrl, {
            withCredentials: true,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
