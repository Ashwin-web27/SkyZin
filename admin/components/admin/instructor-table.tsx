"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { instructorsAPI, coursesAPI, Instructor, InstructorDetail, Course } from "@/lib/api"
import { InstructorForm } from "./instructor-form"
import { 
  Loader2, 
  Eye, 
  Shield, 
  ShieldOff, 
  Trash2, 
  RefreshCw, 
  Plus, 
  Edit, 
  BookOpen,
  DollarSign,
  Star,
  Users
} from "lucide-react"

export function InstructorTable() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorDetail | null>(null)
  const [instructorDetailLoading, setInstructorDetailLoading] = useState(false)
  
  // Form states
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null)
  
  // Course assignment states
  const [showCourseAssignment, setShowCourseAssignment] = useState(false)
  const [assigningInstructor, setAssigningInstructor] = useState<Instructor | null>(null)
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  
  // Filters and pagination
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | "Active" | "Blocked" | "Pending">("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Real-time updates
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)

  const fetchInstructors = useCallback(async () => {
    try {
      setLoading(true)
      const response = await instructorsAPI.getAllInstructors({
        page,
        limit: 10,
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      
      console.log('Instructors API Response:', response) // Debug logging
      
      // Handle different response structures
      let instructors = []
      let totalPages = 1
      
      if (response) {
        // Check if response has data property (nested structure)
        if (response.data) {
          instructors = response.data.instructors || []
          totalPages = response.data.pagination?.pages || 1
        } 
        // Direct structure
        else if (response.instructors) {
          instructors = response.instructors || []
          totalPages = response.pagination?.pages || 1
        }
        // Fallback: assume response is the instructors array itself
        else if (Array.isArray(response)) {
          instructors = response
          totalPages = 1
        }
      }
      
      setInstructors(instructors)
      setTotalPages(totalPages)
      setLastUpdated(new Date())
      
      console.log(`Loaded ${instructors.length} instructors, ${totalPages} total pages`) // Debug logging
      
    } catch (error: any) {
      console.error('Fetch instructors error:', error) // Debug logging
      toast.error(error.message || 'Failed to fetch instructors')
      // Set empty state on error
      setInstructors([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  // Set client-side flag to prevent hydration errors
  useEffect(() => {
    setIsClient(true)
    setLastUpdated(new Date())
  }, [])

  useEffect(() => {
    if (isClient) {
      fetchInstructors()
    }
  }, [fetchInstructors, isClient])

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    if (!isClient) return
    
    const interval = setInterval(fetchInstructors, 30000)
    return () => clearInterval(interval)
  }, [fetchInstructors, isClient])

  const handleToggleStatus = async (instructorId: string, currentStatus: string) => {
    try {
      setUpdating(instructorId)
      await instructorsAPI.toggleInstructorStatus(instructorId)
      await fetchInstructors()
      toast.success(`Instructor ${currentStatus === 'Active' ? 'blocked' : 'activated'} successfully`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update instructor status')
    } finally {
      setUpdating(null)
    }
  }

  const handleViewInstructor = async (instructorId: string) => {
    try {
      setInstructorDetailLoading(true)
      const instructorDetail = await instructorsAPI.getInstructorById(instructorId)
      setSelectedInstructor(instructorDetail)
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch instructor details')
    } finally {
      setInstructorDetailLoading(false)
    }
  }

  const handleDeleteInstructor = async (instructorId: string, instructorName: string) => {
    if (!confirm(`Are you sure you want to delete instructor "${instructorName}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      setUpdating(instructorId)
      await instructorsAPI.deleteInstructor(instructorId)
      await fetchInstructors()
      toast.success('Instructor deleted successfully')
    } catch (error: any) {
      if (error.message.includes('active courses')) {
        const forceDelete = confirm(error.message + '\n\nDo you want to force delete this instructor?')
        if (forceDelete) {
          try {
            await instructorsAPI.deleteInstructor(instructorId, true)
            await fetchInstructors()
            toast.success('Instructor force deleted successfully')
          } catch (err: any) {
            toast.error(err.message || 'Failed to delete instructor')
          }
        }
      } else {
        toast.error(error.message || 'Failed to delete instructor')
      }
    } finally {
      setUpdating(null)
    }
  }

  const handleEditInstructor = (instructor: Instructor) => {
    setEditingInstructor(instructor)
    setFormMode('edit')
    setShowForm(true)
  }

  const handleCreateInstructor = () => {
    setEditingInstructor(null)
    setFormMode('create')
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    fetchInstructors()
  }

  const handleShowCourseAssignment = async (instructor: Instructor) => {
    try {
      setAssigningInstructor(instructor)
      const courses = await coursesAPI.getAllCourses({
        limit: 1000,
        status: 'Draft'
      })
      setAvailableCourses(courses)
      setShowCourseAssignment(true)
    } catch (error) {
      toast.error('Failed to load available courses')
    }
  }

  const handleAssignCourse = async (courseId: string) => {
    if (!assigningInstructor) return
    
    try {
      await instructorsAPI.assignInstructorToCourse(assigningInstructor._id, courseId)
      toast.success('Course assigned successfully!')
      setShowCourseAssignment(false)
      fetchInstructors()
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign course')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>
      case 'Blocked':
        return <Badge variant="destructive">Blocked</Badge>
      case 'Pending':
        return <Badge variant="secondary">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Instructor Management
              <Badge variant="outline" className="text-xs">
                {instructors?.length || 0} instructors
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {isClient && lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchInstructors}
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                onClick={handleCreateInstructor}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Instructor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full gap-2 sm:max-w-md">
              <Input 
                placeholder="Search instructors by name or email" 
                value={search} 
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }} 
              />
              <Select value={status} onValueChange={(v: any) => {
                setStatus(v)
                setPage(1)
              }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-48">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <div className="text-sm text-muted-foreground">Loading instructors...</div>
                    </TableCell>
                  </TableRow>
                ) : (instructors?.length || 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-sm text-muted-foreground">No instructors found.</div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={handleCreateInstructor}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add First Instructor
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  (instructors || []).map((instructor) => (
                    <TableRow key={instructor._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={instructor.avatar} alt={instructor.name} />
                            <AvatarFallback>
                              {instructor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{instructor.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Joined {new Date(instructor.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{instructor.email}</div>
                        {instructor.phone && (
                          <div className="text-xs text-muted-foreground">{instructor.phone}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-medium">
                            {instructor.stats?.totalCourses || 0} total
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {instructor.stats?.publishedCourses || 0} published
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {formatCurrency(instructor.stats?.totalRevenue || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {instructor.stats?.totalEnrollments || 0} enrollments
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {instructor.stats?.averageRating?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {instructor.stats?.totalReviews || 0} reviews
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(instructor.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewInstructor(instructor._id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Instructor Details</DialogTitle>
                              </DialogHeader>
                              {instructorDetailLoading ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                              ) : selectedInstructor ? (
                                <div className="grid gap-6">
                                  <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20">
                                      <AvatarImage src={selectedInstructor.avatar} alt={selectedInstructor.name} />
                                      <AvatarFallback className="text-lg">
                                        {selectedInstructor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <h3 className="text-xl font-semibold">{selectedInstructor.name}</h3>
                                      <p className="text-muted-foreground">{selectedInstructor.email}</p>
                                      {selectedInstructor.bio && (
                                        <p className="text-sm mt-2">{selectedInstructor.bio}</p>
                                      )}
                                      <div className="flex gap-2 mt-2">
                                        {getStatusBadge(selectedInstructor.status)}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                      <BookOpen className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                                      <div className="text-lg font-bold">{selectedInstructor.stats.totalCourses}</div>
                                      <div className="text-xs text-muted-foreground">Total Courses</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                      <Users className="h-5 w-5 mx-auto mb-1 text-green-500" />
                                      <div className="text-lg font-bold">{selectedInstructor.stats.totalEnrollments}</div>
                                      <div className="text-xs text-muted-foreground">Enrollments</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                      <DollarSign className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                                      <div className="text-lg font-bold">{formatCurrency(selectedInstructor.stats.totalRevenue)}</div>
                                      <div className="text-xs text-muted-foreground">Revenue</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                      <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                                      <div className="text-lg font-bold">{selectedInstructor.stats.averageRating.toFixed(1)}</div>
                                      <div className="text-xs text-muted-foreground">Avg Rating</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                      <Users className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                                      <div className="text-lg font-bold">{selectedInstructor.stats.totalStudents}</div>
                                      <div className="text-xs text-muted-foreground">Students</div>
                                    </div>
                                  </div>
                                  
                                  {selectedInstructor.courses.length > 0 && (
                                    <div>
                                      <h4 className="font-medium mb-3">Recent Courses</h4>
                                      <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {selectedInstructor.courses.slice(0, 5).map((course) => (
                                          <div key={course._id} className="flex justify-between items-center p-3 bg-muted rounded">
                                            <div className="flex-1">
                                              <div className="font-medium text-sm">{course.title}</div>
                                              <div className="text-xs text-muted-foreground">
                                                {course.status} • {course.category} • {course.level}
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <div className="font-medium text-sm">₹{course.price}</div>
                                              <div className="text-xs text-muted-foreground">
                                                {course.enrolledCount || 0} enrolled
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditInstructor(instructor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleShowCourseAssignment(instructor)}
                            title="Assign to Course"
                          >
                            <BookOpen className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant={instructor.status === "Blocked" ? "default" : "destructive"}
                            className="h-8 w-8 p-0"
                            onClick={() => handleToggleStatus(instructor._id, instructor.status)}
                            disabled={updating === instructor._id}
                          >
                            {updating === instructor._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : instructor.status === "Blocked" ? (
                              <Shield className="h-4 w-4" />
                            ) : (
                              <ShieldOff className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteInstructor(instructor._id, instructor.name)}
                            disabled={updating === instructor._id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructor Form Dialog */}
      <InstructorForm
        instructor={editingInstructor}
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
        mode={formMode}
      />

      {/* Course Assignment Dialog */}
      <Dialog open={showCourseAssignment} onOpenChange={setShowCourseAssignment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assign Course to {assigningInstructor?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {availableCourses.length === 0 ? (
              <p className="text-muted-foreground">No draft courses available for assignment.</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Select a course to assign to this instructor:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableCourses.map((course) => (
                    <div 
                      key={course._id} 
                      className="flex justify-between items-center p-3 border rounded hover:bg-muted cursor-pointer"
                      onClick={() => handleAssignCourse(course._id)}
                    >
                      <div>
                        <div className="font-medium">{course.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {course.category} • {course.level} • ₹{course.price}
                        </div>
                      </div>
                      <Badge variant="secondary">{course.status}</Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
