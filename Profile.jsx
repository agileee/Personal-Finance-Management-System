import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState('/default-profile.png');
  const fileInputRef = useRef(null);


  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          if (data.user.profile_pic_url) {
            setProfileImage(data.user.profile_pic_url);
          } 
        } else {
          navigate('/login');
        }
      } catch (error) {
          console.error("Error fetching profile:", error);
      } finally {
          setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result); 
      };
      reader.readAsDataURL(file);
      uploadProfileImage(file); 
    }
  };

  const uploadProfileImage = async (file) => {
    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
      const response = await fetch('/api/upload_profile_picture', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        alert("Profile picture updated successfully!");
      } else {
        const errorData = await response.json();
        console.error("Upload failed:", errorData.message);
        alert(`Upload Failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Network error during upload:", error);
      alert("An error occurred during image upload.");
    }
  };
  
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "WARNING: Are you absolutely sure you want to delete your account? This is permanent and irreversible."
    );

    if (confirmDelete) {
      try {
        const response = await fetch('/api/delete_account', {
          method: 'POST', 
        });
        if (response.ok) {
          navigate('/login'); 
        } else {
          alert("Failed to delete account. Check the notification area for details.");
        }
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("An error occurred while deleting the account.");
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen pt-20 flex justify-center items-start">
        <p className="mt-10 text-gray-600 text-xl">Loading profile...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-gray-100 min-h-screen pt-20 pb-10">
      <Navbar />
      <div className="profile-container text-center py-10 px-4">
        <div className="relative inline-block mx-auto mb-8"> 
            <img 
              src={profileImage} 
              alt="Profile" 
              className="h-36 w-36 rounded-full object-cover border-4 border-indigo-600 shadow-xl cursor-pointer"
              onClick={() => fileInputRef.current.click()} 
            />
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              className="hidden" 
              accept="image/*" // Restrict to image files
            />
            <div 
              className="absolute inset-0 h-36 w-36 rounded-full flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              onClick={() => fileInputRef.current.click()}
              title="Click to change profile picture"
            >
              <span className="text-white text-xl">📷</span>
            </div>
            
        </div>

        <div className="user-info bg-white p-8 max-w-xl mx-auto rounded-xl shadow-2xl text-left border-t-4 border-b-4 border-indigo-600">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-indigo-600 text-center">User Information</h2>
          </div>
          
          <div className="space-y-4 text-lg">
            <p className="flex justify-between border-b pb-2">
              <strong className="font-semibold text-gray-700">Name:</strong> 
              <span className="text-gray-900">{user.name}</span>
            </p>
            <p className="flex justify-between border-b pb-2">
              <strong className="font-semibold text-gray-700">Email:</strong> 
              <span className="text-gray-900">{user.email}</span>
            </p>
            <p className="flex justify-between border-b pb-2">
              <strong className="font-semibold text-gray-700">Account Number:</strong> 
              <span className="text-gray-900 font-mono">{user.account_number}</span>
            </p>
            <p className="flex justify-between pt-2">
              <strong className="font-semibold text-gray-700">Balance:</strong> 
              <span className="text-2xl font-bold text-green-600">
                ${user.balance ? user.balance.toFixed(2) : "0.00"}
              </span>
            </p>
          </div>
        </div>
        <div className="max-w-xl mx-auto mt-8 p-6 bg-red-50 rounded-xl shadow-lg border border-red-200">
          <h3 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h3>
          <p className="text-gray-700 mb-6">
            Permanently delete your account and all associated transaction history. This action cannot be undone.
          </p>
          
          <button 
            onClick={handleDeleteAccount}
            className="w-full py-3 px-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition duration-150 ease-in-out shadow-md"
          >
            🛑 Delete My Account Permanently
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;