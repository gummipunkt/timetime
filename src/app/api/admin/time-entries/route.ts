import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, parseISO } from 'date-fns'

/**
 * GET /api/admin/time-entries
 * Liste aller Zeiteinträge (für Admins/Supervisors)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !['ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    
    if (userId) {
      where.userId = userId
    } else if (session.user.role === 'SUPERVISOR') {
      // Supervisor can only see their team members
      const teamMembers = await prisma.user.findMany({
        where: { supervisorId: session.user.id },
        select: { id: true }
      })
      where.userId = { in: teamMembers.map(m => m.id) }
    }

    if (dateFrom) {
      where.timestamp = { ...where.timestamp, gte: startOfDay(parseISO(dateFrom)) }
    }
    if (dateTo) {
      where.timestamp = { ...where.timestamp, lte: endOfDay(parseISO(dateTo)) }
    }

    const [entries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.timeEntry.count({ where })
    ])

    // Get correctedBy users separately
    const correctedByIds = entries
      .filter(e => e.correctedById)
      .map(e => e.correctedById as string)
    
    const correctedByUsers = correctedByIds.length > 0 
      ? await prisma.user.findMany({
          where: { id: { in: correctedByIds } },
          select: { id: true, firstName: true, lastName: true }
        })
      : []
    
    const correctedByMap = new Map(
      correctedByUsers.map(u => [u.id, `${u.firstName} ${u.lastName}`])
    )

    return NextResponse.json({
      success: true,
      entries: entries.map(e => ({
        id: e.id,
        userId: e.userId,
        user: {
          id: e.user.id,
          name: `${e.user.firstName} ${e.user.lastName}`,
          email: e.user.email,
        },
        type: e.type,
        timestamp: e.timestamp,
        isManual: e.isManual,
        note: e.note,
        correctedBy: e.correctedById ? {
          id: e.correctedById,
          name: correctedByMap.get(e.correctedById) || 'Unbekannt',
        } : null,
        correctionNote: e.correctionNote,
        originalTimestamp: e.originalTimestamp,
      })),
      total,
    })
  } catch (error) {
    console.error('Get time entries error:', error)
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten' }, { status: 500 })
  }
}

/**
 * POST /api/admin/time-entries
 * Erstellt einen manuellen Zeiteintrag
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !['ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, type, timestamp, note } = body

    if (!userId || !type || !timestamp) {
      return NextResponse.json({ error: 'userId, type und timestamp sind erforderlich' }, { status: 400 })
    }

    // Check if supervisor has permission for this user
    if (session.user.role === 'SUPERVISOR') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { supervisorId: true }
      })
      if (user?.supervisorId !== session.user.id) {
        return NextResponse.json({ error: 'Keine Berechtigung für diesen Mitarbeiter' }, { status: 403 })
      }
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId,
        type,
        timestamp: new Date(timestamp),
        isManual: true,
        correctedById: session.user.id,
        correctionNote: note || 'Manuell erstellt durch Admin',
        note,
      },
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

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: userId,
        performedById: session.user.id,
        action: 'CREATE',
        entityType: 'TimeEntry',
        entityId: entry.id,
        newValues: { type, timestamp, note },
        description: `Manueller Zeiteintrag erstellt für ${entry.user.firstName} ${entry.user.lastName}`,
      }
    })

    return NextResponse.json({ success: true, entry }, { status: 201 })
  } catch (error) {
    console.error('Create time entry error:', error)
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten' }, { status: 500 })
  }
}
