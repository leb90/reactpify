import React from 'react';

interface TestComponentProps {
  title?: string;
  subtitle?: string;
  layout?: 'card' | 'hero' | 'simple';
  theme?: 'blue' | 'purple' | 'green';
  showButton?: boolean;
}

export const TestComponent: React.FC<TestComponentProps> = ({
  title = 'Test Component - UPDATED! 🚀',
  subtitle = 'This is a generic test component to verify the hybrid architecture system.',
  layout = 'card',
  theme = 'blue',
  showButton = true
}) => {
  const themeColors = {
    blue: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700',
    purple: 'bg-gradient-to-br from-purple-500 via-purple-600 to-pink-700', 
    green: 'bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700'
  };

  if (layout === 'hero') {
    return (
      <div className="w-full min-h-screen flex items-center justify-center py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`relative overflow-hidden rounded-3xl shadow-2xl ${themeColors[theme]} text-white p-12 md:p-20`}>
            {/* Background decorations */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10"></div>
            <div className="absolute top-20 left-20 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            
            {/* Content */}
            <div className="relative z-10">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-tight bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent drop-shadow-lg">
                {title}
              </h1>
              <p className="text-xl md:text-2xl lg:text-3xl opacity-95 max-w-3xl mx-auto leading-relaxed mb-12 font-light">
                {subtitle}
              </p>
              {showButton && (
                <button className="inline-flex items-center gap-3 px-8 py-4 bg-white/20 hover:bg-white/30 border-2 border-white/30 rounded-full text-lg font-semibold transition-all duration-300 backdrop-blur-sm">
                  <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                  Get Started Now! 
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'simple') {
    return (
      <div className="max-w-2xl mx-auto text-center p-8">
        <h2 className="text-3xl font-bold mb-4 text-gray-900">
          {title}
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          {subtitle}
        </p>
        {showButton && (
          <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Action Button
          </button>
        )}
      </div>
    );
  }

  // Default card layout
  return (
    <div className={`max-w-md mx-auto p-8 ${themeColors[theme]} rounded-2xl shadow-xl text-white text-center`}>
      <h2 className="text-4xl font-bold mb-4">
        {title}
      </h2>
      <p className="text-lg opacity-90 mb-6">
        {subtitle}
      </p>
      {showButton && (
        <button className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all">
          Learn More
        </button>
      )}
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm mt-4">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        🚀 React component loaded!
      </div>
    </div>
  );
}; 