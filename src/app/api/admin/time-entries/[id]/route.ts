import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/admin/time-entries/:id
 * Korrigiert einen Zeiteintrag
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !['ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const body = await request.json()
    const { timestamp, type, note, correctionNote } = body

    // Get existing entry
    const existing = await prisma.timeEntry.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            supervisorId: true,
          }
        }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Eintrag nicht gefunden' }, { status: 404 })
    }

    // Check supervisor permission
    if (session.user.role === 'SUPERVISOR' && existing.user.supervisorId !== session.user.id) {
      return NextResponse.json({ error: 'Keine Berechtigung für diesen Mitarbeiter' }, { status: 403 })
    }

    // Update entry
    const entry = await prisma.timeEntry.update({
      where: { id: params.id },
      data: {
        timestamp: timestamp ? new Date(timestamp) : undefined,
        type: type || undefined,
        note: note,
        originalTimestamp: existing.originalTimestamp || existing.timestamp,
        correctedById: session.user.id,
        correctionNote: correctionNote || 'Korrigiert durch Admin',
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: existing.userId,
        performedById: session.user.id,
        action: 'CORRECT',
        entityType: 'TimeEntry',
        entityId: entry.id,
        oldValues: { 
          timestamp: existing.timestamp, 
          type: existing.type,
          note: existing.note 
        },
        newValues: { 
          timestamp: entry.timestamp, 
          type: entry.type,
          note: entry.note 
        },
        description: `Zeiteintrag korrigiert für ${existing.user.firstName} ${existing.user.lastName}`,
      }
    })

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('Update time entry error:', error)
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/time-entries/:id
 * Löscht einen Zeiteintrag
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nur Administratoren können Einträge löschen' }, { status: 403 })
    }

    const existing = await prisma.timeEntry.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Eintrag nicht gefunden' }, { status: 404 })
    }

    await prisma.timeEntry.delete({
      where: { id: params.id }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: existing.userId,
        performedById: session.user.id,
        action: 'DELETE',
        entityType: 'TimeEntry',
        entityId: params.id,
        oldValues: { 
          timestamp: existing.timestamp, 
          type: existing.type 
        },
        description: `Zeiteintrag gelöscht für ${existing.user.firstName} ${existing.user.lastName}`,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete time entry error:', error)
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten' }, { status: 500 })
  }
}
