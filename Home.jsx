import { Link ,  useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => { 
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/session_status');
        if (response.ok) {
            navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error checking session status:", error);
      }     
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="bg-gray-100 flex items-center justify-center h-screen">
      <div className="container bg-white p-10 rounded-xl shadow-2xl w-full max-w-sm text-center">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6">
          WELCOME TO FINANCE MANAGER
        </h2>
        <div className="flex flex-col gap-4">
          <Link
            to="/register"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md block"
          >
            Register
          </Link>
          <Link
            to="/login"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md block"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;