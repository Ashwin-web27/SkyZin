"use client"

import { Button } from "@/components/ui/button"
import { Course, cartAPI, authAPI } from "@/lib/api"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { ShoppingCart, Loader2 } from "lucide-react"

type Props = {
  course: Course
  className?: string
}

export default function AddToCartButton({ course, className }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [isInCart, setIsInCart] = useState(false)

  // Local cart functions for non-authenticated users
  const addToLocalCart = (course: Course) => {
    const localCart = JSON.parse(localStorage.getItem('localCart') || '[]');
    const existingCourse = localCart.find((item: any) => item._id === course._id);
    
    if (!existingCourse) {
      localCart.push(course);
      localStorage.setItem('localCart', JSON.stringify(localCart));
      localStorage.setItem('cart-updated', Date.now().toString());
      window.dispatchEvent(new StorageEvent('storage', { key: 'cart-updated' }));
    }
  };

  const isInLocalCart = (courseId: string) => {
    const localCart = JSON.parse(localStorage.getItem('localCart') || '[]');
    return localCart.some((item: any) => item._id === courseId);
  };

  // Check if course is already in cart when component loads
  useEffect(() => {
    const checkCartStatus = async () => {
      if (!authAPI.isAuthenticated()) {
        // Check local cart for non-authenticated users
        setIsInCart(isInLocalCart(course._id));
        return;
      }
      
      try {
        const cartData = await cartAPI.getCart();
        const courseInCart = cartData.cart?.items?.some(
          (item: any) => item.course._id === course._id
        );
        setIsInCart(courseInCart || false);
      } catch (error: any) {
        console.error('Error checking cart status:', error);
        // Fallback to local cart if API fails or authentication fails
        if (error?.message?.includes('Authentication required') ||
            error?.message?.includes('token') ||
            error.isAuthError) {
          setIsInCart(isInLocalCart(course._id));
        } else {
          setIsInCart(isInLocalCart(course._id));
        }
      }
    };

    checkCartStatus();
    
    // Listen for storage changes (auth state or cart updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'cart-updated') {
        checkCartStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [course._id]);

  const handleAdd = async () => {
    const isAuth = authAPI.isAuthenticated();
    console.log('Add to cart clicked - User authenticated:', isAuth);
    
    if (!isAuth) {
      // Add to local storage cart for non-authenticated users
      addToLocalCart(course);
      setIsInCart(true);
      toast.success(`"${course.title}" added to cart!`, {
        description: 'Login when you\'re ready to checkout',
        action: {
          label: 'View Cart',
          onClick: () => window.location.href = '/dashboard/cart'
        }
      });
      return
    }
    
    console.log('User is authenticated, proceeding to add to cart');

    setIsLoading(true)
    try {
      await cartAPI.addToCart(course._id)
      setIsInCart(true)
      
      // Trigger cart count refresh
      localStorage.setItem('cart-updated', Date.now().toString())
      window.dispatchEvent(new StorageEvent('storage', { key: 'cart-updated' }))
      
      toast.success(`"${course.title}" added to cart!`, {
        action: {
          label: 'View Cart',
          onClick: () => window.location.href = '/dashboard/cart'
        }
      })
    } catch (error: any) {
      console.error('Error adding to cart:', error)
      
      // Handle authentication errors
      if (error?.message?.includes('Authentication required') ||
          error?.message?.includes('server cart') ||
          error.isAuthError) {
        // Fall back to local cart
        addToLocalCart(course);
        setIsInCart(true);
        toast.success(`"${course.title}" added to local cart!`, {
          description: 'Login when you\'re ready to checkout',
          action: {
            label: 'View Cart',
            onClick: () => window.location.href = '/dashboard/cart'
          }
        });
      } else {
        const errorMessage = error?.message || 'Failed to add course to cart'
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <Button 
      onClick={handleAdd} 
      disabled={isLoading || isInCart}
      className={className || "rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding...
        </>
      ) : isInCart ? (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Added to Cart
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </>
      )}
    </Button>
  )
}
