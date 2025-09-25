"use client"

import { useState, useEffect, useRef } from "react"
import { User, Upload, X, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { authAPI, userAPI } from "@/lib/api"
import { toast } from "sonner"

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (user: any) => void;
}

export function ProfileEditModal({ isOpen, onClose, onProfileUpdated }: ProfileEditModalProps) {
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    avatar: ''
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      if (authAPI.isAuthenticated()) {
        const currentUser = authAPI.getCurrentUser();
        setUser(currentUser);
        setFormData({
          name: currentUser?.name || '',
          email: currentUser?.email || '',
          phone: currentUser?.phone || '',
          bio: currentUser?.bio || '',
          avatar: currentUser?.avatar || ''
        });
        setAvatarPreview(currentUser?.avatar || null);
      } else {
        // Guest user
        const guestUser = {
          name: 'Guest User',
          email: 'guest@example.com',
          phone: '',
          bio: '',
          avatar: null
        };
        setUser(guestUser);
        setFormData(guestUser);
        setAvatarPreview(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        setFormData(prev => ({
          ...prev,
          avatar: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const handleSave = async () => {
    // Basic form validation
    if (!formData.name || !formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!formData.email || !formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsSaving(true);

      if (authAPI.isAuthenticated()) {
        // For authenticated users, try to update via API
        try {
          const updatedUser = await userAPI.updateProfile({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            bio: formData.bio,
            avatar: formData.avatar
          });

          // Update localStorage with new user data
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Trigger custom event for profile update
          window.dispatchEvent(new CustomEvent('profile-updated'));
          
          toast.success('Profile updated successfully');
          
          if (onProfileUpdated) {
            onProfileUpdated(updatedUser);
          }
        } catch (apiError: any) {
          console.error('API update failed, updating locally:', apiError);
          // Fallback to local update if API fails
          const updatedUser = {
            ...user,
            ...formData,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Trigger custom event for profile update
          window.dispatchEvent(new CustomEvent('profile-updated'));
          
          toast.success('Profile updated locally (server unavailable)');
          
          if (onProfileUpdated) {
            onProfileUpdated(updatedUser);
          }
        }
      } else {
        // For guest users, update locally
        const updatedUser = {
          _id: 'guest-user',
          role: 'student',
          enrolledCourses: [],
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Trigger custom event for profile update
        window.dispatchEvent(new CustomEvent('profile-updated'));
        
        toast.success('Profile updated locally');
        
        if (onProfileUpdated) {
          onProfileUpdated(updatedUser);
        }
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      // Reset form data when closing
      setFormData({
        name: '',
        email: '',
        phone: '',
        bio: '',
        avatar: ''
      });
      setAvatarPreview(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage 
                    src={avatarPreview || formData.avatar} 
                    alt={formData.name || "User"} 
                  />
                  <AvatarFallback className="text-lg">
                    {formData.name ? getInitials(formData.name) : <User size={24} />}
                  </AvatarFallback>
                </Avatar>
                
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                >
                  <Upload size={14} />
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              
              <p className="text-xs text-muted-foreground text-center">
                Click the upload button to change your profile photo
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={3}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}