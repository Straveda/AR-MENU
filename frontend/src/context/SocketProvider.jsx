import { createContext, useContext, useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthProvider";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export default function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;

    if (!apiUrl) {
      console.error('VITE_API_URL is not defined in environment variables');
      return;
    }

    const backendUrl = apiUrl.replace('/api/v1', '');

    if (!socketRef.current) {
      socketRef.current = io(backendUrl, {
        autoConnect: false,
        reconnection: true,
      });
      setSocket(socketRef.current);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
    }
  }, []);

  const joinRoom = useCallback((roomName) => {
    if (socketRef.current && socketRef.current.connected) {
      console.log(`Joining Room: ${roomName}`);
      socketRef.current.emit("join_room", roomName);
    } else {
      console.warn("Attempted to join room without connection");
    }
  }, []);

  const leaveRoom = useCallback((roomName) => {
    if (socketRef.current && socketRef.current.connected) {
      console.log(`Leaving Room: ${roomName}`);
      socketRef.current.emit("leave_room", roomName);
    }
  }, []);

  const value = {
    socket,
    connect,
    disconnect,
    joinRoom,
    leaveRoom
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
