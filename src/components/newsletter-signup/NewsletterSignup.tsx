import React, { useState } from 'react';

export interface NewsletterSignupProps {
  title: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  backgroundColor?: 'primary' | 'secondary' | 'accent';
}

// Test NEW auto-detection logic - should PRESERVE manual changes! 
export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
  title = 'Stay in the Loop! 💌✨🚀🎯🛡️✨🔍',
  subtitle = 'Get exclusive updates, special offers, and insider tips delivered straight to your inbox.',
  placeholder = 'Enter your email address',
  buttonText = 'Subscribe Now',
  backgroundColor = 'primary'
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setEmail('');
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 p-8 md:p-12 max-w-md mx-auto text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-4 shadow-lg">
              <span className="text-4xl">✅</span>
            </div>
          </div>
          
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            Welcome Aboard! 🎉
          </h3>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Thanks for subscribing! Check your inbox for a special welcome gift.
          </p>
          
          <button 
            onClick={() => setIsSubmitted(false)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Subscribe Another Email
          </button>
        </div>
      </div>
    );
  }

  const gradientClasses = {
    primary: 'from-blue-600 via-purple-600 to-pink-600',
    secondary: 'from-emerald-500 via-teal-500 to-cyan-500', 
    accent: 'from-orange-500 via-pink-500 to-rose-500'
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      {/* Background gradient container */}
      <div className={`
        relative overflow-hidden rounded-3xl shadow-2xl backdrop-blur-sm border border-white/20
        bg-gradient-to-br ${gradientClasses[backgroundColor]}
        p-8 md:p-12 max-w-2xl mx-auto w-full
      `}>
        
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16 animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/5 rounded-full -translate-x-12 -translate-y-12 animate-pulse delay-300"></div>
        
        {/* Content container */}
        <div className="relative z-10">
          
          {/* Header section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6 shadow-lg">
              <span className="text-4xl">📬</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
              {title}
            </h2>
            
            {subtitle && (
              <p className="text-lg md:text-xl text-white/90 max-w-lg mx-auto leading-relaxed font-medium">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form section */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email input container */}
            <div className="relative">
              <div className="flex flex-col sm:flex-row gap-4">
                
                {/* Email input */}
                <div className="flex-1 relative group">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm group-focus-within:blur-none transition-all duration-300"></div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={placeholder}
                    className="relative w-full px-6 py-4 bg-white/90 backdrop-blur-sm border-2 border-white/30 rounded-2xl text-gray-800 placeholder-gray-500 focus:border-white focus:bg-white focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 text-lg font-medium shadow-lg"
                    required
                  />
                </div>
                
                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-white/90 hover:bg-white text-gray-800 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none backdrop-blur-sm border-2 border-white/30"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin"></div>
                      <span>Subscribing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{buttonText}</span>
                      <span className="text-xl">🚀</span>
                    </div>
                  )}
                </button>
              </div>
              
              {/* Error message */}
              {error && (
                <div className="mt-3 p-3 bg-red-500/90 backdrop-blur-sm text-white rounded-xl text-sm font-medium border border-red-400/30">
                  ⚠️ {error}
                </div>
              )}
            </div>

            {/* Features list */}
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="flex items-center gap-2 text-white/90 font-medium">
                <span className="text-lg">🎁</span>
                <span>Exclusive Offers</span>
              </div>
              <div className="flex items-center gap-2 text-white/90 font-medium">
                <span className="text-lg">⚡</span>
                <span>Early Access</span>
              </div>
              <div className="flex items-center gap-2 text-white/90 font-medium">
                <span className="text-lg">🔒</span>
                <span>No Spam</span>
              </div>
            </div>
            
            {/* Privacy notice */}
            <div className="text-center">
              <p className="text-sm text-white/80 leading-relaxed">
                🛡️ <strong>Privacy Protected</strong> - We respect your inbox and never share your data. 
                Unsubscribe anytime with one click.
              </p>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}; 