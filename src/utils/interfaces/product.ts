// Shopify product interfaces

export interface ProductImage {
  id: number;
  src: string;
  alt: string | null;
  width: number;
  height: number;
  position: number;
}

export interface ProductVariant {
  id: number;
  title: string;
  price: number;
  compare_at_price: number | null;
  sku: string;
  available: boolean;
  inventory_quantity: number;
  weight: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  featured_image?: ProductImage;
}

export interface ProductOption {
  id: number;
  name: string;
  position: number;
  values: string[];
}

export interface Product {
  id: number;
  title: string;
  handle: string;
  description: string;
  vendor: string;
  type: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  tags: string[];
  price: number;
  price_min: number;
  price_max: number;
  price_varies: boolean;
  compare_at_price: number | null;
  compare_at_price_min: number | null;
  compare_at_price_max: number | null;
  compare_at_price_varies: boolean;
  available: boolean;
  featured_image: string | null;
  featured_media?: ProductImage;
  first_available_variant?: ProductVariant;
  images: ProductImage[];
  media: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  url: string;
  selected_variant?: ProductVariant;
  selected_or_first_available_variant?: ProductVariant;
}

// Component interfaces
export interface ProductComponentProps {
  product: Product;
  settings?: {
    [key: string]: any;
  };
}

export interface ProductCardProps extends ProductComponentProps {
  showVendor?: boolean;
  showPrice?: boolean;
  showComparePrice?: boolean;
  imageSize?: 'small' | 'medium' | 'large';
  layout?: 'vertical' | 'horizontal';
}

export interface ProductGalleryProps extends ProductComponentProps {
  showThumbnails?: boolean;
  enableZoom?: boolean;
  autoplay?: boolean;
  loop?: boolean;
}

export interface ProductQuickViewProps {
  productId: string;
  productHandle: string;
  product?: Product;
} 