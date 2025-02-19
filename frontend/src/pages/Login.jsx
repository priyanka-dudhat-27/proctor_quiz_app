import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { authService } from "../services/apiServices"; 
import CustomButton from "../components/CustomButton"; 
import CustomInput from "../components/CustomInput"; 
import CustomCard from "../components/CustomCard"; 

const Login = () => {
  const { loginUser } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    navigate("/");

    try {
      const userData = await authService.login({ email, password });

      loginUser(userData.user);

      toast.success("🎉 Login Successful!", {
        duration: 3000,
        position: "top-right",
        style: { background: "#4CAF50", color: "#fff" },
      });

      setEmail("");
      setPassword("");
    } catch (error) {
      toast.error(error.message || "Invalid credentials!", {
        duration: 3000,
        position: "top-right",
        style: { background: "#FF3B30", color: "#fff" },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 relative">
      {/* Background Exam GIF */}
      <motion.img
        src="https://globaleducation.s3.ap-south-1.amazonaws.com/globaledu/gif/online-exam.gif"
        alt="Exam Animation"
        className="absolute top-5 right-5 w-40 h-40 opacity-80 md:w-60 md:h-60"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      <CustomCard>
        <motion.h2
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-3xl font-semibold text-center text-gray-800 mb-6"
        >
          Login
        </motion.h2>

        <CustomInput
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <CustomInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <CustomButton
          text="Login"
          onClick={handleLogin}
          isLoading={loading}
          bgColor="bg-blue-500"
          hoverColor="hover:bg-blue-600"
        />

        <p className="text-center text-gray-600 mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Register here
          </Link>
        </p>
      </CustomCard>
    </div>
  );
};

export default Login;
