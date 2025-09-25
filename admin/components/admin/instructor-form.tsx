"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { instructorsAPI, coursesAPI, Instructor, Course, CreateInstructorRequest } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, Upload, X } from "lucide-react"

interface InstructorFormProps {
  instructor?: Instructor | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mode: 'create' | 'edit'
}

export function InstructorForm({ instructor, isOpen, onClose, onSuccess, mode }: InstructorFormProps) {
  const [loading, setLoading] = useState(false)
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [formData, setFormData] = useState<CreateInstructorRequest & { 
    status?: string
    courseId?: string 
  }>({
    name: "",
    email: "",
    password: "",
    phone: "",
    bio: "",
    avatar: "",
    status: "Active"
  })

  useEffect(() => {
    if (instructor && mode === 'edit') {
      setFormData({
        name: instructor.name,
        email: instructor.email,
        password: "", // Don't pre-fill password
        phone: instructor.phone || "",
        bio: instructor.bio || "",
        avatar: instructor.avatar || "",
        status: instructor.status
      })
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        bio: "",
        avatar: "",
        status: "Active"
      })
    }
  }, [instructor, mode])

  useEffect(() => {
    if (isOpen) {
      fetchAvailableCourses()
    }
  }, [isOpen])

  const fetchAvailableCourses = async () => {
    try {
      const courses = await coursesAPI.getAllCourses({
        limit: 1000,
        status: 'Draft' // Only show draft courses that need instructors
      })
      setAvailableCourses(courses)
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return "Name is required"
    if (!formData.email.trim()) return "Email is required"
    if (mode === 'create' && !formData.password) return "Password is required"
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return "Please enter a valid email address"
    }
    
    if (mode === 'create' && formData.password && formData.password.length < 6) {
      return "Password must be at least 6 characters long"
    }
    
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      return "Please enter a valid phone number"
    }
    
    if (formData.avatar && !/^https?:\/\/.+/.test(formData.avatar)) {
      return "Avatar must be a valid URL"
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      setLoading(true)
      
      const submitData = { ...formData }
      
      // Remove password from update request if it's empty
      if (mode === 'edit' && !submitData.password) {
        delete submitData.password
      }
      
      let result: Instructor
      
      if (mode === 'create') {
        result = await instructorsAPI.createInstructor(submitData as CreateInstructorRequest)
        toast.success("Instructor created successfully!")
      } else {
        result = await instructorsAPI.updateInstructor(instructor!._id, submitData)
        toast.success("Instructor updated successfully!")
      }

      // If course assignment is requested
      if (formData.courseId) {
        try {
          await instructorsAPI.assignInstructorToCourse(result._id, formData.courseId)
          toast.success("Instructor assigned to course successfully!")
        } catch (error) {
          console.error('Failed to assign course:', error)
          toast.error("Instructor saved but failed to assign to course")
        }
      }

      onSuccess()
      onClose()
      
    } catch (error: any) {
      console.error(`${mode} instructor error:`, error)
      toast.error(error.message || `Failed to ${mode} instructor`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Instructor' : 'Edit Instructor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.avatar} alt={formData.name} />
              <AvatarFallback className="text-lg">
                {formData.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'IN'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="avatar">Profile Picture URL</Label>
              <Input
                id="avatar"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={formData.avatar}
                onChange={(e) => handleInputChange('avatar', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {mode === 'create' ? '*' : '(leave blank to keep current)'}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={mode === 'create' ? "Enter password" : "Enter new password"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required={mode === 'create'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>

          {mode === 'edit' && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bio">Bio / Description</Label>
            <Textarea
              id="bio"
              placeholder="Brief description about the instructor's background, expertise, and teaching experience..."
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground">
              {formData.bio.length}/1000 characters
            </div>
          </div>

          {/* Course Assignment (for create mode) */}
          {mode === 'create' && availableCourses.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="courseId">Assign to Course (Optional)</Label>
              <Select value={formData.courseId} onValueChange={(value) => handleInputChange('courseId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course to assign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No assignment</SelectItem>
                  {availableCourses.map((course) => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.title} ({course.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Instructor' : 'Update Instructor'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}