import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {authService} from "../services/apiServices";
import CustomButton from "../components/CustomButton"; 
import CustomInput from "../components/CustomInput"; 
import CustomCard from "../components/CustomCard"; 

const Register = () => {
  const { loginUser } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData = await authService.register({ name, email, password, role });
      loginUser(userData.user);

      toast.success("🎉 Registration Successful!", {
        duration: 3000,
        position: "top-right",
        style: { background: "#4CAF50", color: "#fff" },
      });

      setName("");
      setEmail("");
      setPassword("");
      setRole("student");
      navigate("/"); // Redirect to home after registration
    } catch (error) {
      toast.error(error.message || "Registration failed!", {
        duration: 3000,
        position: "top-right",
        style: { background: "#FF3B30", color: "#fff" },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <CustomCard title="Register">
        <CustomInput type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
        <CustomInput type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <CustomInput type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

        {/* Role Selection Dropdown */}
        <select
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>

        {/* Reusable Register Button */}
        <CustomButton
          text="Register"
          onClick={handleRegister}
          isLoading={loading}
          bgColor="bg-blue-500"
          hoverColor="hover:bg-blue-600"
        />

        <p className="text-center text-gray-600 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Login here
          </Link>
        </p>
      </CustomCard>
    </div>
  );
};

export default Register;
