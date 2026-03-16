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
import { Building2, Plus, Pencil, Trash2, Users } from 'lucide-react'

interface Department {
  id: string
  name: string
  description: string | null
  color: string | null
  memberCount: number
  head: {
    id: string
    name: string
  } | null
}

export default function DepartmentsPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/departments')
      if (res.ok) {
        const data = await res.json()
        // API returns { success: true, departments: [...] }
        setDepartments(data.departments || [])
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDepartments()
    }
  }, [status, fetchDepartments])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const openCreateDialog = () => {
    setEditingDepartment(null)
    setFormData({ name: '', description: '' })
    setDialogOpen(true)
  }

  const openEditDialog = (dept: Department) => {
    setEditingDepartment(dept)
    setFormData({ name: dept.name, description: dept.description || '' })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingDepartment 
        ? `/api/admin/departments/${editingDepartment.id}`
        : '/api/admin/departments'
      
      const res = await fetch(url, {
        method: editingDepartment ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast({
          title: editingDepartment ? 'Abteilung aktualisiert' : 'Abteilung erstellt',
          description: `${formData.name} wurde erfolgreich ${editingDepartment ? 'aktualisiert' : 'erstellt'}.`,
        })
        setDialogOpen(false)
        fetchDepartments()
      } else {
        const error = await res.json()
        toast({
          title: 'Fehler',
          description: error.error || 'Ein Fehler ist aufgetreten.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to save department:', error)
      toast({
        title: 'Fehler',
        description: 'Abteilung konnte nicht gespeichert werden.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (dept: Department) => {
    if (dept.memberCount > 0) {
      toast({
        title: 'Löschen nicht möglich',
        description: `${dept.name} hat noch ${dept.memberCount} Mitarbeiter zugewiesen.`,
        variant: 'destructive',
      })
      return
    }

    if (!confirm(`Möchten Sie "${dept.name}" wirklich löschen?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/departments/${dept.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({
          title: 'Abteilung gelöscht',
          description: `${dept.name} wurde erfolgreich gelöscht.`,
        })
        fetchDepartments()
      } else {
        const error = await res.json()
        toast({
          title: 'Fehler',
          description: error.error || 'Ein Fehler ist aufgetreten.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to delete department:', error)
      toast({
        title: 'Fehler',
        description: 'Abteilung konnte nicht gelöscht werden.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Abteilungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie die Organisationsstruktur
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Neue Abteilung
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingDepartment ? 'Abteilung bearbeiten' : 'Neue Abteilung'}
                </DialogTitle>
                <DialogDescription>
                  {editingDepartment 
                    ? 'Ändern Sie die Abteilungsdaten.' 
                    : 'Erstellen Sie eine neue Abteilung.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. IT-Abteilung"
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
      ) : departments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Abteilungen</h3>
            <p className="text-muted-foreground text-center mt-1">
              Erstellen Sie Ihre erste Abteilung, um die Organisationsstruktur aufzubauen.
            </p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Erste Abteilung erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id} className="relative group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{dept.name}</CardTitle>
                      {dept.description && (
                        <CardDescription className="mt-1">
                          {dept.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">
                      {dept.memberCount} {dept.memberCount === 1 ? 'Mitarbeiter' : 'Mitarbeiter'}
                    </Badge>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(dept)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(dept)}
                      disabled={dept.memberCount > 0}
                      className={dept.memberCount > 0 ? 'opacity-50 cursor-not-allowed' : 'text-destructive hover:text-destructive'}
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
