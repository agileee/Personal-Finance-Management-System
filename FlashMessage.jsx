import React, { useState, useEffect } from 'react';

const FlashMessage = () => {
  const [messages, setMessages] = useState([]);

  const fetchFlashMessages = async () => {
    try {
      const response = await fetch('/api/flash');
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(prevMessages => [...prevMessages, ...data.messages]);
        }
      }
    } catch (error) {
      console.error("Error fetching flash messages:", error);
    }
  };

  // 🌟 FIX: UNCOMMENTED BLOCK FOR FETCHING AND POLLING
  useEffect(() => {
    fetchFlashMessages(); 
    const PULLING_INTERVAL = 3000; 
    const intervalId = setInterval(fetchFlashMessages, PULLING_INTERVAL);

    return () => clearInterval(intervalId); // Cleanup function to stop the interval
  }, []);

  // Block for auto-hiding the messages
  useEffect(() => {
    if (messages.length > 0) {
        const AUTO_HIDE_DURATION = 2000; 
        
        const timer = setTimeout(() => {
            // Remove the oldest message (first in the array)
            setMessages(prevMessages => prevMessages.slice(1));
        }, AUTO_HIDE_DURATION);
        
        return () => clearTimeout(timer); // Cleanup for the timer
    }
  }, [messages]);

  const getAlertClass = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-700 border-green-400';
      case 'danger': return 'bg-red-100 text-red-700 border-red-400';
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-400';
      case 'info': return 'bg-blue-100 text-blue-700 border-blue-400';
      default: return 'bg-gray-100 text-gray-700 border-gray-400';
    }
  };
  
  if (messages.length === 0) return null;

  return (
    <div className="fixed top-2.5 right-2.5 z-[1000] space-y-2 max-w-sm w-full">
      {messages.map((msg, index) => (
        <div 
          key={index} 
          className={`alert border p-3 rounded-lg shadow-lg transition-opacity duration-500 ease-in-out ${getAlertClass(msg.type)}`}
          // Click handler to manually dismiss the message
          onClick={() => setMessages(prev => prev.filter((_, i) => i !== index))}
        >
          {msg.message}
        </div>
      ))}
    </div>
  );
};

export default FlashMessage;