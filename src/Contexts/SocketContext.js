import { createContext } from "react";

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
}

export default SocketContext;

