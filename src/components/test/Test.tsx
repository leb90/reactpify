import React, { useState } from 'react';

interface TestProps {
  title?: string;
  showButton?: boolean;
}

export const Test: React.FC<TestProps> = ({
  title = "Hello World",
  showButton = true
}) => {
  const [clicked, setClicked] = useState(false);

  return (
    <div className="reactpify-container max-w-md mx-auto p-6">
      <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        
        {showButton && (
          <button 
            onClick={() => setClicked(!clicked)}
            className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-gray-100 transition-colors font-semibold"
          >
            {clicked ? '✅ Clicked!' : '👋 Click me'}
          </button>
        )}
      </div>
    </div>
  );
}; 