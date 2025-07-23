import React from 'react';
import { useAppSelector, useAppDispatch, toggleCart, removeFromCart } from '../../redux';

interface CartSummaryProps {
  showItems?: boolean;
  className?: string;
}

/**
 * CartSummary Component - Shows cart items and total using Redux 🛒✨
 * Example component using Redux state - feel free to modify or delete
 */
export const CartSummary: React.FC<CartSummaryProps> = ({
  showItems = true,
  className = ''
}) => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);
  const cartTotal = useAppSelector(state => state.cart.total);
  const isCartOpen = useAppSelector(state => state.cart.isOpen);
  
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleToggleCart = () => {
    dispatch(toggleCart());
  };

  const handleRemoveItem = (variantId: string) => {
    dispatch(removeFromCart(variantId));
  };

  return (
    <div className={`cart-summary ${className}`}>
      {/* Cart Toggle Button */}
      <button 
        onClick={handleToggleCart}
        className="flex items-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M20 13h-2m-5 0a1 1 0 100 2 1 1 0 000-2zm-6 0a1 1 0 100 2 1 1 0 000-2z" />
        </svg>
        Cart ({itemCount})
        <span className="font-bold">${cartTotal.toFixed(2)}</span>
      </button>

      {/* Cart Items (when open and showItems is true) */}
      {isCartOpen && showItems && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Shopping Cart</h3>
          
          {cartItems.length === 0 ? (
            <p className="text-gray-500">Your cart is empty</p>
          ) : (
            <>
              {cartItems.map((item) => (
                <div key={item.variantId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-3">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                    <button
                      onClick={() => handleRemoveItem(item.variantId)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      title="Remove item"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total:</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                
                <button className="w-full mt-3 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors">
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}; 