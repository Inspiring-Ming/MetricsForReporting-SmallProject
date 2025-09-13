import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorProvider from "./components/error/ErrorProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorProvider>
      <App />
    </ErrorProvider>
  </React.StrictMode>
);
