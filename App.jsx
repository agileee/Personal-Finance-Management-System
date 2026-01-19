import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FlashMessage from './FlashMessage';

import Home from './Home';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import Deposit from './Deposit';
import Transactions from './Transactions';
import Balance from './Balance';
import Profile from './Profile';

function App() {
  return (
    <Router>
      <FlashMessage /> 
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/balance" element={<Balance />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;