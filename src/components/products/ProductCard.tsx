import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
}

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

export const ProductCard = ({ product, viewMode = 'grid' }: ProductCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.inStock) {
      toast.error('Product is out of stock');
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-muted-foreground'
        }`}
      />
    ));
  };

  if (viewMode === 'list') {
    return (
      <Card className="group hover:shadow-product transition-shadow">
        <Link to={`/products/${product.id}`}>
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-48 aspect-square bg-muted overflow-hidden relative">
              {!product.inStock && (
                <Badge className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground">
                  Out of Stock
                </Badge>
              )}
              {product.originalPrice && product.inStock && (
                <Badge className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground">
                  Sale
                </Badge>
              )}
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover product-image"
              />
            </div>
            <CardContent className="flex-1 p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between h-full">
                <div className="flex-1">
                  <Badge variant="outline" className="mb-2">
                    {product.category}
                  </Badge>
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {renderStars(product.rating)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {product.rating.toFixed(1)} ({product.reviews} reviews)
                    </span>
                  </div>
                </div>
                <div className="flex flex-col justify-between items-end">
                  <div className="text-right mb-4">
                    <div className="flex items-center gap-2">
                      <span className="price text-xl">${product.price}</span>
                      {product.originalPrice && (
                        <span className="original-price">${product.originalPrice}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toast.success('Added to wishlist');
                      }}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleAddToCart}
                      disabled={!product.inStock}
                      className="btn-cart"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden hover:shadow-product transition-shadow">
      <Link to={`/products/${product.id}`}>
        <div className="aspect-square bg-muted overflow-hidden relative">
          {!product.inStock && (
            <Badge className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground">
              Out of Stock
            </Badge>
          )}
          {product.originalPrice && product.inStock && (
            <Badge className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground">
              Sale
            </Badge>
          )}
          <Button
            variant="outline"
            size="icon"
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toast.success('Added to wishlist');
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover product-image"
          />
        </div>
        <CardContent className="p-4">
          <Badge variant="outline" className="mb-2 text-xs">
            {product.category}
          </Badge>
          <h3 className="font-medium mb-2 line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {renderStars(product.rating)}
            </div>
            <span className="text-sm text-muted-foreground">
              ({product.reviews})
            </span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="price text-lg">${product.price}</span>
            {product.originalPrice && (
              <span className="original-price">${product.originalPrice}</span>
            )}
          </div>
          <Button
            className="w-full btn-cart"
            onClick={handleAddToCart}
            disabled={!product.inStock}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </CardContent>
      </Link>
    </Card>
  );
};