import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  attributes?: Record<string, string>;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

const CART_STORAGE_KEY = 'mystore-cart';

export const useCart = () => {
  const [cart, setCart] = useState<Cart>({
    items: [],
    total: 0,
    itemCount: 0,
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const calculateCart = (items: CartItem[]): Cart => {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    
    return {
      items,
      total,
      itemCount,
    };
  };

  const addToCart = (product: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.items.findIndex(
        item => item.id === product.id && 
        JSON.stringify(item.attributes) === JSON.stringify(product.attributes)
      );

      let newItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        newItems = prevCart.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        newItems = [...prevCart.items, { ...product, quantity }];
      }

      const newCart = calculateCart(newItems);
      
      toast.success(`${product.name} added to cart`, {
        description: `Quantity: ${quantity}`,
      });

      return newCart;
    });
  };

  const removeFromCart = (productId: string, attributes?: Record<string, string>) => {
    setCart(prevCart => {
      const newItems = prevCart.items.filter(
        item => !(item.id === productId && 
        JSON.stringify(item.attributes) === JSON.stringify(attributes))
      );
      
      return calculateCart(newItems);
    });
  };

  const updateQuantity = (productId: string, quantity: number, attributes?: Record<string, string>) => {
    if (quantity <= 0) {
      removeFromCart(productId, attributes);
      return;
    }

    setCart(prevCart => {
      const newItems = prevCart.items.map(item =>
        item.id === productId && 
        JSON.stringify(item.attributes) === JSON.stringify(attributes)
          ? { ...item, quantity }
          : item
      );
      
      return calculateCart(newItems);
    });
  };

  const clearCart = () => {
    setCart({
      items: [],
      total: 0,
      itemCount: 0,
    });
    toast.success('Cart cleared');
  };

  const getCartItem = (productId: string, attributes?: Record<string, string>) => {
    return cart.items.find(
      item => item.id === productId && 
      JSON.stringify(item.attributes) === JSON.stringify(attributes)
    );
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItem,
  };
};