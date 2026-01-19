import { useState , useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
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
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address format." }));
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    if (formData.password.length === 0) {
      setErrors((prev) => ({ ...prev, password: "Password cannot be empty." }));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const isEmailValid = validateEmail();
    const isPassValid = validatePassword();

    if (isEmailValid && isPassValid) {
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
          credentials: 'include',
        });

        // We do not need to parse data for the message, only for status
        // const data = await response.json(); 

        if (response.ok) {
          // Success: Backend flashed success message. Redirect immediately.
          navigate('/dashboard');
        } else { 
          // Failure: Backend flashed error message. We rely on the global component.
          // Optional: Scroll to first error on server fail if fields are empty
          const firstInput = document.querySelector('input[aria-invalid="true"]');
          if (firstInput) firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (err) {
        // We cannot use showFlash anymore.
        console.error("Server connection error:", err);
      }
    } else {
      // Local validation failed.
      const firstInput = document.querySelector('input[aria-invalid="true"]');
      if (firstInput) firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // REMOVED: showFlash helper
  // REMOVED: getAlertClass helper

  return (
    <div className="bg-gray-100 flex items-center justify-center h-screen">
      
      {/* REMOVED: Flash Message JSX */}

      <div className="container bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
        <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-6">PERSONAL FINANCE MANAGER</h2>
        <h1 className="text-2xl font-semibold text-gray-700 mb-6 text-center">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          
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
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition duration-300 mt-4 cursor-pointer"
          >
            Login
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-500 hover:text-indigo-900 font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;