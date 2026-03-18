import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AuditAction } from '@prisma/client'

// GET single holiday
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const holiday = await prisma.holiday.findUnique({ where: { id } })

    if (!holiday) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, holiday })
  } catch (error) {
    console.error('Failed to fetch holiday:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update holiday
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, date, region, isRecurring, isHalfDay } = body
    const { id } = await context.params

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const existing = await prisma.holiday.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 })
    }

    const holidayDate = date ? new Date(date) : existing.date
    const year = holidayDate.getFullYear()

    const holiday = await prisma.holiday.update({
      where: { id },
      data: {
        name: name.trim(),
        date: holidayDate,
        year,
        region: region ?? existing.region,
        isRecurring: isRecurring ?? existing.isRecurring,
        isHalfDay: isHalfDay ?? existing.isHalfDay,
      }
    })

    await prisma.auditLog.create({
      data: {
        performedById: session.user.id,
        action: AuditAction.UPDATE,
        entityType: 'Holiday',
        entityId: holiday.id,
        oldValues: {
          name: existing.name,
          date: existing.date,
          region: existing.region,
          isRecurring: existing.isRecurring,
          isHalfDay: existing.isHalfDay,
        },
        newValues: {
          name: holiday.name,
          date: holiday.date,
          region: holiday.region,
          isRecurring: holiday.isRecurring,
          isHalfDay: holiday.isHalfDay,
        },
        description: `Feiertag ${existing.name} wurde aktualisiert`,
      }
    })

    return NextResponse.json({ success: true, holiday })
  } catch (error) {
    console.error('Failed to update holiday:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE holiday
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const holiday = await prisma.holiday.findUnique({ where: { id } })

    if (!holiday) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 })
    }

    await prisma.holiday.delete({
      where: { id }
    })

    await prisma.auditLog.create({
      data: {
        performedById: session.user.id,
        action: AuditAction.DELETE,
        entityType: 'Holiday',
        entityId: id,
        oldValues: {
          name: holiday.name,
          date: holiday.date,
          region: holiday.region,
          isRecurring: holiday.isRecurring,
          isHalfDay: holiday.isHalfDay,
        },
        description: `Feiertag ${holiday.name} wurde gelöscht`,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete holiday:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
