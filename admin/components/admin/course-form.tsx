"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { coursesAPI, type Course, type Lesson } from "@/lib/api"
import { toast } from "sonner"
import { Upload, Video, Plus, Edit, Trash2, Save, X, Play, DollarSign, Users, TrendingUp, BarChart3, Calendar, Settings, Globe } from "lucide-react"

interface LessonFormData {
  title: string;
  content: string;
  duration: number;
  videoUrl: string;
  videoDuration: number;
  isPreview: boolean;
  order: number;
  resources: Array<{
    title: string;
    url: string;
    type: 'pdf' | 'document' | 'image' | 'link' | 'code';
  }>;
}

interface CourseAnalytics {
  totalEnrollments: number;
  totalRevenue: number;
  completionRate: number;
  avgRating: number;
  totalReviews: number;
  recentEnrollments: any[];
}

export function CourseForm({ mode, courseId }: { mode: "create" | "edit"; courseId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null)
  
  // Course form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [category, setCategory] = useState("Programming")
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner")
  const [price, setPrice] = useState("0")
  const [originalPrice, setOriginalPrice] = useState("")
  const [promotionalPrice, setPromotionalPrice] = useState("")
  const [promotionalPriceEndDate, setPromotionalPriceEndDate] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [status, setStatus] = useState<"Draft" | "Published">("Draft")
  const [isActive, setIsActive] = useState(true)
  const [featured, setFeatured] = useState(false)
  const [trending, setTrending] = useState(false)
  const [maxEnrollments, setMaxEnrollments] = useState("")
  const [enrollmentStartDate, setEnrollmentStartDate] = useState("")
  const [enrollmentEndDate, setEnrollmentEndDate] = useState("")
  const [whatYoullLearn, setWhatYoullLearn] = useState<string[]>([])
  const [prerequisites, setPrerequisites] = useState<string[]>([])
  const [adminNotes, setAdminNotes] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string>("");
  
  // SEO fields
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  
  // Real-time updates
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  
  // Lesson management state
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [showLessonDialog, setShowLessonDialog] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [lessonForm, setLessonForm] = useState<LessonFormData>({
    title: "",
    content: "",
    duration: 0,
    videoUrl: "",
    videoDuration: 0,
    isPreview: false,
    order: 1,
    resources: []
  })
  
  // Upload progress
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)

  // Load course data for editing
  useEffect(() => {
    if (mode === "edit" && courseId) {
      loadCourseData()
    }
  }, [mode, courseId])

  const loadCourseData = async () => {
    if (!courseId) return
    
    try {
      const courseData = await coursesAPI.getCourseById(courseId)
      setCourse(courseData)
      setTitle(courseData.title)
      setDescription(courseData.description)
      setCategory(courseData.category)
      setLevel(courseData.level)
      setPrice(courseData.price.toString())
      setOriginalPrice(courseData.originalPrice?.toString() || "")
      setTags(courseData.tags || [])
      setStatus(courseData.status)
      setLessons(courseData.lessons || [])
      setPreviewUrl(courseData.thumbnail || "")
    } catch (error) {
      console.error('Error loading course:', error)
      toast.error('Failed to load course data')
    }
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setIsUploading(true)
    
    try {
      const courseData = {
        title,
        description,
        shortDescription,
        category,
        level,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        promotionalPrice: promotionalPrice ? parseFloat(promotionalPrice) : undefined,
        promotionalPriceEndDate: promotionalPriceEndDate || undefined,
        tags,
        status,
        isActive,
        featured,
        trending,
        maxEnrollments: maxEnrollments ? parseInt(maxEnrollments) : undefined,
        enrollmentStartDate: enrollmentStartDate || undefined,
        enrollmentEndDate: enrollmentEndDate || undefined,
        whatYoullLearn,
        prerequisites,
        adminNotes,
        seoTitle,
        seoDescription,
        seoKeywords,
        thumbnail: thumbnailUrl || previewUrl || undefined
      }
      
      let savedCourse: Course
      if (mode === "create") {
        savedCourse = await coursesAPI.createCourse(courseData)
        toast.success('Course created successfully!')
      } else {
        savedCourse = await coursesAPI.updateCourse(courseId!, courseData)
        toast.success('Course updated successfully!')
      }
      
      if (mode === "create") {
        router.push(`/courses/${savedCourse._id}/edit`)
      } else {
        setCourse(savedCourse)
      }
      
    } catch (error: any) {
      console.error('Error saving course:', error)
      toast.error(error.message || 'Failed to save course')
    } finally {
      setLoading(false)
      setIsUploading(false)
    }
  }

  // Lesson management functions
  const openLessonDialog = (lesson?: any) => {
    if (lesson) {
      setEditingLesson(lesson)
      setLessonForm({
        title: lesson.title || '',
        content: lesson.content || '',
        duration: lesson.duration || 0,
        videoUrl: lesson.videoUrl || '',
        videoDuration: lesson.videoDuration || 0,
        isPreview: lesson.isPreview || false,
        order: lesson.order || lessons.length + 1,
        resources: lesson.resources || []
      })
    } else {
      setEditingLesson(null)
      setLessonForm({
        title: '',
        content: '',
        duration: 0,
        videoUrl: '',
        videoDuration: 0,
        isPreview: false,
        order: lessons.length + 1,
        resources: []
      })
    }
    setShowLessonDialog(true)
  }

  const saveLessonHandler = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!course) {
      toast.error('Please save the course first before adding lessons')
      return
    }
    
    setIsUploading(true)
    
    try {
      // Get current lessons and update them
      const updatedLessons = editingLesson 
        ? lessons.map(l => l._id === editingLesson._id ? { ...lessonForm, _id: l._id } : l)
        : [...lessons, { ...lessonForm, _id: Date.now().toString() }]
      
      // Update lessons via the course management API
      const response = await coursesAPI.updateLessons(course._id, updatedLessons)
      
      setLessons(response.lessons || updatedLessons)
      setShowLessonDialog(false)
      loadCourseData() // Refresh course data
      
      toast.success(editingLesson ? 'Lesson updated successfully!' : 'Lesson added successfully!')
      
    } catch (error: any) {
      console.error('Error saving lesson:', error)
      toast.error(error.message || 'Failed to save lesson')
    } finally {
      setIsUploading(false)
    }
  }

  const deleteLesson = async (lessonId: string) => {
    if (!course) return
    
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return
    }
    
    try {
      const updatedLessons = lessons.filter(l => l._id !== lessonId)
      await coursesAPI.updateLessons(course._id, updatedLessons)
      setLessons(updatedLessons)
      toast.success('Lesson deleted successfully!')
      loadCourseData() // Refresh course data
    } catch (error: any) {
      console.error('Error deleting lesson:', error)
      toast.error(error.message || 'Failed to delete lesson')
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{mode === "create" ? "Create New Course" : "Edit Course"}</h1>
          <p className="text-muted-foreground">
            {mode === "create" 
              ? "Create a comprehensive course with lessons and videos" 
              : "Manage your course content and lessons"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading || isUploading}>
            {loading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                {isUploading ? "Uploading..." : "Saving..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === "create" ? "Create Course" : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="lessons" disabled={mode === "create" && !course}>Lessons & Videos</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the basic details about your course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Complete React Development Course"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what students will learn in this course..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Programming">Programming</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Photography">Photography</SelectItem>
                        <SelectItem value="Music">Music</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Difficulty Level</Label>
                    <Select value={level} onValueChange={(value: any) => setLevel(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Thumbnail</CardTitle>
                <CardDescription>Upload an attractive thumbnail for your course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {previewUrl && (
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-100">
                      <img 
                        src={previewUrl} 
                        alt="Course thumbnail" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-center w-full">
                    <Label htmlFor="thumbnail" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-slate-500" />
                        <p className="text-sm text-slate-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                      <Input
                        id="thumbnail"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                      />
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Add relevant tags to help students find your course</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Course Lessons</CardTitle>
                <CardDescription>Manage your course content and videos</CardDescription>
              </div>
              <Button onClick={() => openLessonDialog()} disabled={!course}>
                <Plus className="mr-2 h-4 w-4" />
                Add Lesson
              </Button>
            </CardHeader>
            <CardContent>
              {lessons.length === 0 ? (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No lessons yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first lesson to start building your course content.
                  </p>
                  <Button onClick={() => openLessonDialog()} disabled={!course}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Lesson
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {lessons.map((lesson, index) => (
                    <div key={lesson._id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{lesson.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatDuration(lesson.duration)}</span>
                          {lesson.videoUrl && (
                            <div className="flex items-center gap-1">
                              <Play className="h-3 w-3" />
                              <span>Video</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openLessonDialog(lesson)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteLesson(lesson._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Pricing</CardTitle>
              <CardDescription>Set your course pricing and discount options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Course Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Original Price (₹)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                  />
                </div>
              </div>
              {originalPrice && parseFloat(originalPrice) > parseFloat(price) && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100)}% OFF
                    </Badge>
                    <span className="text-sm text-green-700">
                      Students save ₹{(parseFloat(originalPrice) - parseFloat(price)).toFixed(0)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publication Settings</CardTitle>
              <CardDescription>Control when and how your course is available to students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Course Status</Label>
                    <p className="text-sm text-muted-foreground">
                      {status === "Published" 
                        ? "Your course is live and available to students" 
                        : "Your course is saved as draft and not visible to students"}
                    </p>
                  </div>
                  <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {course && (
                  <Separator />
                )}
                
                {course && (
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <Label className="text-sm font-medium">Total Duration</Label>
                      <p className="text-2xl font-bold">{formatDuration(course.duration)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Lessons</Label>
                      <p className="text-2xl font-bold">{lessons.length}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? "Edit Lesson" : "Add New Lesson"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveLessonHandler} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lessonTitle">Lesson Title *</Label>
              <Input
                id="lessonTitle"
                placeholder="e.g., Introduction to React Hooks"
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lessonContent">Lesson Content *</Label>
              <Textarea
                id="lessonContent"
                placeholder="Describe what students will learn in this lesson..."
                value={lessonForm.content}
                onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                rows={3}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lessonDuration">Duration (minutes) *</Label>
              <Input
                id="lessonDuration"
                type="number"
                min="1"
                placeholder="30"
                value={lessonForm.duration}
                onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input
                id="videoUrl"
                type="url"
                placeholder="https://example.com/video.mp4 or https://youtube.com/watch?v=..."
                value={lessonForm.videoUrl}
                onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
              />
              <p className="text-xs text-slate-500">
                Supports YouTube, Vimeo, Google Drive, Dropbox, or direct video URLs
              </p>
              {lessonForm.videoUrl && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Video className="w-4 h-4" />
                  <span>Video URL added</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="videoDuration">Video Duration (seconds)</Label>
              <Input
                id="videoDuration"
                type="number"
                min="0"
                placeholder="e.g., 1800 for 30 minutes"
                value={lessonForm.videoDuration}
                onChange={(e) => setLessonForm({ ...lessonForm, videoDuration: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-slate-500">
                Optional: Actual video length in seconds for progress tracking
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lessonOrder">Lesson Order *</Label>
              <Input
                id="lessonOrder"
                type="number"
                min="1"
                placeholder="1"
                value={lessonForm.order}
                onChange={(e) => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isPreview"
                checked={lessonForm.isPreview}
                onCheckedChange={(checked) => setLessonForm({ ...lessonForm, isPreview: checked })}
              />
              <Label htmlFor="isPreview">Allow preview (users can watch without enrollment)</Label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowLessonDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingLesson ? "Update Lesson" : "Add Lesson"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
