"use client"

import { useState, useEffect } from "react"
import { User, Edit, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authAPI } from "@/lib/api"
import { cn } from "@/lib/utils"

interface ProfileSectionProps {
  onEditClick?: () => void;
  className?: string;
}

export function ProfileSection({ onEditClick, className }: ProfileSectionProps) {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      if (authAPI.isAuthenticated()) {
        const currentUser = authAPI.getCurrentUser();
        setUser(currentUser);
      } else {
        // Check if guest user has saved profile data
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
          } catch {
            // Fallback to default guest user
            setUser({
              name: 'Guest User',
              email: 'guest@example.com',
              avatar: null
            });
          }
        } else {
          setUser({
            name: 'Guest User',
            email: 'guest@example.com',
            avatar: null
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser({
        name: 'Guest User',
        email: 'guest@example.com',
        avatar: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    // Listen for user profile updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        fetchUser();
      }
    };

    // Listen for custom profile update events
    const handleProfileUpdate = () => {
      fetchUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profile-updated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const handleEditClick = () => {
    if (onEditClick) {
      onEditClick();
    } else {
      // Default behavior - could navigate to profile page
      console.log('Edit profile clicked');
    }
  };

  if (isLoading) {
    return (
      <div className={cn("p-4 border-b border-white/10", className)}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded animate-pulse mb-2" />
            <div className="h-3 bg-white/10 rounded animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-4 border-b border-white/10", className)}>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={user?.avatar} 
              alt={user?.name || "User"} 
            />
            <AvatarFallback className="bg-primary/20 text-white text-sm">
              {user?.name ? getInitials(user.name) : <User size={16} />}
            </AvatarFallback>
          </Avatar>
          
          {/* Camera icon overlay for edit indication */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
            <Camera size={10} className="text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {user?.name || "Guest User"}
          </p>
          <p className="text-xs text-white/60 truncate">
            {user?.email || "guest@example.com"}
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEditClick}
          className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/10"
        >
          <Edit size={14} />
        </Button>
      </div>
      
      {user?.role && (
        <div className="mt-2">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary/20 text-primary-foreground rounded-full">
            {user.role === 'student' ? 'Student' : 'Instructor'}
          </span>
        </div>
      )}
    </div>
  );
}