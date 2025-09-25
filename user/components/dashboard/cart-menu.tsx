"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cartAPI, authAPI } from "@/lib/api";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function CartMenu() {
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCartCount = async () => {
    if (!authAPI.isAuthenticated()) return;
    
    setLoading(true);
    try {
      const cartData = await cartAPI.getCart();
      setCartCount(cartData.cart?.totalItems || 0);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartCount();

    // Refresh cart count every 30 seconds
    const interval = setInterval(fetchCartCount, 30000);

    // Listen for storage changes (when user adds to cart in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart-updated') {
        fetchCartCount();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (!authAPI.isAuthenticated()) {
    return null;
  }

  return (
    <Link href="/dashboard/cart">
      <Button variant="ghost" className="relative p-2" disabled={loading}>
        <ShoppingCart className="h-5 w-5 text-white" />
        {cartCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center min-w-5"
          >
            {cartCount > 99 ? '99+' : cartCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}