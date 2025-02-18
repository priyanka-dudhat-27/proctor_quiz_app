import React from "react";
import { motion } from "framer-motion";

const CustomCard = ({ title, children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-300"
    >
      <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
        {title}
      </h2>
      {children}
    </motion.div>
  );
};

export default CustomCard;
