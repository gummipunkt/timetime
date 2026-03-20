'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { User, Mail, Building2, Clock, Calendar, Shield, Key } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  employeeNumber: string | null
  role: string
  department: { id: string; name: string } | null
  workTimeModel: { id: string; name: string } | null
  hireDate: string | null
  annualLeaveEntitlement: number
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Fehler',
        description: 'Die neuen Passwörter stimmen nicht überein.',
        variant: 'destructive',
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Fehler',
        description: 'Das neue Passwort muss mindestens 6 Zeichen lang sein.',
        variant: 'destructive',
      })
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (res.ok) {
        toast({
          title: 'Passwort geändert',
          description: 'Ihr Passwort wurde erfolgreich aktualisiert.',
        })
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        const error = await res.json()
        toast({
          title: 'Fehler',
          description: error.error || 'Passwort konnte nicht geändert werden.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to change password:', error)
      toast({
        title: 'Fehler',
        description: 'Ein Fehler ist aufgetreten.',
        variant: 'destructive',
      })
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Profil konnte nicht geladen werden.</p>
      </div>
    )
  }

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrator',
    SUPERVISOR: 'Vorgesetzter',
    USER: 'Mitarbeiter',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mein Profil</h1>
        <p className="text-muted-foreground">
          Ihre persönlichen Informationen und Einstellungen
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Persönliche Daten</CardTitle>
            </div>
            <CardDescription>Ihre grundlegenden Informationen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-xl font-bold text-white">
                {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{profile.firstName} {profile.lastName}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            
            <div className="grid gap-3 pt-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.email}</span>
              </div>
              {profile.employeeNumber && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Personalnummer: {profile.employeeNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">{roleLabels[profile.role] || profile.role}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Arbeitsdaten</CardTitle>
            </div>
            <CardDescription>Informationen zu Ihrer Beschäftigung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {profile.department && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Abteilung</span>
                  <span className="text-sm font-medium">{profile.department.name}</span>
                </div>
              )}
              {profile.workTimeModel && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Arbeitszeitmodell</span>
                  <span className="text-sm font-medium">{profile.workTimeModel.name}</span>
                </div>
              )}
              {profile.hireDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Eintrittsdatum</span>
                  <span className="text-sm font-medium">
                    {format(new Date(profile.hireDate), 'dd.MM.yyyy', { locale: de })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Urlaubsanspruch</span>
                <span className="text-sm font-medium">{profile.annualLeaveEntitlement} Tage/Jahr</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle>Passwort ändern</CardTitle>
            </div>
            <CardDescription>Aktualisieren Sie Ihr Anmeldepasswort</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" disabled={changingPassword}>
                {changingPassword ? 'Wird geändert...' : 'Passwort ändern'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
