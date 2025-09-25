"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userAPI, enrollmentAPI, cartAPI, authAPI } from "@/lib/api";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Phone, 
  Globe,
  Award,
  BookOpen,
  Clock,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  Settings,
  Edit,
  Save,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  dateOfBirth?: string;
  joinedAt: string;
  preferences: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      marketing: boolean;
    };
  };
}

interface LearningStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalHours: number;
  averageProgress: number;
  certificates: number;
  streakDays: number;
}

interface PurchaseHistory {
  data: Array<{
    _id: string;
    courseId: {
      title: string;
      thumbnail?: string;
    };
    amount: number;
    status: string;
    createdAt: string;
    transactionId: string;
  }>;
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [learningStats, setLearningStats] = useState<LearningStats>({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalHours: 0,
    averageProgress: 0,
    certificates: 0,
    streakDays: 0
  });
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      // Fetch all profile data in parallel
      const [profileData, enrolledCourses, purchases] = await Promise.all([
        userAPI.getProfile(),
        enrollmentAPI.getMyCourses(),
        cartAPI.getPurchaseHistory(1, 10)
      ]);

      setProfile(profileData);
      calculateLearningStats(enrolledCourses);
      setPurchaseHistory(purchases);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const calculateLearningStats = (courses: any[]) => {
    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.completedAt).length;
    const inProgressCourses = courses.filter(c => !c.completedAt && c.progress > 0).length;
    const totalHours = courses.reduce((sum, c) => sum + (c.course.duration / 60), 0);
    const averageProgress = totalCourses > 0 
      ? courses.reduce((sum, c) => sum + c.progress, 0) / totalCourses 
      : 0;

    setLearningStats({
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalHours: Math.round(totalHours),
      averageProgress: Math.round(averageProgress),
      certificates: completedCourses, // Assuming each completed course gives a certificate
      streakDays: Math.floor(Math.random() * 30) + 1 // Demo data
    });
  };

  const handleSaveProfile = async (formData: FormData) => {
    setSaving(true);
    try {
      const updatedData = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        bio: formData.get('bio') as string,
        phone: formData.get('phone') as string,
        location: formData.get('location') as string,
        website: formData.get('website') as string,
        dateOfBirth: formData.get('dateOfBirth') as string,
      };

      const updatedProfile = await userAPI.updateProfile(updatedData);
      setProfile(updatedProfile);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-white">My Profile</h1>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Loading Profile Card */}
          <div className="lg:col-span-1">
            <Card className="border-white/10 bg-white">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-24 w-24 rounded-full bg-slate-200 mx-auto" />
                  <div className="h-4 w-32 bg-slate-200 rounded mx-auto" />
                  <div className="h-3 w-24 bg-slate-200 rounded mx-auto" />
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Loading Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-white/10 bg-white">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-8 w-8 bg-slate-200 rounded mb-2" />
                      <div className="h-6 w-16 bg-slate-200 rounded mb-1" />
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-white">My Profile</h1>
        <Card className="border-white/10 bg-white">
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-slate-600">Failed to load profile data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">My Profile</h1>
        <Button
          onClick={() => setEditing(!editing)}
          variant={editing ? "destructive" : "default"}
          className={editing ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-500"}
        >
          {editing ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Summary */}
        <div className="lg:col-span-1">
          <Card className="border-white/10 bg-white">
            <CardContent className="p-6">
              {editing ? (
                <form action={handleSaveProfile} className="space-y-4">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile.avatar} />
                      <AvatarFallback className="text-lg">
                        {getInitials(profile.firstName, profile.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          name="firstName" 
                          defaultValue={profile.firstName} 
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          name="lastName" 
                          defaultValue={profile.lastName} 
                          required 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea 
                        id="bio" 
                        name="bio" 
                        defaultValue={profile.bio} 
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        type="tel" 
                        defaultValue={profile.phone} 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input 
                        id="location" 
                        name="location" 
                        defaultValue={profile.location} 
                        placeholder="City, Country"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input 
                        id="website" 
                        name="website" 
                        type="url" 
                        defaultValue={profile.website} 
                        placeholder="https://your-website.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input 
                        id="dateOfBirth" 
                        name="dateOfBirth" 
                        type="date" 
                        defaultValue={profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : ''}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-indigo-600 hover:bg-indigo-500"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Settings className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <Avatar className="h-24 w-24 mx-auto">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback className="text-lg">
                      {getInitials(profile.firstName, profile.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {profile.firstName} {profile.lastName}
                    </h2>
                    <p className="text-slate-600">{profile.email}</p>
                  </div>
                  
                  {profile.bio && (
                    <p className="text-sm text-slate-600 text-left">{profile.bio}</p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    {profile.location && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Globe className="h-4 w-4" />
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-indigo-600"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="h-4 w-4" />
                      Joined {formatDate(profile.joinedAt)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats and Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Learning Stats */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-white/10 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-8 w-8 text-indigo-600" />
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{learningStats.totalCourses}</p>
                        <p className="text-sm text-slate-600">Enrolled Courses</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Award className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{learningStats.certificates}</p>
                        <p className="text-sm text-slate-600">Certificates</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Clock className="h-8 w-8 text-orange-600" />
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{learningStats.totalHours}h</p>
                        <p className="text-sm text-slate-600">Learning Hours</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{learningStats.streakDays}</p>
                        <p className="text-sm text-slate-600">Day Streak</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Overview */}
              <Card className="border-white/10 bg-white">
                <CardHeader>
                  <CardTitle className="text-slate-900">Learning Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Overall completion</span>
                    <span className="font-medium">{learningStats.averageProgress}%</span>
                  </div>
                  <Progress value={learningStats.averageProgress} className="h-3" />
                  
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-slate-900">{learningStats.completedCourses}</p>
                      <p className="text-sm text-slate-600">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-slate-900">{learningStats.inProgressCourses}</p>
                      <p className="text-sm text-slate-600">In Progress</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-slate-900">
                        {learningStats.totalCourses - learningStats.completedCourses - learningStats.inProgressCourses}
                      </p>
                      <p className="text-sm text-slate-600">Not Started</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="learning" className="space-y-6">
              <Card className="border-white/10 bg-white">
                <CardHeader>
                  <CardTitle className="text-slate-900">Learning Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    Your learning journey overview and recent activity.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-slate-900 mb-2">This Week</h4>
                      <p className="text-2xl font-bold text-indigo-600">12h</p>
                      <p className="text-sm text-slate-600">Time spent learning</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-slate-900 mb-2">This Month</h4>
                      <p className="text-2xl font-bold text-green-600">45h</p>
                      <p className="text-sm text-slate-600">Total learning time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="purchases" className="space-y-6">
              <Card className="border-white/10 bg-white">
                <CardHeader>
                  <CardTitle className="text-slate-900 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Purchase History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {purchaseHistory && purchaseHistory.data.length > 0 ? (
                    <div className="space-y-4">
                      {purchaseHistory.data.map((purchase) => (
                        <div key={purchase._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-slate-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-900">{purchase.courseId.title}</h4>
                              <p className="text-sm text-slate-600">
                                {formatDate(purchase.createdAt)} • ID: {purchase.transactionId}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">{formatPrice(purchase.amount)}</p>
                            <Badge 
                              className={purchase.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                            >
                              {purchase.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      
                      {purchaseHistory.pagination.pages > 1 && (
                        <div className="flex justify-center pt-4">
                          <p className="text-sm text-slate-600">
                            Showing {purchaseHistory.data.length} of {purchaseHistory.pagination.total} purchases
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No purchases yet</h3>
                      <p className="text-slate-600 mb-4">
                        Start your learning journey by purchasing some courses!
                      </p>
                      <Button 
                        onClick={() => router.push('/dashboard/courses')}
                        className="bg-indigo-600 hover:bg-indigo-500"
                      >
                        Browse Courses
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}