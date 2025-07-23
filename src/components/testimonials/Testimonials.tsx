import React from 'react';

export interface TestimonialsProps {
  title: string;
  subtitle?: string;
  testimonials?: Array<{
    name: string;
    role: string;
    company: string;
    content: string;
    rating: number;
    avatar?: string;
  }>;
  showRatings?: boolean;
  backgroundColor?: 'primary' | 'secondary' | 'white';
}

// Control test: Auto-regeneration should still work for non-manual files 🎯✅
export const Testimonials: React.FC<TestimonialsProps> = ({
  title = 'What Our Customers Say 💬✨',
  subtitle = 'Real testimonials from real customers',
  testimonials = [],
  showRatings = true,
  backgroundColor = 'white'
}) => {
  return (
    <div className={`
      py-16 px-4
      ${backgroundColor === 'primary' ? 'bg-blue-50' :
        backgroundColor === 'secondary' ? 'bg-gray-50' : 'bg-white'}
    `}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {showRatings && (
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span 
                      key={i}
                      className={`text-2xl ${
                        i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              )}

              <blockquote className="text-gray-700 mb-6 italic">
                "{testimonial.content}"
              </blockquote>

              <div className="flex items-center">
                {testimonial.avatar && (
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                )}
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {testimonials.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-gray-500 text-lg">
              No testimonials yet. Add some in the admin!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 