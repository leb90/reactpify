import React, { useState } from 'react';
import { ProductGalleryProps } from '../../utils/interfaces/product';

/**
 * ProductGallery - React component for product image gallery
 */
export const ProductGallery: React.FC<ProductGalleryProps> = ({
  product,
  settings,
  showThumbnails = true,
  enableZoom = true,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!product || !product.images || product.images.length === 0) {
    return (
      <div className="product-gallery product-gallery--empty">
        <div className="product-gallery__placeholder">
          <p>No images available</p>
        </div>
      </div>
    );
  }

  const currentImage = product.images[selectedImageIndex];

  const handleImageClick = () => {
    if (enableZoom) {
      setIsZoomed(!isZoomed);
    }
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsZoomed(false);
  };

  const handlePreviousImage = () => {
    const newIndex = selectedImageIndex > 0 
      ? selectedImageIndex - 1 
      : product.images.length - 1;
    setSelectedImageIndex(newIndex);
  };

  const handleNextImage = () => {
    const newIndex = selectedImageIndex < product.images.length - 1 
      ? selectedImageIndex + 1 
      : 0;
    setSelectedImageIndex(newIndex);
  };

  return (
    <div className={`product-gallery ${isZoomed ? 'product-gallery--zoomed' : ''}`}>
      {/* Imagen principal */}
      <div className="product-gallery__main">
        <div className="product-gallery__main-image">
          <img
            src={currentImage.src}
            alt={currentImage.alt || product.title}
            onClick={handleImageClick}
            className={enableZoom ? 'product-gallery__image--zoomable' : ''}
          />
          
          {/* Controles de navegación */}
          {product.images.length > 1 && (
            <>
              <button
                className="product-gallery__nav product-gallery__nav--prev"
                onClick={handlePreviousImage}
                aria-label="Previous image"
              >
                ←
              </button>
              <button
                className="product-gallery__nav product-gallery__nav--next"
                onClick={handleNextImage}
                aria-label="Next image"
              >
                →
              </button>
            </>
          )}
        </div>

        {/* Position indicator */}
        {product.images.length > 1 && (
          <div className="product-gallery__counter">
            {selectedImageIndex + 1} / {product.images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {showThumbnails && product.images.length > 1 && (
        <div className="product-gallery__thumbnails">
          {product.images.map((image, index) => (
            <button
              key={image.id}
              className={`product-gallery__thumbnail ${
                index === selectedImageIndex ? 'product-gallery__thumbnail--active' : ''
              }`}
              onClick={() => handleThumbnailClick(index)}
            >
              <img
                src={image.src}
                alt={image.alt || `${product.title} vista ${index + 1}`}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Modal de zoom */}
      {isZoomed && (
        <div className="product-gallery__zoom-modal" onClick={() => setIsZoomed(false)}>
          <div className="product-gallery__zoom-content">
            <img
              src={currentImage.src}
              alt={currentImage.alt || product.title}
              className="product-gallery__zoom-image"
            />
            <button
              className="product-gallery__zoom-close"
              onClick={() => setIsZoomed(false)}
              aria-label="Close zoom"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 