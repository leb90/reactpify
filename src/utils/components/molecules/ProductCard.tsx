import React from 'react';
import { Button } from '../atoms/Button';

interface ProductCardProps {
  title: string;
  price: string;
  compareAtPrice?: string;
  imageUrl: string;
  imageAlt?: string;
  productUrl?: string;
  onAddToCart?: () => void;
  onQuickView?: () => void;
  showQuickView?: boolean;
  addToCartText?: string;
  badge?: string;
  className?: string;
}

/**
 * ProductCard Molecule - Displays product information with actions
 * Example molecule component for Shopify products - feel free to modify or delete
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  title,
  price,
  compareAtPrice,
  imageUrl,
  imageAlt,
  productUrl,
  onAddToCart,
  onQuickView,
  showQuickView = true,
  addToCartText = 'Add to Cart',
  badge,
  className = ''
}) => {
  const hasDiscount = compareAtPrice && compareAtPrice !== price;

  return (
    <div className={`group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${className}`}>
      {/* Badge */}
      {badge && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded">
          {badge}
        </div>
      )}

      {/* Image */}
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={imageAlt || title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
          {productUrl ? (
            <a href={productUrl} className="hover:text-blue-600">
              {title}
            </a>
          ) : (
            title
          )}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">{price}</span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">{compareAtPrice}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={onAddToCart}
            variant="primary"
            size="small"
            className="flex-1"
          >
            {addToCartText}
          </Button>
          
          {showQuickView && onQuickView && (
            <Button
              onClick={onQuickView}
              variant="outline"
              size="small"
            >
              Quick View
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}; 