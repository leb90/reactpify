import React from 'react';

export interface WelcomeBannerProps {
  title: string;
  subtitle?: string;
  backgroundColor?: 'primary' | 'secondary' | 'accent';
}

// Test watch mode detection - welcome banner live update  
export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  title = 'Welcome to Reactpify! 🚀✨💫🎯',
  subtitle = 'Your React components are now working in Shopify!',
  backgroundColor = 'primary'
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className={`
        relative overflow-hidden rounded-3xl shadow-2xl backdrop-blur-sm
        ${backgroundColor === 'primary' ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700' : 
          backgroundColor === 'secondary' ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700' :
          'bg-gradient-to-br from-purple-500 via-pink-600 to-rose-700'}
        text-white p-8 md:p-16 text-center border border-white/20
      `}>
        {/* Enhanced background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-8 left-8 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-8 right-8 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-white/15 rounded-full blur-2xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-1/3 left-1/4 w-20 h-20 bg-white/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="mb-8">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 animate-slide-up bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent drop-shadow-lg">
              {title}
            </h2>
            <p className="text-xl md:text-2xl lg:text-3xl opacity-95 max-w-4xl mx-auto leading-relaxed animate-slide-up font-light tracking-wide">
              {subtitle}
            </p>
          </div>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button 
              className="group relative overflow-hidden bg-white text-gray-800 hover:text-white font-bold py-4 px-8 rounded-2xl transform hover:scale-105 transition-all duration-500 shadow-2xl hover:shadow-white/25"
              onClick={() => alert('React is working perfectly! 🎉')}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></span>
              <span className="relative z-10 flex items-center justify-center">
                <span className="text-2xl mr-2">✨</span>
                Test React Interaction
              </span>
            </button>
            
            <button 
              className="group relative overflow-hidden border-2 border-white/80 text-white hover:text-gray-800 font-semibold py-4 px-8 rounded-2xl transform hover:scale-105 transition-all duration-500 backdrop-blur-sm"
              onClick={() => console.log('Reactpify is awesome!')}
            >
              <span className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></span>
              <span className="relative z-10 flex items-center justify-center">
                <span className="text-2xl mr-2">🚀</span>
                Learn More
              </span>
            </button>
          </div>
          
          {/* Enhanced features badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            {[
              { icon: "⚡", text: "Lightning Fast", color: "from-yellow-400 to-orange-500" },
              { icon: "🎨", text: "Beautiful Design", color: "from-pink-400 to-purple-500" },
              { icon: "🔧", text: "Easy Setup", color: "from-green-400 to-blue-500" },
              { icon: "💙", text: "Shopify Ready", color: "from-blue-400 to-indigo-500" }
            ].map((feature, index) => (
              <div
                key={feature.text}
                className={`group relative overflow-hidden px-6 py-3 bg-white/20 hover:bg-white/30 rounded-2xl text-sm font-semibold backdrop-blur-md border border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                <span className="relative z-10 flex items-center">
                  <span className="text-lg mr-2">{feature.icon}</span>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};