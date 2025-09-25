"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold text-balance">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Admin Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Alex Admin" defaultValue="Alex Admin" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="admin@yoursite.com" defaultValue="admin@yoursite.com" type="email" />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input id="avatar" placeholder="https://..." />
          </div>
          <div className="md:col-span-2">
            <Button>Save Profile</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="logo">Logo</Label>
            <Input id="logo" type="file" accept="image/*" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="color">Primary Color</Label>
            <Input id="color" type="color" defaultValue="#0ea5e9" />
          </div>
          <div className="md:col-span-2">
            <Button>Save Branding</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="current">Current Password</Label>
            <Input id="current" type="password" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new">New Password</Label>
            <Input id="new" type="password" />
          </div>
          <div className="flex items-center justify-between md:col-span-2">
            <div>
              <div className="font-medium">Two-Factor Authentication</div>
              <p className="text-sm text-muted-foreground">Enable 2FA for added security (placeholder)</p>
            </div>
            <Switch />
          </div>
          <div className="md:col-span-2">
            <Button>Update Security</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
