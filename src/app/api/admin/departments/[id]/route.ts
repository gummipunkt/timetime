import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AuditAction } from '@prisma/client'

// GET single department
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
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { members: true }
        }
      }
    })

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    return NextResponse.json(department)
  } catch (error) {
    console.error('Failed to fetch department:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update department
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
    const { name, description } = body
    const { id } = await context.params

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if department exists
    const existing = await prisma.department.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    // Check if name is already taken by another department
    const duplicate = await prisma.department.findFirst({
      where: {
        name: name.trim(),
        NOT: { id }
      }
    })

    if (duplicate) {
      return NextResponse.json({ error: 'Eine Abteilung mit diesem Namen existiert bereits' }, { status: 400 })
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
      include: {
        _count: {
          select: { members: true }
        }
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        performedById: session.user.id,
        action: AuditAction.UPDATE,
        entityType: 'Department',
        entityId: department.id,
        oldValues: { name: existing.name, description: existing.description },
        newValues: { name: department.name, description: department.description },
        description: `Abteilung ${existing.name} wurde aktualisiert`,
      }
    })

    return NextResponse.json(department)
  } catch (error) {
    console.error('Failed to update department:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE department
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if department exists and has users
    const { id } = await context.params
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { members: true }
        }
      }
    })

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    if (department._count.members > 0) {
      return NextResponse.json({ 
        error: `Diese Abteilung hat noch ${department._count.members} Mitarbeiter zugewiesen. Bitte weisen Sie diese zuerst einer anderen Abteilung zu.` 
      }, { status: 400 })
    }

    await prisma.department.delete({
      where: { id }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        performedById: session.user.id,
        action: AuditAction.DELETE,
        entityType: 'Department',
        entityId: id,
        oldValues: { name: department.name, description: department.description },
        description: `Abteilung ${department.name} wurde gelöscht`,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete department:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
