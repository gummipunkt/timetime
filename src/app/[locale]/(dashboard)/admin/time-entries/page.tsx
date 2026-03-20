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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  Clock, 
  Plus, 
  Pencil, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  LogIn,
  LogOut,
  Coffee,
  Filter,
  User,
  AlertTriangle
} from 'lucide-react'
import { TimeEntryType } from '@prisma/client'
import { useLocale } from 'next-intl'

interface TimeEntry {
  id: string
  userId: string
  user: { id: string; name: string; email: string }
  type: TimeEntryType
  timestamp: string
  isManual: boolean
  note: string | null
  correctedBy: { id: string; name: string } | null
  correctionNote: string | null
  originalTimestamp: string | null
}

interface UserOption {
  id: string
  name: string
  email: string
}

const typeLabels: Record<TimeEntryType, string> = {
  CLOCK_IN: 'Kommen',
  CLOCK_OUT: 'Gehen',
  BREAK_START: 'Pause Start',
  BREAK_END: 'Pause Ende',
}

const typeColors: Record<TimeEntryType, string> = {
  CLOCK_IN: 'bg-green-100 text-green-800',
  CLOCK_OUT: 'bg-red-100 text-red-800',
  BREAK_START: 'bg-yellow-100 text-yellow-800',
  BREAK_END: 'bg-blue-100 text-blue-800',
}

export default function TimeEntriesPage() {
  const locale = useLocale()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const limit = 20

  // Filters
  const [filterUserId, setFilterUserId] = useState<string>('')
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [formData, setFormData] = useState({
    userId: '',
    type: 'CLOCK_IN' as TimeEntryType,
    date: '',
    time: '',
    note: '',
    correctionNote: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', limit.toString())
      params.set('offset', (page * limit).toString())
      if (filterUserId && filterUserId !== 'all') params.set('userId', filterUserId)
      if (filterDateFrom) params.set('dateFrom', filterDateFrom)
      if (filterDateTo) params.set('dateTo', filterDateTo)

      const res = await fetch(`/api/admin/time-entries?${params}`)
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    } finally {
      setLoading(false)
    }
  }, [page, filterUserId, filterDateFrom, filterDateTo])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users?.map((u: any) => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
        })) || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEntries()
      fetchUsers()
    }
  }, [status, fetchEntries])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
    redirect(`/${locale}/dashboard`)
  }

  const openCreateDialog = () => {
    setEditingEntry(null)
    const now = new Date()
    setFormData({
      userId: '',
      type: 'CLOCK_IN',
      date: format(now, 'yyyy-MM-dd'),
      time: format(now, 'HH:mm'),
      note: '',
      correctionNote: '',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (entry: TimeEntry) => {
    setEditingEntry(entry)
    const timestamp = new Date(entry.timestamp)
    setFormData({
      userId: entry.userId,
      type: entry.type,
      date: format(timestamp, 'yyyy-MM-dd'),
      time: format(timestamp, 'HH:mm'),
      note: entry.note || '',
      correctionNote: '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const timestamp = new Date(`${formData.date}T${formData.time}`)
      
      const url = editingEntry 
        ? `/api/admin/time-entries/${editingEntry.id}`
        : '/api/admin/time-entries'
      
      const res = await fetch(url, {
        method: editingEntry ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: formData.userId,
          type: formData.type,
          timestamp: timestamp.toISOString(),
          note: formData.note || null,
          correctionNote: formData.correctionNote || null,
        }),
      })

      if (res.ok) {
        toast({
          title: editingEntry ? 'Eintrag korrigiert' : 'Eintrag erstellt',
          description: editingEntry 
            ? 'Der Zeiteintrag wurde erfolgreich korrigiert.'
            : 'Der Zeiteintrag wurde erfolgreich erstellt.',
        })
        setDialogOpen(false)
        fetchEntries()
      } else {
        const error = await res.json()
        toast({
          title: 'Fehler',
          description: error.error || 'Ein Fehler ist aufgetreten.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to save entry:', error)
      toast({
        title: 'Fehler',
        description: 'Eintrag konnte nicht gespeichert werden.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (entry: TimeEntry) => {
    if (!confirm(`Möchten Sie diesen Eintrag wirklich löschen?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/time-entries/${entry.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({
          title: 'Eintrag gelöscht',
          description: 'Der Zeiteintrag wurde erfolgreich gelöscht.',
        })
        fetchEntries()
      } else {
        const error = await res.json()
        toast({
          title: 'Fehler',
          description: error.error || 'Ein Fehler ist aufgetreten.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to delete entry:', error)
      toast({
        title: 'Fehler',
        description: 'Eintrag konnte nicht gelöscht werden.',
        variant: 'destructive',
      })
    }
  }

  const getTypeIcon = (type: TimeEntryType) => {
    switch (type) {
      case 'CLOCK_IN': return <LogIn className="w-4 h-4" />
      case 'CLOCK_OUT': return <LogOut className="w-4 h-4" />
      case 'BREAK_START': return <Coffee className="w-4 h-4" />
      case 'BREAK_END': return <Coffee className="w-4 h-4" />
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zeiteinträge verwalten</h1>
          <p className="text-muted-foreground">
            Stempelzeiten von Mitarbeitern einsehen und korrigieren
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Manueller Eintrag
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Mitarbeiter</Label>
                <Select value={filterUserId || 'all'} onValueChange={(v) => { setFilterUserId(v === 'all' ? '' : v); setPage(0); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Mitarbeiter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Von</Label>
                <Input 
                  type="date" 
                  value={filterDateFrom}
                  onChange={(e) => { setFilterDateFrom(e.target.value); setPage(0); }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bis</Label>
                <Input 
                  type="date" 
                  value={filterDateTo}
                  onChange={(e) => { setFilterDateTo(e.target.value); setPage(0); }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Zeiteinträge
            <Badge variant="secondary">{total} Einträge</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Keine Einträge gefunden.</p>
            </div>
          ) : (
            <>
              <div className="divide-y">
                {entries.map((entry) => (
                  <div key={entry.id} className="p-4 hover:bg-muted/30 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        {getTypeIcon(entry.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={typeColors[entry.type]}>
                            {typeLabels[entry.type]}
                          </Badge>
                          <span className="text-sm font-medium">{entry.user.name}</span>
                          {entry.isManual && (
                            <Badge variant="outline" className="text-xs">Manuell</Badge>
                          )}
                          {entry.correctedBy && (
                            <Badge variant="outline" className="text-xs text-orange-600">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Korrigiert
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{format(new Date(entry.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
                          {entry.note && <span>• {entry.note}</span>}
                          {entry.correctedBy && (
                            <span>• Korrigiert von {entry.correctedBy.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(entry)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {session.user.role === 'ADMIN' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(entry)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Zeige {page * limit + 1} - {Math.min((page + 1) * limit, total)} von {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">Seite {page + 1} von {totalPages || 1}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Zeiteintrag korrigieren' : 'Manueller Zeiteintrag'}
              </DialogTitle>
              <DialogDescription>
                {editingEntry 
                  ? 'Korrigieren Sie die Stempelzeit.'
                  : 'Erstellen Sie einen manuellen Zeiteintrag.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!editingEntry && (
                <div className="space-y-2">
                  <Label>Mitarbeiter *</Label>
                  <Select 
                    value={formData.userId || 'select'} 
                    onValueChange={(v) => setFormData({ ...formData, userId: v === 'select' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mitarbeiter auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select" disabled>Mitarbeiter auswählen</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {editingEntry && (
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{editingEntry.user.name}</span>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Typ *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({ ...formData, type: v as TimeEntryType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLOCK_IN">Kommen</SelectItem>
                    <SelectItem value="CLOCK_OUT">Gehen</SelectItem>
                    <SelectItem value="BREAK_START">Pause Start</SelectItem>
                    <SelectItem value="BREAK_END">Pause Ende</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Datum *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Uhrzeit *</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notiz</Label>
                <Input
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Optionale Notiz"
                />
              </div>
              {editingEntry && (
                <div className="space-y-2">
                  <Label>Korrekturgrund</Label>
                  <Input
                    value={formData.correctionNote}
                    onChange={(e) => setFormData({ ...formData, correctionNote: e.target.value })}
                    placeholder="Grund für die Korrektur"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={submitting || (!editingEntry && !formData.userId)}>
                {submitting ? 'Speichern...' : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
