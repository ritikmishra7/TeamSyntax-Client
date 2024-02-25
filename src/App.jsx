import { useState, useEffect } from 'react';
import './App.css'
import CodeEditor from './Components/CodeEditor'
import SocketContext from './Contexts/SocketContext';
import { io } from "socket.io-client";

function App() {

  const [socket, setSocket] = useState(null);

  let BACKEND_URL = "http://localhost:4000";

  if (process.env.NODE_ENV === 'production') {
    BACKEND_URL = process.env.VITE_BACKEND_URL;
  }


  function initializeSocket() {
    try {
      const socketInstance = io(BACKEND_URL, {
        withCredentials: true,
      });
      setSocket(socketInstance);
      console.log('socket connected');
    } catch (error) {
      console.log('Error connecting to socket: ', error.message);
    }
  }




  useEffect(() => {
    initializeSocket();
    return () => {
      if (socket) {
        console.log('socket disconnected');
        socket.disconnect();
      }
    };
  }, []);


  return (
    <SocketContext.Provider value={socket}>
      {socket && <CodeEditor />}
    </SocketContext.Provider>
  )
}

export default App
