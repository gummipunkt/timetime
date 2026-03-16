'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Settings, Building2, Clock, Bell, Shield } from 'lucide-react'

interface SystemSettings {
  companyName: string
  companyEmail: string
  defaultRegion: string
  timezone: string
  allowSelfRegistration: boolean
  requireApprovalForOvertime: boolean
  maxOvertimeHoursPerMonth: number
  minBreakMinutes: number
  autoClockOutAfterHours: number
  emailNotifications: boolean
}

const REGIONS = [
  { value: 'ALL', label: 'Alle Bundesländer' },
  { value: 'DE-BW', label: 'Baden-Württemberg' },
  { value: 'DE-BY', label: 'Bayern' },
  { value: 'DE-BE', label: 'Berlin' },
  { value: 'DE-BB', label: 'Brandenburg' },
  { value: 'DE-HB', label: 'Bremen' },
  { value: 'DE-HH', label: 'Hamburg' },
  { value: 'DE-HE', label: 'Hessen' },
  { value: 'DE-MV', label: 'Mecklenburg-Vorpommern' },
  { value: 'DE-NI', label: 'Niedersachsen' },
  { value: 'DE-NW', label: 'Nordrhein-Westfalen' },
  { value: 'DE-RP', label: 'Rheinland-Pfalz' },
  { value: 'DE-SL', label: 'Saarland' },
  { value: 'DE-SN', label: 'Sachsen' },
  { value: 'DE-ST', label: 'Sachsen-Anhalt' },
  { value: 'DE-SH', label: 'Schleswig-Holstein' },
  { value: 'DE-TH', label: 'Thüringen' },
]

const TIMEZONES = [
  { value: 'Europe/Berlin', label: 'Berlin (MEZ/MESZ)' },
  { value: 'Europe/Vienna', label: 'Wien (MEZ/MESZ)' },
  { value: 'Europe/Zurich', label: 'Zürich (MEZ/MESZ)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'UTC', label: 'UTC' },
]

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSettings()
    }
  }, [status])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        toast({
          title: 'Einstellungen gespeichert',
          description: 'Die Änderungen wurden erfolgreich übernommen.',
        })
      } else {
        toast({
          title: 'Fehler',
          description: 'Einstellungen konnten nicht gespeichert werden.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({
        title: 'Fehler',
        description: 'Ein Fehler ist aufgetreten.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Einstellungen konnten nicht geladen werden.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
          <p className="text-muted-foreground">
            System-Konfiguration und Unternehmenseinstellungen
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Speichern...' : 'Änderungen speichern'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Company Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Unternehmen</CardTitle>
            </div>
            <CardDescription>Grundlegende Unternehmensinformationen</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Firmenname</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">HR E-Mail</Label>
              <Input
                id="companyEmail"
                type="email"
                value={settings.companyEmail}
                onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultRegion">Standard-Region (für Feiertage)</Label>
              <Select 
                value={settings.defaultRegion || 'DE-BY'} 
                onValueChange={(value) => setSettings({ ...settings, defaultRegion: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map(region => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Zeitzone</Label>
              <Select 
                value={settings.timezone || 'Europe/Berlin'} 
                onValueChange={(value) => setSettings({ ...settings, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Time Tracking Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>Zeiterfassung</CardTitle>
            </div>
            <CardDescription>Regeln für die Arbeitszeiterfassung</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minBreakMinutes">Mindest-Pausenzeit (Minuten)</Label>
              <Input
                id="minBreakMinutes"
                type="number"
                min="0"
                max="120"
                value={settings.minBreakMinutes}
                onChange={(e) => setSettings({ ...settings, minBreakMinutes: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Pflichtpause nach 6h Arbeit (gesetzlich: 30 Min)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="autoClockOutAfterHours">Auto-Ausstempeln nach (Stunden)</Label>
              <Input
                id="autoClockOutAfterHours"
                type="number"
                min="1"
                max="24"
                value={settings.autoClockOutAfterHours}
                onChange={(e) => setSettings({ ...settings, autoClockOutAfterHours: parseInt(e.target.value) || 10 })}
              />
              <p className="text-xs text-muted-foreground">
                Automatisches Ausstempeln bei vergessenem Logout
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxOvertimeHoursPerMonth">Max. Überstunden pro Monat</Label>
              <Input
                id="maxOvertimeHoursPerMonth"
                type="number"
                min="0"
                max="100"
                value={settings.maxOvertimeHoursPerMonth}
                onChange={(e) => setSettings({ ...settings, maxOvertimeHoursPerMonth: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Warnung bei Überschreitung
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="requireApprovalForOvertime"
                checked={settings.requireApprovalForOvertime}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, requireApprovalForOvertime: checked as boolean })
                }
              />
              <Label htmlFor="requireApprovalForOvertime" className="font-normal">
                Überstunden müssen genehmigt werden
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Sicherheit</CardTitle>
            </div>
            <CardDescription>Zugriffs- und Registrierungseinstellungen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowSelfRegistration"
                checked={settings.allowSelfRegistration}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, allowSelfRegistration: checked as boolean })
                }
              />
              <div>
                <Label htmlFor="allowSelfRegistration" className="font-normal">
                  Selbstregistrierung erlauben
                </Label>
                <p className="text-xs text-muted-foreground">
                  Neue Benutzer können sich selbst registrieren (erfordert Admin-Freigabe)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Benachrichtigungen</CardTitle>
            </div>
            <CardDescription>E-Mail und Push-Benachrichtigungen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, emailNotifications: checked as boolean })
                }
              />
              <div>
                <Label htmlFor="emailNotifications" className="font-normal">
                  E-Mail-Benachrichtigungen aktivieren
                </Label>
                <p className="text-xs text-muted-foreground">
                  Benachrichtigungen bei Urlaubsanträgen, Genehmigungen etc.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
