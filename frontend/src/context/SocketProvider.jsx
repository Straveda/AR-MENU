import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthProvider";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export default function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth(); 

  const socketRef = useRef(null);

  if (!socketRef.current) {
      socketRef.current = io("http://localhost:8000", {
          autoConnect: false,
          reconnection: true,
      });
  }
  const socket = socketRef.current;

  const connect = useCallback(() => {
    if (!socket.connected) {
        socket.connect();
    }
  }, [socket]);

  const disconnect = useCallback(() => {
    if (socket.connected) {
        socket.disconnect();
    }
  }, [socket]);

  const joinRoom = useCallback((roomName) => {
    if (socket.connected) {
        console.log(`Joining Room: ${roomName}`);
        socket.emit("join_room", roomName);
    } else {
        console.warn("Attempted to join room without connection");
    }
  }, [socket]);

  const leaveRoom = useCallback((roomName) => {
    if (socket.connected) {
        console.log(`Leaving Room: ${roomName}`);
        socket.emit("leave_room", roomName);
    }
  }, [socket]);

  useEffect(() => {
    return () => {
        disconnect();
    };
  }, [disconnect]);

  const value = {
      socket,
      connect,
      disconnect,
      joinRoom,
      leaveRoom
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
