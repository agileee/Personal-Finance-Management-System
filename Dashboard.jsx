import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: '', balance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard',
          { credentials: 'include' }
        );
        const data = await response.json();

        if (response.ok) {
          setUser({ name: data.name, balance: data.balance });
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen pt-20 flex justify-center items-start">
        <p className="mt-10 text-gray-600 text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen pt-20">
      <Navbar />

      <div className="text-center">
        
        <h1 className="text-4xl font-bold text-gray-800 mb-3 mt-10">
          Welcome, {user.name}
        </h1>
        
        <p className="text-lg text-gray-600 mb-10">
          Manage your finances efficiently!
        </p>

        <div className="bg-white p-6 max-w-xl mx-auto rounded-xl shadow-xl border-l-4 border-r-4 border-indigo-600 hover:shadow-2xl transition">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Total Balance
          </h2>
          <p className="text-5xl font-extrabold text-indigo-600">
            ${user.balance.toFixed(2)}
          </p>

          <Link
            to="/deposit"
            className="mt-6 inline-block bg-green-500 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition shadow-lg"
          >
            Make a Deposit
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;