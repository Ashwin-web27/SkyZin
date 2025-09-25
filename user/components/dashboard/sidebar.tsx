"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, BookOpen, CheckCircle2, ShoppingCart, LogOut, Menu, X, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { cartAPI, authAPI } from "@/lib/api"
import { ProfileSection } from "./profile-section"
import { ProfileEditModal } from "./profile-edit-modal"

const items = [
  { href: "/dashboard", label: "Profile", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "Available Courses", icon: BookOpen },
  { href: "/dashboard/my-courses", label: "My Courses", icon: GraduationCap },
  { href: "/dashboard/cart", label: "Cart", icon: ShoppingCart },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const fetchCartCount = async () => {
    if (!authAPI.isAuthenticated()) {
      // Get local cart count for non-authenticated users
      const localCart = JSON.parse(localStorage.getItem('localCart') || '[]');
      setCartCount(localCart.length);
      return;
    }
    
    try {
      const cartData = await cartAPI.getCart();
      setCartCount(cartData.cart?.totalItems || 0);
    } catch (error: any) {
      console.error('Error fetching cart count:', error);
      // If authentication error, fallback to local cart
      if (error?.message?.includes('Authentication required') ||
          error?.message?.includes('token') ||
          error?.message?.includes('401') ||
          error.isAuthError) {
        const localCart = JSON.parse(localStorage.getItem('localCart') || '[]');
        setCartCount(localCart.length);
        // Don't need to call authAPI.logout() as the API client already cleared tokens
      }
    }
  };

  const handleProfileUpdated = (updatedUser: any) => {
    setCurrentUser(updatedUser);
  };

  useEffect(() => {
    fetchCartCount();
    
    // Load current user
    if (authAPI.isAuthenticated()) {
      setCurrentUser(authAPI.getCurrentUser());
    }

    // Refresh cart count every 30 seconds
    const interval = setInterval(fetchCartCount, 30000);

    // Listen for storage changes (when user adds to cart)
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

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 bg-[#0b1020]/80 backdrop-blur border border-white/10 text-white hover:bg-white/10"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside
        className={cn(
          "sticky top-0 h-[calc(100dvh)] w-64 shrink-0 border-r border-white/10 bg-[#0b1020]/60 p-4 backdrop-blur",
          "fixed left-0 z-50 transform transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-4 px-2">
          <h1 className="text-lg font-semibold text-white">SkyZin</h1>
          <p className="text-xs text-white/60">User Dashboard</p>
        </div>

        <ProfileSection 
          className="mb-4 mx-2" 
          onEditClick={() => {
            setIsMobileMenuOpen(false)
            setIsProfileEditOpen(true)
          }}
        />

        <nav className="flex flex-col gap-1">
          {items.map((it) => {
            const Icon = it.icon
            const active = pathname === it.href || (it.href !== "/dashboard" && pathname?.startsWith(it.href))
            const isCart = it.href === "/dashboard/cart"
            return (
              <Link key={it.href} href={it.href}>
                <Button
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 rounded-md text-white/80 hover:bg-white/10 hover:text-white relative",
                    active && "bg-white/10 text-white",
                  )}
                >
                  <Icon size={18} />
                  <span>{it.label}</span>
                  {isCart && cartCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-auto h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center min-w-5"
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-4">
          <Button
            onClick={() => {
              setIsMobileMenuOpen(false)
              authAPI.logout() // Clear tokens
              router.push("/login")
            }}
            className="w-full justify-start gap-2 rounded-md bg-transparent text-red-300 hover:bg-red-500/10 hover:text-red-200"
            variant="ghost"
          >
            <LogOut size={18} />
            Log out
          </Button>
        </div>
      </aside>
      
      <ProfileEditModal 
        isOpen={isProfileEditOpen}
        onClose={() => setIsProfileEditOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />
    </>
  )
}
