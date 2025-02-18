import React from "react";
import { motion } from "framer-motion";

const CustomInput = ({ type, placeholder, value, onChange }) => {
  return (
    <motion.input
      whileFocus={{ scale: 1.05 }}
      type={type}
      placeholder={placeholder}
      className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      value={value}
      onChange={onChange}
    />
  );
};

export default CustomInput;
