import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./pages/homePage";
import GamePage from "./pages/gamePage";
import { WebSocketProvider } from "./utils/wsProvider";
import AdminPage from "./pages/adminPage";

const router = createBrowserRouter([
  // ever route should have  <WebSocketProvider> , the only exception is the "connected-elsewhere" page
  {
    path: "/connected-elsewhere",
    element: (
      <div className="flex flex-col gap-2 items-center justify-center h-screen">
        <h1 className="text-2xl font-bold">You have been disconnected</h1>
        <p className="text-gray-500">
          Your account has been connected from another device.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-amber-300 px-5 shadow-xl rounded-2xl py-2"
        >
          Go to Home
        </button>
      </div>
    ),
  },
  {
    path: "/admin",
    element: <AdminPage />,
  },
  {
    path: "/",
    element: (
      <WebSocketProvider>
        <HomePage />
      </WebSocketProvider>
    ),
  },
  {
    path: "/game/:gameId",
    element: (
      <WebSocketProvider>
        <GamePage />
      </WebSocketProvider>
    ),
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      {/* <div className="w-140 bg-red-50 aspect-square">
        <Board />
      </div> */}
    </>
  );
}

export default App;
