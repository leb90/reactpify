import React, { useState } from 'react';

interface NewsletterSignupProps {
  title: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  showPrivacyText?: boolean;
  enableDoubleOptin?: boolean;
  backgroundColor?: string;
  apiEndpoint?: string;
}

/**
 * NewsletterSignup - Newsletter subscription form
 */
export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
  title,
  subtitle = "Join our newsletter to get updates",
  placeholder = "Enter your email",
  buttonText = "Subscribe",
  showPrivacyText = true,
  enableDoubleOptin = false,
  backgroundColor = "#f8f9fa",
  apiEndpoint = "/newsletter/subscribe"
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          doubleOptin: enableDoubleOptin 
        })
      });

      if (response.ok) {
        setIsSubscribed(true);
        setEmail('');
      } else {
        setError('Subscription error. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="newsletter-success" style={{ backgroundColor }}>
        <h3>Thanks for subscribing!</h3>
        <p>We'll send you updates about our products.</p>
      </div>
    );
  }

  return (
    <div className="newsletter-signup" style={{ backgroundColor }}>
      <div className="newsletter-header">
        <h2>{title}</h2>
        {subtitle && <p className="newsletter-subtitle">{subtitle}</p>}
      </div>

      <form onSubmit={handleSubmit} className="newsletter-form">
        <div className="newsletter-input-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            required
            disabled={isLoading}
            className="newsletter-input"
          />
          <button 
            type="submit" 
            disabled={isLoading || !email}
            className="newsletter-button"
          >
            {isLoading ? 'Sending...' : buttonText}
          </button>
        </div>

        {error && (
          <div className="newsletter-error">
            {error}
          </div>
        )}

        {showPrivacyText && (
          <p className="newsletter-privacy">
            By subscribing, you agree to receive marketing emails. 
            You can unsubscribe at any time.
          </p>
        )}
      </form>
    </div>
  );
}; 