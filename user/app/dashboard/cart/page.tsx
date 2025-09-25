"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cartAPI, authAPI } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Trash2, ShoppingCart, CreditCard, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice, formatPriceFull } from "@/lib/utils/currency";

interface CartItem {
  _id: string;
  course: {
    _id: string;
    title: string;
    description: string;
    thumbnail?: string;
    level: string;
    duration: number;
    price: number;
    originalPrice?: number;
    category: string;
    instructorName: string;
  };
  addedAt: string;
}

interface CartData {
  cart: {
    _id: string;
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
  };
  itemsCount: number;
  totalAmount: number;
}

export default function CartPage() {
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const router = useRouter();

  // Load local cart for non-authenticated users
  const loadLocalCart = () => {
    const localCart = JSON.parse(localStorage.getItem('localCart') || '[]');
    const localCartData = {
      cart: {
        _id: 'local',
        items: localCart.map((course: any) => ({
          _id: course._id,
          course: course,
          addedAt: new Date().toISOString()
        })),
        totalItems: localCart.length,
        totalPrice: localCart.reduce((total: number, course: any) => total + (course.price || 0), 0)
      },
      itemsCount: localCart.length,
      totalAmount: localCart.reduce((total: number, course: any) => total + (course.price || 0), 0)
    };
    setCartData(localCartData);
  };

  const removeFromLocalCart = (courseId: string) => {
    const localCart = JSON.parse(localStorage.getItem('localCart') || '[]');
    const updatedCart = localCart.filter((course: any) => course._id !== courseId);
    localStorage.setItem('localCart', JSON.stringify(updatedCart));
    localStorage.setItem('cart-updated', Date.now().toString());
    window.dispatchEvent(new StorageEvent('storage', { key: 'cart-updated' }));
    loadLocalCart();
  };

  const clearLocalCart = () => {
    localStorage.removeItem('localCart');
    localStorage.setItem('cart-updated', Date.now().toString());
    window.dispatchEvent(new StorageEvent('storage', { key: 'cart-updated' }));
    loadLocalCart();
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    // Check if user is authenticated before making API call
    if (!authAPI.isAuthenticated()) {
      console.log('User not authenticated, loading local cart');
      loadLocalCart();
      setLoading(false);
      return;
    }

    try {
      const data = await cartAPI.getCart();
      console.log('Cart data received:', data);
      setCartData(data);
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      
      // If it's an authentication error, clear tokens and show login message
      if (error?.message?.includes('Access token is required') || 
          error?.message?.includes('401') || 
          error?.message?.includes('Unauthorized')) {
        console.log('Authentication error detected');
        authAPI.logout(); // Clear invalid tokens
        toast.error('Please log in to view your cart');
        return;
      }
      
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (courseId: string) => {
    setRemoving(courseId);
    try {
      if (!authAPI.isAuthenticated()) {
        removeFromLocalCart(courseId);
        toast.success('Course removed from cart');
      } else {
        await cartAPI.removeFromCart(courseId);
        await fetchCart(); // Refresh cart
        toast.success('Course removed from cart');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove course');
    } finally {
      setRemoving(null);
    }
  };

  const clearCart = async () => {
    try {
      if (!authAPI.isAuthenticated()) {
        clearLocalCart();
        toast.success('Cart cleared');
      } else {
        await cartAPI.clearCart();
        await fetchCart(); // Refresh cart
        toast.success('Cart cleared');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const checkout = async () => {
    setChecking(true);
    try {
      let coursesToEnroll = [];
      
      if (!authAPI.isAuthenticated()) {
        // Get courses from local cart for non-authenticated users
        const localCart = JSON.parse(localStorage.getItem('localCart') || '[]');
        coursesToEnroll = localCart;
        
        // Clear local cart
        localStorage.removeItem('localCart');
        localStorage.setItem('cart-updated', Date.now().toString());
        window.dispatchEvent(new StorageEvent('storage', { key: 'cart-updated' }));
      } else {
        // For authenticated users, use regular checkout
        const result = await cartAPI.checkout('free', {
          paymentMethodId: 'demo_free_checkout'
        });
        
        toast.success('🎉 Purchase Successful!', {
          description: `You have been enrolled in ${result.coursesCount} course(s). Start learning now!`,
          duration: 5000,
          action: {
            label: 'View Courses',
            onClick: () => router.push('/dashboard/my-courses')
          }
        });
        
        // Clear cart data
        setCartData({ cart: { _id: '', items: [], totalItems: 0, totalPrice: 0 }, itemsCount: 0, totalAmount: 0 });
        
        // Redirect to my courses after a short delay
        setTimeout(() => {
          router.push('/dashboard/my-courses');
        }, 2000);
        
        setChecking(false);
        return;
      }
      
      // For non-authenticated users, store courses in local enrolled courses
      if (coursesToEnroll.length > 0) {
        const existingEnrolled = JSON.parse(localStorage.getItem('localEnrolledCourses') || '[]');
        const newEnrolledCourses = coursesToEnroll.map((course: any) => ({
          enrollmentId: `local-${course._id}-${Date.now()}`,
          course: {
            ...course,
            instructor: course.instructorName || course.instructor || 'Unknown Instructor',
            instructorName: course.instructorName || course.instructor || 'Unknown Instructor'
          },
          progress: 0,
          lessonsCompleted: [],
          enrolledAt: new Date().toISOString(),
          expiresAt: null,
          lastAccessedAt: new Date().toISOString()
        }));
        
        const updatedEnrolled = [...existingEnrolled, ...newEnrolledCourses];
        localStorage.setItem('localEnrolledCourses', JSON.stringify(updatedEnrolled));
        
        // Clear cart data
        setCartData({ cart: { _id: '', items: [], totalItems: 0, totalPrice: 0 }, itemsCount: 0, totalAmount: 0 });
        
        toast.success('🎉 Enrollment Successful!', {
          description: `You have been enrolled in ${coursesToEnroll.length} course(s). Start learning now!`,
          duration: 5000,
          action: {
            label: 'View Courses',
            onClick: () => router.push('/dashboard/my-courses')
          }
        });
        
        // Redirect to my courses after a short delay
        setTimeout(() => {
          router.push('/dashboard/my-courses');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error during checkout:', error);
      toast.error(error?.message || 'Checkout failed');
    } finally {
      setChecking(false);
    }
  };

  // Using shared currency utility
  const formatDuration = (minutes: number) => `${Math.round(minutes / 60)}h`;

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-white">Shopping Cart</h1>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-white/10 bg-white">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="flex gap-4">
                    <div className="h-20 w-32 rounded bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-slate-200" />
                      <div className="h-3 w-1/2 rounded bg-slate-200" />
                      <div className="h-3 w-1/4 rounded bg-slate-200" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }


  if (!cartData || !cartData.cart || cartData.cart.totalItems === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-white">Shopping Cart</h1>
        <Card className="border-white/10 bg-white">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-16 w-16 text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Your cart is empty</h3>
            <p className="text-slate-600 mb-6 text-center max-w-md">
              Discover amazing courses and add them to your cart to start learning!
            </p>
            <Link href="/dashboard/courses">
              <Button className="bg-indigo-600 hover:bg-indigo-500">
                Browse Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { cart } = cartData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Shopping Cart</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearCart} className="text-slate-600">
            Clear Cart
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            {cartData.cart.totalItems} {cartData.cart.totalItems === 1 ? 'item' : 'items'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <Card key={item._id} className="border-white/10 bg-white">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Course Thumbnail */}
                  <div className="flex-shrink-0">
                    {item.course.thumbnail ? (
                      <img
                        src={item.course.thumbnail}
                        alt={item.course.title}
                        className="h-20 w-32 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-20 w-32 rounded-lg bg-slate-200 flex items-center justify-center">
                        <span className="text-slate-400 text-sm">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 mb-1 truncate">
                      {item.course.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-2">
                      By {item.course.instructorName}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{item.course.level}</span>
                      <span>{formatDuration(item.course.duration)}</span>
                      <span>{item.course.category}</span>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {formatPrice(item.course.price)}
                      </div>
                      {item.course.originalPrice && item.course.originalPrice > item.course.price && (
                        <div className="text-sm text-slate-500 line-through">
                          {formatPrice(item.course.originalPrice)}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.course._id)}
                      disabled={removing === item.course._id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {removing === item.course._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="border-white/10 bg-white sticky top-4">
            <CardHeader>
              <CardTitle className="text-slate-900">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal ({cart.totalItems} items)</span>
                <span className="font-semibold">{formatPrice(cart.totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Discount</span>
                <span className="font-semibold text-green-600">
                  -{formatPrice(cart.items.reduce((total, item) => 
                    total + ((item.course.originalPrice || item.course.price) - item.course.price), 0
                  ))}
                </span>
              </div>
              <hr className="border-slate-200" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(cart.totalPrice)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-500" 
                size="lg"
                onClick={checkout}
                disabled={checking}
              >
                {checking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Checkout
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
