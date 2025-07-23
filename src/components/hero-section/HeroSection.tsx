import React from 'react';

export interface HeroSectionProps {
  title: string;
  subtitle?: string;
  buttonText: string;
  buttonUrl?: string;
  backgroundImage?: string;
  overlayOpacity?: number;
  textAlignment?: 'left' | 'center' | 'right';
  showVideo?: boolean;
  videoUrl?: string;
  backgroundColor?: 'primary' | 'secondary' | 'accent';
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title = 'Welcome to Our Store',
  subtitle = 'Discover amazing products',
  buttonText = 'Shop Now',
  buttonUrl = '#',
  backgroundImage,
  overlayOpacity = 0.5,
  textAlignment = 'center',
  showVideo = false,
  videoUrl,
  backgroundColor = 'primary'
}) => {
  return (
    <div 
      className={`
        relative min-h-screen flex items-center justify-center
        ${backgroundColor === 'primary' ? 'bg-gradient-to-r from-blue-600 to-purple-600' :
          backgroundColor === 'secondary' ? 'bg-gradient-to-r from-green-600 to-teal-600' :
          'bg-gradient-to-r from-pink-600 to-red-600'}
        text-white overflow-hidden
      `}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Overlay */}
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Video Background */}
      {showVideo && videoUrl && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}

      {/* Content */}
      <div className={`relative z-10 max-w-4xl mx-auto px-6 text-${textAlignment}`}>
        <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
          {title}
        </h1>
        
        {subtitle && (
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl">
            {subtitle}
          </p>
        )}
        
        <a
          href={buttonUrl}
          className="
            inline-block px-8 py-4 bg-white text-gray-900 
            font-bold text-lg rounded-lg hover:bg-gray-100 
            transition-all duration-300 transform hover:scale-105
            shadow-lg hover:shadow-xl
          "
        >
          {buttonText} →
        </a>
      </div>
    </div>
  );
}; 