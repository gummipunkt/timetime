'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Clock, Plus, Pencil, Trash2, Users, Star } from 'lucide-react'
import { useLocale } from 'next-intl'

interface WorkModel {
  id: string
  name: string
  description: string | null
  weeklyMinutes: number
  isDefault: boolean
  userCount: number
}

interface WorkModelForm {
  name: string
  description: string
  mondayMinutes: number
  tuesdayMinutes: number
  wednesdayMinutes: number
  thursdayMinutes: number
  fridayMinutes: number
  saturdayMinutes: number
  sundayMinutes: number
  isDefault: boolean
}

const defaultFormData: WorkModelForm = {
  name: '',
  description: '',
  mondayMinutes: 480,
  tuesdayMinutes: 480,
  wednesdayMinutes: 480,
  thursdayMinutes: 480,
  fridayMinutes: 480,
  saturdayMinutes: 0,
  sundayMinutes: 0,
  isDefault: false,
}

function minutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60)
}

export default function WorkModelsPage() {
  const locale = useLocale()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [workModels, setWorkModels] = useState<WorkModel[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<WorkModel | null>(null)
  const [formData, setFormData] = useState<WorkModelForm>(defaultFormData)
  const [submitting, setSubmitting] = useState(false)

  const fetchWorkModels = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/work-models')
      if (res.ok) {
        const data = await res.json()
        setWorkModels(data.workTimeModels || [])
      }
    } catch (error) {
      console.error('Failed to fetch work models:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchWorkModels()
    }
  }, [status, fetchWorkModels])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    redirect(`/${locale}/dashboard`)
  }

  const openCreateDialog = () => {
    setEditingModel(null)
    setFormData(defaultFormData)
    setDialogOpen(true)
  }

  const openEditDialog = async (model: WorkModel) => {
    setEditingModel(model)
    // Fetch full model details
    try {
      const res = await fetch(`/api/admin/work-models/${model.id}`)
      if (res.ok) {
        const data = await res.json()
        const m = data.workTimeModel
        setFormData({
          name: m.name,
          description: m.description || '',
          mondayMinutes: m.mondayMinutes,
          tuesdayMinutes: m.tuesdayMinutes,
          wednesdayMinutes: m.wednesdayMinutes,
          thursdayMinutes: m.thursdayMinutes,
          fridayMinutes: m.fridayMinutes,
          saturdayMinutes: m.saturdayMinutes,
          sundayMinutes: m.sundayMinutes,
          isDefault: m.isDefault,
        })
      }
    } catch (error) {
      console.error('Failed to fetch model details:', error)
      setFormData({
        ...defaultFormData,
        name: model.name,
        description: model.description || '',
        isDefault: model.isDefault,
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingModel 
        ? `/api/admin/work-models/${editingModel.id}`
        : '/api/admin/work-models'
      
      const res = await fetch(url, {
        method: editingModel ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast({
          title: editingModel ? 'Modell aktualisiert' : 'Modell erstellt',
          description: `${formData.name} wurde erfolgreich ${editingModel ? 'aktualisiert' : 'erstellt'}.`,
        })
        setDialogOpen(false)
        fetchWorkModels()
      } else {
        const error = await res.json()
        toast({
          title: 'Fehler',
          description: error.error || 'Ein Fehler ist aufgetreten.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to save work model:', error)
      toast({
        title: 'Fehler',
        description: 'Modell konnte nicht gespeichert werden.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (model: WorkModel) => {
    if (model.userCount > 0) {
      toast({
        title: 'Löschen nicht möglich',
        description: `${model.name} wird noch von ${model.userCount} Mitarbeitern verwendet.`,
        variant: 'destructive',
      })
      return
    }

    if (model.isDefault) {
      toast({
        title: 'Löschen nicht möglich',
        description: 'Das Standard-Modell kann nicht gelöscht werden.',
        variant: 'destructive',
      })
      return
    }

    if (!confirm(`Möchten Sie "${model.name}" wirklich löschen?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/work-models/${model.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({
          title: 'Modell gelöscht',
          description: `${model.name} wurde erfolgreich gelöscht.`,
        })
        fetchWorkModels()
      } else {
        const error = await res.json()
        toast({
          title: 'Fehler',
          description: error.error || 'Ein Fehler ist aufgetreten.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to delete work model:', error)
      toast({
        title: 'Fehler',
        description: 'Modell konnte nicht gelöscht werden.',
        variant: 'destructive',
      })
    }
  }

  const updateDayMinutes = (day: keyof WorkModelForm, hours: number) => {
    setFormData(prev => ({
      ...prev,
      [day]: hoursToMinutes(hours)
    }))
  }

  const weeklyTotal = formData.mondayMinutes + formData.tuesdayMinutes + 
    formData.wednesdayMinutes + formData.thursdayMinutes + 
    formData.fridayMinutes + formData.saturdayMinutes + formData.sundayMinutes

  const days = [
    { key: 'mondayMinutes' as const, label: 'Montag' },
    { key: 'tuesdayMinutes' as const, label: 'Dienstag' },
    { key: 'wednesdayMinutes' as const, label: 'Mittwoch' },
    { key: 'thursdayMinutes' as const, label: 'Donnerstag' },
    { key: 'fridayMinutes' as const, label: 'Freitag' },
    { key: 'saturdayMinutes' as const, label: 'Samstag' },
    { key: 'sundayMinutes' as const, label: 'Sonntag' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Arbeitszeitmodelle</h1>
          <p className="text-muted-foreground">
            Verwalten Sie die verfügbaren Arbeitszeitmodelle
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Neues Modell
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingModel ? 'Modell bearbeiten' : 'Neues Arbeitszeitmodell'}
                </DialogTitle>
                <DialogDescription>
                  {editingModel 
                    ? 'Ändern Sie die Einstellungen des Arbeitszeitmodells.' 
                    : 'Erstellen Sie ein neues Arbeitszeitmodell.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="z.B. Vollzeit 40h"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Beschreibung</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optionale Beschreibung"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Tägliche Arbeitszeit (in Stunden)</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {days.map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{label.slice(0, 2)}</Label>
                        <Input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          value={formData[key] / 60}
                          onChange={(e) => updateDayMinutes(key, parseFloat(e.target.value) || 0)}
                          className="text-center"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Wochensumme: <strong>{minutesToHours(weeklyTotal)}</strong> ({(weeklyTotal / 60).toFixed(1)} Stunden)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isDefault" className="text-sm font-normal">
                    Als Standard für neue Mitarbeiter setzen
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Speichern...' : 'Speichern'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : workModels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Arbeitszeitmodelle</h3>
            <p className="text-muted-foreground text-center mt-1">
              Erstellen Sie Ihr erstes Arbeitszeitmodell.
            </p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Erstes Modell erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workModels.map((model) => (
            <Card key={model.id} className="relative group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                        {model.isDefault && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      {model.description && (
                        <CardDescription className="mt-1">
                          {model.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {minutesToHours(model.weeklyMinutes)}/Woche
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {model.userCount}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(model)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(model)}
                      disabled={model.userCount > 0 || model.isDefault}
                      className={model.userCount > 0 || model.isDefault ? 'opacity-50 cursor-not-allowed' : 'text-destructive hover:text-destructive'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
