import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const Deposit = () => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const MAX_DEPOSIT = 100000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // REMOVED: setSuccessMsg('');

    const val = parseFloat(amount);

    // --- Validation ---
    if (isNaN(val) || val <= 0) {
      setError("Invalid deposit amount. Must be greater than $0.00.");
      return;
    }

    if (val > MAX_DEPOSIT) {
      setError(`Deposit amount cannot exceed $${MAX_DEPOSIT.toLocaleString()}.`);
      return;
    }

    // --- API Call ---
    try {
      // NOTE: Removed 'http://127.0.0.1:5000' from fetch URL for cleaner relative path
      const response = await fetch('/api/deposit', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify({ amount: val }),
      });

      // We do not parse JSON for the message, only to check success/failure status
      // We assume the message is flashed on the backend and picked up globally.
      const data = await response.json(); 

      if (response.ok) {
        // SUCCESS: Backend flashed success message. Navigate immediately.
        setAmount('');
        navigate('/dashboard'); 
      } else {
        // ERROR: Backend flashes error message, but some specific API errors 
        // might still return a local message if validation fails before flash()
        if (response.status === 401) {
            navigate('/login'); 
        } else {
            // Keep local error handling for immediate feedback on specific API failure
            setError(data.message || 'Deposit failed');
        }
      }

    } catch (err) {
      console.error("Network error:", err);
      setError("Failed to connect to the server. Please try again.");
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen pt-20">
      <Navbar />

      <div className="deposit-container bg-white p-8 mt-12 sm:mt-24 max-w-xl mx-auto rounded-xl shadow-2xl text-center">
        <h1 className="text-3xl font-bold text-indigo-600 mb-6">Make a Deposit</h1>

        {/* REMOVED: Display Success Message JSX */}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input 
              type="number" 
              placeholder="Enter Amount" 
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if(error) setError('');
              }}
              className={`w-full p-3 border rounded-lg text-center text-lg focus:ring-indigo-500 focus:border-indigo-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
            />
            {error && <p id="depositError" className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition duration-300 shadow-md">
            Deposit Fund
          </button>
        </form>

        <Link to="/dashboard" className="mt-6 inline-block bg-indigo-500 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-300 shadow-lg">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Deposit;