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
import { usersAPI, User, UserDetail } from "@/lib/api"
import { Loader2, Eye, Shield, ShieldOff, Trash2, Download, RefreshCw } from "lucide-react"

export function UserTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [userDetailLoading, setUserDetailLoading] = useState(false)
  
  // Filters and pagination
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | "Active" | "Blocked">("all")
  const [role, setRole] = useState<"all" | "user" | "admin" | "instructor">("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Real-time updates
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await usersAPI.getAllUsers({
        page,
        limit: 10,
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
        role: role !== 'all' ? role : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      
      console.log('Users API Response:', response) // Debug logging
      
      // Handle different response structures
      let users = []
      let totalPages = 1
      
      if (response) {
        // Check if response has data property (nested structure)
        if (response.data) {
          users = response.data.users || []
          totalPages = response.data.pagination?.pages || 1
        } 
        // Direct structure
        else if (response.users) {
          users = response.users || []
          totalPages = response.pagination?.pages || 1
        }
        // Fallback: assume response is the users array itself
        else if (Array.isArray(response)) {
          users = response
          totalPages = 1
        }
      }
      
      setUsers(users)
      setTotalPages(totalPages)
      setLastUpdated(new Date())
      
      console.log(`Loaded ${users.length} users, ${totalPages} total pages`) // Debug logging
      
    } catch (error: any) {
      console.error('Fetch users error:', error) // Debug logging
      toast.error(error.message || 'Failed to fetch users')
      // Set empty state on error
      setUsers([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, search, status, role])

  // Set client-side flag to prevent hydration errors
  useEffect(() => {
    setIsClient(true)
    setLastUpdated(new Date())
  }, [])

  useEffect(() => {
    if (isClient) {
      fetchUsers()
    }
  }, [fetchUsers, isClient])

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    if (!isClient) return
    
    const interval = setInterval(fetchUsers, 30000)
    return () => clearInterval(interval)
  }, [fetchUsers, isClient])

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      setUpdating(userId)
      await usersAPI.toggleUserStatus(userId)
      await fetchUsers() // Refresh the list
      toast.success(`User ${currentStatus === 'Active' ? 'blocked' : 'activated'} successfully`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user status')
    } finally {
      setUpdating(null)
    }
  }

  const handleViewUser = async (userId: string) => {
    try {
      setUserDetailLoading(true)
      const userDetail = await usersAPI.getUserById(userId)
      setSelectedUser(userDetail)
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch user details')
    } finally {
      setUserDetailLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      setUpdating(userId)
      await usersAPI.deleteUser(userId)
      await fetchUsers()
      toast.success('User deleted successfully')
    } catch (error: any) {
      if (error.message.includes('active enrollments')) {
        const forceDelete = confirm(error.message + '\n\nDo you want to force delete this user?')
        if (forceDelete) {
          try {
            await usersAPI.deleteUser(userId, true)
            await fetchUsers()
            toast.success('User force deleted successfully')
          } catch (err: any) {
            toast.error(err.message || 'Failed to delete user')
          }
        }
      } else {
        toast.error(error.message || 'Failed to delete user')
      }
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>
      case 'Blocked':
        return <Badge variant="destructive">Blocked</Badge>
      case 'Deleted':
        return <Badge variant="secondary">Deleted</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">Admin</Badge>
      case 'instructor':
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Instructor</Badge>
      default:
        return <Badge variant="outline">User</Badge>
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              User Management
              <Badge variant="outline" className="text-xs">
                {users?.length || 0} users
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {isClient && lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full gap-2 sm:max-w-md">
              <Input 
                placeholder="Search users by name or email" 
                value={search} 
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1) // Reset to first page on search
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
                </SelectContent>
              </Select>
              <Select value={role} onValueChange={(v: any) => {
                setRole(v)
                setPage(1)
              }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Enrollments</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <div className="text-sm text-muted-foreground">Loading users...</div>
                    </TableCell>
                  </TableRow>
                ) : (users?.length || 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-sm text-muted-foreground">No users found.</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  (users || []).map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Joined {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{user.email}</div>
                        {user.phone && (
                          <div className="text-xs text-muted-foreground">{user.phone}</div>
                        )}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-medium">
                            {user.stats?.enrollmentCount || 0} courses
                          </div>
                          {user.stats?.completedCount !== undefined && (
                            <div className="text-xs text-muted-foreground">
                              {user.stats.completedCount} completed ({user.stats.completionRate}%)
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          ₹{user.stats?.totalSpent || 0}
                        </div>
                        {user.stats?.cartItemsCount && user.stats.cartItemsCount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {user.stats.cartItemsCount} in cart
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewUser(user._id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>User Details</DialogTitle>
                              </DialogHeader>
                              {userDetailLoading ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                              ) : selectedUser ? (
                                <div className="grid gap-4">
                                  <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                      <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                                      <AvatarFallback className="text-lg">
                                        {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                                      <p className="text-muted-foreground">{selectedUser.email}</p>
                                      <div className="flex gap-2 mt-1">
                                        {getRoleBadge(selectedUser.role)}
                                        {getStatusBadge(selectedUser.status)}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                      <div className="text-2xl font-bold">{selectedUser.stats.totalEnrollments}</div>
                                      <div className="text-sm text-muted-foreground">Total Courses</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                      <div className="text-2xl font-bold">{selectedUser.stats.completedCourses}</div>
                                      <div className="text-sm text-muted-foreground">Completed</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                      <div className="text-2xl font-bold">{selectedUser.stats.averageProgress}%</div>
                                      <div className="text-sm text-muted-foreground">Avg Progress</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                      <div className="text-2xl font-bold">₹{selectedUser.stats.totalSpent}</div>
                                      <div className="text-sm text-muted-foreground">Total Spent</div>
                                    </div>
                                  </div>
                                  
                                  {selectedUser.enrollments.length > 0 && (
                                    <div>
                                      <h4 className="font-medium mb-2">Recent Enrollments</h4>
                                      <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {selectedUser.enrollments.slice(0, 5).map((enrollment) => (
                                          <div key={enrollment._id} className="flex justify-between items-center p-2 bg-muted rounded">
                                            <div>
                                              <div className="font-medium text-sm">{enrollment.course.title}</div>
                                              <div className="text-xs text-muted-foreground">
                                                {enrollment.status} • {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <div className="font-medium text-sm">₹{enrollment.course.price}</div>
                                              {enrollment.progress && (
                                                <div className="text-xs text-muted-foreground">
                                                  {enrollment.progress.percentage}% complete
                                                </div>
                                              )}
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
                          
                          {user.role !== 'admin' && (
                            <>
                              <Button 
                                size="sm" 
                                variant={user.status === "Blocked" ? "default" : "destructive"}
                                className="h-8 w-8 p-0"
                                onClick={() => handleToggleStatus(user._id, user.status)}
                                disabled={updating === user._id}
                              >
                                {updating === user._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : user.status === "Blocked" ? (
                                  <Shield className="h-4 w-4" />
                                ) : (
                                  <ShieldOff className="h-4 w-4" />
                                )}
                              </Button>
                              
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteUser(user._id, user.name)}
                                disabled={updating === user._id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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
    </>
  )
}
