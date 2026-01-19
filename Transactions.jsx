import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const Transactions = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    accountNumber: '',
    amount: '',
    pin: ''
  });
  
  const [transactions, setTransactions] = useState([]);
  const [userAccount, setUserAccount] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [localErrorMessage, setLocalErrorMessage] = useState({ text: '', type: '' }); 

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setUserAccount(data.my_account);
      } else if (response.status === 401) {
        navigate('/login'); 
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = "Recipient Account Number is required.";
    } else if (!/^\d{10}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = "Account Number must be exactly 10 digits.";
    }

    const amt = parseFloat(formData.amount);
    if (!formData.amount) {
      newErrors.amount = "Transfer Amount is required.";
    } else if (isNaN(amt) || amt <= 0) {
      newErrors.amount = "Amount must be a positive number greater than zero.";
    }

    if (!formData.pin.trim()) {
      newErrors.pin = "Transaction PIN is required.";
    } else if (!/^\d{4}$/.test(formData.pin)) {
      newErrors.pin = "Transaction PIN must be exactly 4 digits.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
    setLocalErrorMessage({ text: '', type: '' }); 
  };

  const handleRecepient = async () => {
    setMessage(''); 
    setLocalErrorMessage({ text: '', type: '' });
    if (!/^\d{10}$/.test(formData.accountNumber)) {
      return setLocalErrorMessage({ text: 'Please enter a valid 10-digit account number', type: 'error' });
    }
    try {
      const response = await fetch(`/api/recipient_name?account_number=${formData.accountNumber}`);
      if (response.ok) {
        const data = await response.json();
        if (data.name) {
            setMessage(`Recipient: ${data.name}`);
        } else {
           setMessage('Account number not found');
        }
      }else{
          setLocalErrorMessage({ text: 'Error fetching recipient name', type: 'error' });
      }
    } catch (error) { 
       setLocalErrorMessage({ text: 'Error fetching recipient name', type: 'error' });
    }   
  };

  
  // 2. HANDLE SUBMIT (SEND MONEY)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalErrorMessage({ text: '', type: '' });

    if (validate()) {
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient_account: formData.accountNumber,
            amount: formData.amount,
            transaction_pin: formData.pin
          }),
        });

        if (response.ok) {
          // Success message is now handled by FlashMessage component
          setFormData({ accountNumber: '', amount: '', pin: '' }); // Clear form
          fetchTransactions(); // Refresh history immediately

        } else {
          // Handle backend validation/error messages locally
          const result = await response.json();
          setLocalErrorMessage({ 
            text: result.message || 'Transfer failed', 
            type: 'error' 
          });
        }
      } catch (error) {
        console.error("Transfer error:", error);
        setLocalErrorMessage({ text: 'A network error occurred. Please try again.', type: 'error' });
      }
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen pt-20 pb-10">
      <Navbar />

      <div className="transaction-container bg-white p-6 sm:p-10 mt-8 max-w-5xl mx-auto rounded-xl shadow-2xl text-center">
        <h1 className="text-3xl font-bold text-indigo-600 mb-8">Send Money</h1>

        {localErrorMessage.text && (
          <div className={`p-4 mb-6 rounded-lg bg-red-100 text-red-700`}>
            {localErrorMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="transaction-form space-y-4 mb-10">
          <div>
            <input 
              type="text" 
              name="accountNumber"
              placeholder="Enter Recipient's Account Number" 
              autoComplete="off"
              value={formData.accountNumber}
              onChange={handleChange}
              onBlur={handleRecepient}
              className={`w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.accountNumber ? 'border-red-500' : 'border-gray-300'}`}
            />
            {message && <p className="text-green-500 text-sm mt-1">{message}</p>}
            {errors.accountNumber && <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>}
          </div>

          <div>
            <input 
              type="number" 
              name="amount"
              placeholder="Enter Amount" 
              step="0.01"
              autoComplete="off"
              value={formData.amount}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
          </div>

          <div>
            <input 
              type="password" 
              name="pin"
              placeholder="Enter Your 4-Digit Transaction PIN"
              value={formData.pin}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.pin ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.pin && <p className="text-red-500 text-sm mt-1">{errors.pin}</p>}
          </div>

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition duration-300 shadow-lg">
            Send Money
          </button>
        </form>

        <div className="transaction-history">
          <h2 className="text-2xl font-bold text-gray-700 mb-6">Transaction History</h2>
          
          {transactions.length > 0 ? (
            <div className="overflow-x-auto rounded-lg shadow-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-indigo-600 text-white">
                  <tr>
                    <th className="py-3 px-4 text-center text-sm font-semibold tracking-wider">ID</th>
                    <th className="py-3 px-4 text-center text-sm font-semibold tracking-wider">Details</th>
                    <th className="py-3 px-4 text-center text-sm font-semibold tracking-wider">Type</th>
                    <th className="py-3 px-4 text-center text-sm font-semibold tracking-wider">Amount</th>
                    <th className="py-3 px-4 text-center text-sm font-semibold tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-indigo-50 transition duration-150">
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">{t.id}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">
                      
                        {t.type === 'deposit' ? (
                            'Deposit' 
                        ) : t.account_number === userAccount ? (
                            <span className="text-red-600">Sent to {t.recipient_account}</span>
                        ) : (
                            <span className="text-green-600">Received from {t.account_number}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm font-medium">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === 'deposit' || (t.type === 'transfer' && t.recipient_account === userAccount) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm font-bold">
                        ${t.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
                        {t.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic mt-4">No transactions found.</p>
          )}
        </div>

        <Link to="/dashboard" className="mt-6 inline-block bg-indigo-500 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-300 shadow-lg">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Transactions;