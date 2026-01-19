import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; 

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault(); 
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        navigate('/login'); 
      } else {
        console.error("Logout failed");
      } 
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-indigo-600 p-4 shadow-lg fixed w-full top-0 z-50 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-full border-2 border-white" />
        <span className="text-white text-xl font-semibold">Finance Manager</span>
      </div>

      <ul className="flex space-x-4 sm:space-x-6 text-sm sm:text-base">
        <li><Link to="/dashboard" className="text-white hover:text-indigo-200">Home</Link></li>
        <li><Link to="/deposit" className="text-white hover:text-indigo-200">Deposit</Link></li>
        <li><Link to="/transactions" className="text-white hover:text-indigo-200">Transactions</Link></li>
        <li><Link to="/balance" className="text-white hover:text-indigo-200">Balance</Link></li>
        <li><Link to="/profile" className="text-white hover:text-indigo-200">Profile</Link></li>
    
        <li>
            <button 
                onClick={handleLogout} 
                className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md transition duration-300"
            >
                Logout
            </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;