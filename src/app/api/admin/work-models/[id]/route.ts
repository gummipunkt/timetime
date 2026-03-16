import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AuditAction } from '@prisma/client'

// GET single work model
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workModel = await prisma.workTimeModel.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    })

    if (!workModel) {
      return NextResponse.json({ error: 'Work model not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      workTimeModel: workModel
    })
  } catch (error) {
    console.error('Failed to fetch work model:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update work model
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      description,
      mondayMinutes,
      tuesdayMinutes,
      wednesdayMinutes,
      thursdayMinutes,
      fridayMinutes,
      saturdayMinutes,
      sundayMinutes,
      isDefault 
    } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if work model exists
    const existing = await prisma.workTimeModel.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Work model not found' }, { status: 404 })
    }

    // Check if name is already taken by another model
    const duplicate = await prisma.workTimeModel.findFirst({
      where: {
        name: name.trim(),
        NOT: { id: params.id }
      }
    })

    if (duplicate) {
      return NextResponse.json({ error: 'Ein Modell mit diesem Namen existiert bereits' }, { status: 400 })
    }

    // If setting as default, unset other defaults
    if (isDefault && !existing.isDefault) {
      await prisma.workTimeModel.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }

    const workModel = await prisma.workTimeModel.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        mondayMinutes: mondayMinutes ?? existing.mondayMinutes,
        tuesdayMinutes: tuesdayMinutes ?? existing.tuesdayMinutes,
        wednesdayMinutes: wednesdayMinutes ?? existing.wednesdayMinutes,
        thursdayMinutes: thursdayMinutes ?? existing.thursdayMinutes,
        fridayMinutes: fridayMinutes ?? existing.fridayMinutes,
        saturdayMinutes: saturdayMinutes ?? existing.saturdayMinutes,
        sundayMinutes: sundayMinutes ?? existing.sundayMinutes,
        isDefault: isDefault ?? existing.isDefault,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        performedById: session.user.id,
        action: AuditAction.UPDATE,
        entityType: 'WorkTimeModel',
        entityId: workModel.id,
        oldValues: {
          name: existing.name,
          description: existing.description,
          mondayMinutes: existing.mondayMinutes,
          tuesdayMinutes: existing.tuesdayMinutes,
          wednesdayMinutes: existing.wednesdayMinutes,
          thursdayMinutes: existing.thursdayMinutes,
          fridayMinutes: existing.fridayMinutes,
          saturdayMinutes: existing.saturdayMinutes,
          sundayMinutes: existing.sundayMinutes,
          isDefault: existing.isDefault,
        },
        newValues: {
          name: workModel.name,
          description: workModel.description,
          mondayMinutes: workModel.mondayMinutes,
          tuesdayMinutes: workModel.tuesdayMinutes,
          wednesdayMinutes: workModel.wednesdayMinutes,
          thursdayMinutes: workModel.thursdayMinutes,
          fridayMinutes: workModel.fridayMinutes,
          saturdayMinutes: workModel.saturdayMinutes,
          sundayMinutes: workModel.sundayMinutes,
          isDefault: workModel.isDefault,
        },
        description: `Arbeitszeitmodell ${existing.name} wurde aktualisiert`,
      }
    })

    return NextResponse.json({
      success: true,
      workTimeModel: workModel
    })
  } catch (error) {
    console.error('Failed to update work model:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE work model
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if work model exists and has users
    const workModel = await prisma.workTimeModel.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    })

    if (!workModel) {
      return NextResponse.json({ error: 'Work model not found' }, { status: 404 })
    }

    if (workModel.isDefault) {
      return NextResponse.json({ 
        error: 'Das Standard-Modell kann nicht gelöscht werden. Setzen Sie zuerst ein anderes Modell als Standard.' 
      }, { status: 400 })
    }

    if (workModel._count.users > 0) {
      return NextResponse.json({ 
        error: `Dieses Modell wird noch von ${workModel._count.users} Mitarbeitern verwendet. Bitte weisen Sie diese zuerst einem anderen Modell zu.` 
      }, { status: 400 })
    }

    await prisma.workTimeModel.delete({
      where: { id: params.id }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        performedById: session.user.id,
        action: AuditAction.DELETE,
        entityType: 'WorkTimeModel',
        entityId: params.id,
        oldValues: {
          name: workModel.name,
          description: workModel.description,
          mondayMinutes: workModel.mondayMinutes,
          tuesdayMinutes: workModel.tuesdayMinutes,
          wednesdayMinutes: workModel.wednesdayMinutes,
          thursdayMinutes: workModel.thursdayMinutes,
          fridayMinutes: workModel.fridayMinutes,
          saturdayMinutes: workModel.saturdayMinutes,
          sundayMinutes: workModel.sundayMinutes,
          isDefault: workModel.isDefault,
        },
        description: `Arbeitszeitmodell ${workModel.name} wurde gelöscht`,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete work model:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
