import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    account_number: '',
    transaction_pin: '',
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  // REMOVED: const [flash, setFlash] = useState(null);
 
  useEffect(() => { 
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/session_status',
          { credentials: 'include' }
        );
        if (response.ok) {
            navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error checking session status:", error);
      }     
    };
    checkAuth();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // ... (Validation functions remain the same) ...
  const validateName = () => {
    if (formData.name.trim().length < 3) {
      setErrors((prev) => ({ ...prev, name: "Name must be at least 3 characters." }));
      return false;
    }
    return true;
  };

  const validateAccount = () => {
    if (!/^\d{10}$/.test(formData.account_number.trim())) {
      setErrors((prev) => ({ ...prev, account_number: "Account Number must be exactly 10 digits." }));
      return false;
    }
    return true;
  };

  const validatePin = () => {
    if (!/^\d{4}$/.test(formData.transaction_pin.trim())) {
      setErrors((prev) => ({ ...prev, transaction_pin: "Transaction PIN must be exactly 4 digits." }));
      return false;
    }
    return true;
  };

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrors((prev) => ({ ...prev, email: "Enter a valid email address." }));
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setErrors((prev) => ({ ...prev, password: "Password must have 8+ chars with uppercase, lowercase, and a number." }));
      return false;
    }
    return true;
  };


  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors

    // Run all validations
    const isNameValid = validateName();
    const isAccountValid = validateAccount();
    const isPinValid = validatePin();
    const isEmailValid = validateEmail();
    const isPassValid = validatePassword();

    if (isNameValid && isAccountValid && isPinValid && isEmailValid && isPassValid) {
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
          credentials: 'include',
        });

        if (response.ok) {
          // Success: Backend flashed success message. Redirect.
          navigate('/dashboard'); 
        } else {
          // Failure: Backend flashed error message. We rely on the global component.
          // Optional: Scroll to first error on server fail if fields are empty
          const firstInput = document.querySelector('input[aria-invalid="true"]');
          if (firstInput) firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (err) {

        console.error("Server connection error:", err);
      }
    } else {

      const firstInput = document.querySelector('input[aria-invalid="true"]');
      if (firstInput) firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="bg-gray-100 flex items-center justify-center h-screen min-h-screen">
      
      <div className="container bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg m-4">
        <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-6">PERSONAL FINANCE MANAGER</h2>
        <h1 className="text-2xl font-semibold text-gray-700 mb-6 text-center">Register</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text" name="name" placeholder="Enter Name" autoComplete="off"
              value={formData.name} onChange={handleChange} onBlur={validateName}
              aria-invalid={!!errors.name}
              className={`w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <input
              type="text" name="account_number" placeholder="Enter 10-Digit Account Number" autoComplete="off"
              value={formData.account_number} onChange={handleChange} onBlur={validateAccount}
              aria-invalid={!!errors.account_number}
              className={`w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.account_number ? 'border-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.account_number && <p className="text-red-500 text-sm mt-1">{errors.account_number}</p>}
          </div>

          <div>
            <input
              type="password" name="transaction_pin" placeholder="Enter 4-Digit Transaction PIN"
              value={formData.transaction_pin} onChange={handleChange} onBlur={validatePin}
              aria-invalid={!!errors.transaction_pin}
              className={`w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.transaction_pin ? 'border-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.transaction_pin && <p className="text-red-500 text-sm mt-1">{errors.transaction_pin}</p>}
          </div>

          <div>
            <input
              type="email" name="email" placeholder="Email" autoComplete="off"
              value={formData.email} onChange={handleChange} onBlur={validateEmail}
              aria-invalid={!!errors.email}
              className={`w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <input
              type="password" name="password" placeholder="Password"
              value={formData.password} onChange={handleChange} onBlur={validatePassword}
              aria-invalid={!!errors.password}
              className={`w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
          
            <p className="text-xs text-gray-600 mt-1 mb-2 text-left">
            </p>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition duration-300 mt-4 cursor-pointer"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-500 hover:text-indigo-900 font-medium">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;