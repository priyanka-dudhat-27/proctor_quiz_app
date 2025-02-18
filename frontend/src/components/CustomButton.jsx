import React from "react";
import { motion } from "framer-motion";

const CustomButton = ({ 
  text, 
  onClick, 
  isLoading = false, 
  icon = null, 
  bgColor = "bg-blue-600", 
  hoverColor = "hover:bg-blue-700", 
  textColor = "text-white", 
  width = "w-full",
  rounded = "rounded-lg",
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={isLoading}
      onClick={onClick}
      className={`${bgColor} ${hoverColor} ${textColor} ${width} ${rounded} font-bold py-3 flex items-center justify-center transition-all duration-300`}
    >
      {isLoading ? (
        <>
          <img
            src="https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif"
            alt="Loading"
            className="h-6 w-6 mr-2"
          />
          Processing...
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {text}
        </>
      )}
    </motion.button>
  );
};

export default CustomButton;
