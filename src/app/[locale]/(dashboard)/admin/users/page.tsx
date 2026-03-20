"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  Search,
  Loader2,
  MoreHorizontal,
  Mail,
  Shield,
  Building2,
  Pencil,
  Key,
  UserX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Role } from "@prisma/client";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeNumber: string | null;
  role: Role;
  isActive: boolean;
  department: { id: string; name: string } | null;
  supervisor: { id: string; name: string } | null;
  delegate?: { id: string; name: string } | null;
  workTimeModel: { id: string; name: string } | null;
  annualLeaveEntitlement: number;
  hireDate: string;
}

interface Department {
  id: string;
  name: string;
}

interface WorkTimeModel {
  id: string;
  name: string;
}

const roleColors: Record<Role, string> = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  SUPERVISOR: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  USER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  SUPERVISOR: "Supervisor",
  USER: "Mitarbeiter",
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workModels, setWorkModels] = useState<WorkTimeModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  // Create User Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "USER" as Role,
    departmentId: "",
    supervisorId: "",
    delegateId: "",
    workTimeModelId: "",
    annualLeaveEntitlement: 30,
  });

  // Password Reset Dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchData();
  }, [includeInactive, searchTerm]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (includeInactive) params.set("includeInactive", "true");
      if (searchTerm) params.set("search", searchTerm);

      const [usersRes, deptsRes, modelsRes] = await Promise.all([
        fetch(`/api/admin/users?${params}`),
        fetch("/api/admin/departments"),
        fetch("/api/admin/work-models"),
      ]);

      const usersData = await usersRes.json();
      const deptsData = await deptsRes.json();
      const modelsData = await modelsRes.json();

      if (usersData.success) setUsers(usersData.users);
      if (deptsData.success) setDepartments(deptsData.departments);
      if (modelsData.success) setWorkModels(modelsData.workTimeModels);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newUser,
          departmentId: newUser.departmentId || undefined,
          supervisorId: newUser.supervisorId || undefined,
          delegateId: newUser.delegateId || undefined,
          workTimeModelId: newUser.workTimeModelId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Erstellen");
      }

      toast({ title: "Erfolg", description: "Benutzer wurde erstellt." });
      setCreateDialogOpen(false);
      setNewUser({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "USER",
        departmentId: "",
        supervisorId: "",
        delegateId: "",
        workTimeModelId: "",
        annualLeaveEntitlement: 30,
      });
      fetchData();
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUserId || !newPassword) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUserId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({ title: "Erfolg", description: "Passwort wurde zurückgesetzt." });
      setPasswordDialogOpen(false);
      setSelectedUserId(null);
      setNewPassword("");
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Fehler",
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm("Möchten Sie diesen Benutzer wirklich deaktivieren?")) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({ title: "Erfolg", description: "Benutzer wurde deaktiviert." });
      fetchData();
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Fehler",
        variant: "destructive",
      });
    }
  };

  const supervisors = users.filter(
    (u) => u.role === "ADMIN" || u.role === "SUPERVISOR"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Benutzerverwaltung</h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie Mitarbeiter, Rollen und Berechtigungen.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Neuer Benutzer
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Suchen nach Name, E-Mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeInactive"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="includeInactive" className="text-sm">
                Inaktive anzeigen
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Benutzer ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">E-Mail</th>
                    <th className="text-left py-3 px-4 font-medium">Rolle</th>
                    <th className="text-left py-3 px-4 font-medium">Abteilung</th>
                    <th className="text-left py-3 px-4 font-medium">Vorgesetzter</th>
                    <th className="text-left py-3 px-4 font-medium">Vertreter</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-right py-3 px-4 font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            {user.employeeNumber && (
                              <p className="text-xs text-muted-foreground">
                                #{user.employeeNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={cn("text-xs", roleColors[user.role])}>
                          {roleLabels[user.role]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {user.department?.name || "-"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {user.supervisor?.name || "-"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {user.delegate?.name || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={user.isActive ? "default" : "secondary"}
                          className={cn(
                            "text-xs",
                            user.isActive
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {user.isActive ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Pencil className="w-4 h-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setPasswordDialogOpen(true);
                              }}
                            >
                              <Key className="w-4 h-4 mr-2" />
                              Passwort zurücksetzen
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.isActive && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeactivate(user.id)}
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Deaktivieren
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neuer Benutzer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vorname *</Label>
                <Input
                  value={newUser.firstName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Nachname *</Label>
                <Input
                  value={newUser.lastName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>E-Mail *</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Passwort *</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rolle *</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(v) =>
                    setNewUser({ ...newUser, role: v as Role })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Mitarbeiter</SelectItem>
                    <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Urlaubstage</Label>
                <Input
                  type="number"
                  value={newUser.annualLeaveEntitlement}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      annualLeaveEntitlement: parseInt(e.target.value) || 30,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Abteilung</Label>
              <Select
                value={newUser.departmentId}
                onValueChange={(v) =>
                  setNewUser({ ...newUser, departmentId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Keine Abteilung" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vorgesetzter</Label>
              <Select
                value={newUser.supervisorId}
                onValueChange={(v) =>
                  setNewUser({ ...newUser, supervisorId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kein Vorgesetzter" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vertreter</Label>
              <Select
                value={newUser.delegateId}
                onValueChange={(v) =>
                  setNewUser({ ...newUser, delegateId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kein Vertreter" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Arbeitszeitmodell</Label>
              <Select
                value={newUser.workTimeModelId}
                onValueChange={(v) =>
                  setNewUser({ ...newUser, workTimeModelId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Standard" />
                </SelectTrigger>
                <SelectContent>
                  {workModels.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Abbrechen
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Passwort zurücksetzen</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Neues Passwort</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={handleResetPassword} disabled={!newPassword}>
              <Key className="w-4 h-4 mr-2" />
              Zurücksetzen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
