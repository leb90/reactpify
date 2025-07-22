import React from 'react';

interface WelcomeBannerProps {
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
}

/**
 * Welcome Banner - Your first Reactpify component!
 * This component will auto-generate its Liquid template
 */
export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  title = 'Welcome to Reactpify! 🚀',
  subtitle = 'Your React components are now working in Shopify!',
  backgroundColor = 'blue'
}) => {
  return (
    <div className={`welcome-banner bg-${backgroundColor}-600 text-white p-8 text-center`}>
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <p className="text-xl opacity-90">{subtitle}</p>
      <div className="mt-6">
        <button 
          className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          onClick={() => alert('React is working! 🎉')}
        >
          Test React Interaction
        </button>
      </div>
    </div>
  );
};