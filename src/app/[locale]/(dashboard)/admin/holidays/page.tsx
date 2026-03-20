'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLocale } from 'next-intl'

interface Holiday {
  id: string
  name: string
  date: string
  year: number
  region: string
  isRecurring: boolean
  isHalfDay: boolean
}

const REGIONS = [
  { value: 'ALL', label: 'Bundesweit' },
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

const defaultFormData = {
  name: '',
  date: '',
  region: 'ALL',
  isRecurring: false,
  isHalfDay: false,
}

export default function HolidaysPage() {
  const locale = useLocale()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)
  const [formData, setFormData] = useState(defaultFormData)
  const [submitting, setSubmitting] = useState(false)

  const fetchHolidays = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/holidays?year=${year}`)
      if (res.ok) {
        const data = await res.json()
        setHolidays(data.holidays || [])
      }
    } catch (error) {
      console.error('Failed to fetch holidays:', error)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchHolidays()
    }
  }, [status, fetchHolidays])

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
    setEditingHoliday(null)
    setFormData({ ...defaultFormData, date: `${year}-01-01` })
    setDialogOpen(true)
  }

  const openEditDialog = (holiday: Holiday) => {
    setEditingHoliday(holiday)
    setFormData({
      name: holiday.name,
      date: format(new Date(holiday.date), 'yyyy-MM-dd'),
      region: holiday.region,
      isRecurring: holiday.isRecurring,
      isHalfDay: holiday.isHalfDay,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingHoliday 
        ? `/api/admin/holidays/${editingHoliday.id}`
        : '/api/admin/holidays'
      
      const res = await fetch(url, {
        method: editingHoliday ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast({
          title: editingHoliday ? 'Feiertag aktualisiert' : 'Feiertag erstellt',
          description: `${formData.name} wurde erfolgreich ${editingHoliday ? 'aktualisiert' : 'erstellt'}.`,
        })
        setDialogOpen(false)
        fetchHolidays()
      } else {
        const error = await res.json()
        toast({
          title: 'Fehler',
          description: error.error || 'Ein Fehler ist aufgetreten.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to save holiday:', error)
      toast({
        title: 'Fehler',
        description: 'Feiertag konnte nicht gespeichert werden.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (holiday: Holiday) => {
    if (!confirm(`Möchten Sie "${holiday.name}" wirklich löschen?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/holidays/${holiday.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({
          title: 'Feiertag gelöscht',
          description: `${holiday.name} wurde erfolgreich gelöscht.`,
        })
        fetchHolidays()
      } else {
        const error = await res.json()
        toast({
          title: 'Fehler',
          description: error.error || 'Ein Fehler ist aufgetreten.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to delete holiday:', error)
      toast({
        title: 'Fehler',
        description: 'Feiertag konnte nicht gelöscht werden.',
        variant: 'destructive',
      })
    }
  }

  const getRegionLabel = (regionCode: string) => {
    return REGIONS.find(r => r.value === regionCode)?.label || regionCode
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feiertage</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Feiertage für die Arbeitszeitberechnung
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Feiertag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingHoliday ? 'Feiertag bearbeiten' : 'Neuer Feiertag'}
                </DialogTitle>
                <DialogDescription>
                  {editingHoliday 
                    ? 'Ändern Sie die Feiertags-Daten.' 
                    : 'Erstellen Sie einen neuen Feiertag.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. Weihnachten"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Datum *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select 
                    value={formData.region} 
                    onValueChange={(value) => setFormData({ ...formData, region: value })}
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
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, isRecurring: checked as boolean })
                      }
                    />
                    <Label htmlFor="isRecurring" className="text-sm font-normal">
                      Jährlich wiederkehrend
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isHalfDay"
                      checked={formData.isHalfDay}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, isHalfDay: checked as boolean })
                      }
                    />
                    <Label htmlFor="isHalfDay" className="text-sm font-normal">
                      Halber Tag
                    </Label>
                  </div>
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

      {/* Year Navigation */}
      <Card>
        <CardContent className="flex items-center justify-center gap-4 py-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setYear(y => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-2xl font-bold w-20 text-center">{year}</span>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setYear(y => y + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : holidays.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Feiertage für {year}</h3>
            <p className="text-muted-foreground text-center mt-1">
              Erstellen Sie Feiertage für dieses Jahr.
            </p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Feiertag hinzufügen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Feiertage {year}</CardTitle>
            <CardDescription>{holidays.length} Feiertage eingetragen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {holidays.map((holiday) => (
                <div 
                  key={holiday.id} 
                  className="flex items-center justify-between py-3 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm text-muted-foreground">
                      {format(new Date(holiday.date), 'dd.MM.yyyy', { locale: de })}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{holiday.name}</span>
                      {holiday.isHalfDay && (
                        <Badge variant="outline" className="text-xs">½ Tag</Badge>
                      )}
                      {holiday.isRecurring && (
                        <Badge variant="secondary" className="text-xs">Jährlich</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getRegionLabel(holiday.region)}</Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(holiday)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(holiday)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
