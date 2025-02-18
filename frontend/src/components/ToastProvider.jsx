import { Toaster } from "react-hot-toast";

const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: "10px",
          fontSize: "16px",
          padding: "12px",
        },
        success: {
          style: {
            background: "#4CAF50",
            color: "#fff",
          },
        },
        error: {
          style: {
            background: "#ff4d4d",
            color: "#fff",
          },
        },
      }}
    />
  );
};

export default ToastProvider;
