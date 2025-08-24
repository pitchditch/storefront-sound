import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Mock data - replace with real data from Supabase
const featuredProducts = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    price: 79.99,
    originalPrice: 129.99,
    image: '/placeholder.svg',
    rating: 4.8,
    reviews: 247,
  },
  {
    id: '2',
    name: 'Smart Fitness Tracker',
    price: 49.99,
    originalPrice: 89.99,
    image: '/placeholder.svg',
    rating: 4.6,
    reviews: 189,
  },
  {
    id: '3',
    name: 'Eco-Friendly Water Bottle',
    price: 24.99,
    image: '/placeholder.svg',
    rating: 4.9,
    reviews: 156,
  },
  {
    id: '4',
    name: 'Premium Coffee Maker',
    price: 159.99,
    originalPrice: 219.99,
    image: '/placeholder.svg',
    rating: 4.7,
    reviews: 89,
  },
];

const categories = [
  { name: 'Electronics', href: '/categories/electronics', image: '/placeholder.svg' },
  { name: 'Clothing', href: '/categories/clothing', image: '/placeholder.svg' },
  { name: 'Home & Garden', href: '/categories/home-garden', image: '/placeholder.svg' },
  { name: 'Sports & Outdoors', href: '/categories/sports-outdoors', image: '/placeholder.svg' },
  { name: 'Beauty & Health', href: '/categories/beauty-health', image: '/placeholder.svg' },
];

const features = [
  {
    icon: ShieldCheck,
    title: 'Secure Checkout',
    description: 'Your payment information is protected with bank-level security.',
  },
  {
    icon: Truck,
    title: 'Fast Shipping',
    description: 'Free shipping on orders over $50. Express delivery available.',
  },
  {
    icon: Clock,
    title: '24/7 Support',
    description: 'Our customer service team is here to help you around the clock.',
  },
];

export const Home = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-hero py-16 lg:py-24">
        <div className="container text-center">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            Discover Amazing Products
            <br />
            <span className="text-primary">Delivered Fast</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Shop from thousands of quality products with worldwide shipping. 
            Find everything you need in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="btn-cart" asChild>
              <Link to="/shop">
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/categories">Browse Categories</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
          <p className="text-muted-foreground">
            Explore our wide range of product categories
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={category.href}
              className="group text-center"
            >
              <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="font-medium group-hover:text-primary transition-colors">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
          <p className="text-muted-foreground">
            Hand-picked favorites from our collection
          </p>
        </div>
        <div className="product-grid">
          {featuredProducts.map((product) => (
            <Card key={product.id} className="group overflow-hidden hover:shadow-product transition-shadow">
              <div className="aspect-square bg-muted overflow-hidden relative">
                {product.originalPrice && (
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
              <CardContent className="p-4">
                <h3 className="font-medium mb-2 line-clamp-2">{product.name}</h3>
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
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
                <Button className="w-full btn-cart" asChild>
                  <Link to={`/products/${product.id}`}>View Product</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button variant="outline" size="lg" asChild>
            <Link to="/shop">View All Products</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose MyStore?</h2>
            <p className="text-muted-foreground">
              We're committed to providing the best shopping experience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="container">
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Stay Updated with Exclusive Deals</h2>
            <p className="mb-6 opacity-90">
              Subscribe to our newsletter and be the first to know about new arrivals and special offers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg text-foreground"
              />
              <Button variant="secondary" className="whitespace-nowrap">
                Subscribe Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};