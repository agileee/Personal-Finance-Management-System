import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';

const Balance = () => {
  const [data, setData] = useState({
    balance: 0,
    total_deposit: 0,
    total_withdrawal: 0,
    spent_percent: 0,
    saved_percent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalanceData = async () => {
      try {
        const response = await fetch('/api/balance');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          console.error("Failed to fetch balance data");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBalanceData();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen pt-20 flex justify-center items-start">
        <p className="mt-10 text-gray-600 text-xl">Loading balance details...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen pt-20 pb-10">
      <Navbar />

      <div className="balance-container bg-white p-4 sm:p-6 mt-6 max-w-xl mx-auto rounded-xl shadow-xl text-center">
        <h1 className="text-4xl font-bold text-indigo-600 mb-6">Your Current Balance</h1>

        <div className="p-6 bg-indigo-50 border-l-4 border-r-4 border-indigo-600 rounded-lg shadow-inner mb-8">
          <p className="text-xl font-semibold text-gray-700">Available Funds</p>
          <div className="text-6xl font-extrabold text-indigo-800 mt-2">
            ${data.balance.toFixed(2)}
          </div>
        </div>

        <div className="summary-box grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-green-50 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-green-700 mb-2">Total Deposits</h2>
            <p className="text-2xl font-bold text-green-900">
              ${data.total_deposit.toFixed(2)}
            </p>
          </div>

          <div className="bg-red-50 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-red-700 mb-2">Total Withdrawals</h2>
            <p className="text-2xl font-bold text-red-900">
              ${data.total_withdrawal.toFixed(2)}
            </p>
          </div>
        </div>
       
        <div className="summary-box grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="p-4 bg-yellow-50 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-yellow-700">Money Spent</h2>
            <p className="text-2xl font-bold text-yellow-800">
              {data.spent_percent ? data.spent_percent.toFixed(2) : "0.00"}%
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-blue-700">Money Saved</h2>
            <p className="text-2xl font-bold text-blue-800">
              {data.saved_percent ? data.saved_percent.toFixed(2) : "0.00"}%
            </p>
          </div>
        </div>

        <div className="quick-actions flex flex-wrap justify-center gap-4 mb-6">
          <Link to="/dashboard" className="bg-gray-700 hover:bg-gray-800 text-white py-3 px-6 rounded-lg font-semibold transition duration-300">
            Dashboard
          </Link>
          <Link to="/deposit" className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition duration-300">
            Deposit
          </Link>
          <Link to="/transactions" className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-semibold transition duration-300">
            Transfer
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Balance;