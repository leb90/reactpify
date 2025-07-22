import React, { useState } from 'react';

interface ProductQuickViewProps {
  productId: string;
  showPrice?: boolean;
  showAddToCart?: boolean;
  title?: string;
}

/**
 * ProductQuickView - Modal for quick product view
 */
export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  productId,
  showPrice = true,
  showAddToCart = true,
  title = "Quick View"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button 
        className="quick-view-trigger"
        onClick={handleOpen}
      >
        {title}
      </button>

      {isOpen && (
        <div className="quick-view-modal" onClick={handleClose}>
          <div className="quick-view-content" onClick={e => e.stopPropagation()}>
            
            <button 
              className="quick-view-close"
              onClick={handleClose}
            >
              ✕
            </button>

            {isLoading ? (
              <div className="quick-view-loading">
                <p>Loading product...</p>
              </div>
            ) : (
              <div className="quick-view-body">
                <h2>Product Quick View</h2>
                <p>Product ID: {productId}</p>
                
                {showPrice && (
                  <div className="quick-view-price">
                    <span className="price">$99.99</span>
                  </div>
                )}

                {showAddToCart && (
                  <button className="add-to-cart-btn">
                    Add to Cart
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}; 