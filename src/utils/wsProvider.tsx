import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

import { v4 as uuidv4 } from "uuid";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// add a type for the error
export type WSError = {
  message: string;
  code?: string;
  details?: any;
};

type WSContextType = {
  emit: (
    event: string,
    data: any,
    onError?: (error: WSError) => void,
    onSuccess?: (response: any) => void,
  ) => Promise<void>;
  connected: boolean;
  addEventListener: (
    type: string,
    listener: (data: Map<string, unknown>) => void,
  ) => void;
  removeEventListener: (
    type: string,
    listener: (data: Map<string, unknown>) => void,
  ) => void;
  userId: string;
};

const getUserId = () => {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem("userId", userId!);
  }
  return userId;
};

export const WSContext = createContext<WSContextType | null>(null);

export function WebSocketProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const ws = useRef<ReturnType<typeof io> | null>(null);
  const [connected, setConnected] = useState(false);
  const userId = useRef(getUserId());

  useEffect(() => {
    console.log("Connecting to WebSocket...");

    const socket = io(BACKEND_URL, {
      auth: {
        userId: userId.current,
      },
    });
    ws.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket connected");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setConnected(false);
    });

    socket.on("CONNECTED_ELSEWHERE", () => {
      window.location.href = "/connected-elsewhere";
      socket.disconnect();
    });

    return () => {
      socket.close();
    };
  }, []);

  const emit = async (
    event: string,
    data: any,
    onError?: (error: WSError) => void,
    onSuccess?: (response: any) => void,
  ) => {
    if (!ws.current) {
      return;
    }
    ws.current.emit(event, data, (response: any) => {
      if (response?.ok === true && response.data) {
        onSuccess?.(response.data);
        return;
      } else if (response?.ok === false && response.error) {
        onError?.(response.error);
        return;
      }
      console.warn(
        `Received unexpected response for event ${event}:`,
        response,
      );
    });
  };

  const addEventListener = useCallback(
    (event: string, listener: (event: Map<string, unknown>) => void) => {
      ws.current?.on(event, (data: any) => {
        listener(data);
      });
    },
    [],
  );

  const removeEventListener = useCallback(
    (event: string, listener: (event: Map<string, unknown>) => void) => {
      ws.current?.off(event, (data: any) => {
        listener(data);
      });
    },
    [],
  );

  return (
    <WSContext.Provider
      value={{
        emit,
        connected,
        addEventListener,
        removeEventListener,
        userId: userId.current,
      }}
    >
      {children}
    </WSContext.Provider>
  );
}

export function useWS() {
  const ctx = useContext(WSContext);
  if (!ctx) throw new Error("useWS must be inside provider");
  return ctx;
}
