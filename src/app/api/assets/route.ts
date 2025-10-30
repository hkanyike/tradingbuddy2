// src/app/api/assets/route.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { assets } from '@/db/schema'

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const allAssets = await db.select().from(assets)
    return NextResponse.json(allAssets, { status: 200 })
  } catch (error) {
    console.error('GET /api/assets error:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()

    if (!body.symbol || typeof body.symbol !== 'string' || body.symbol.trim() === '') {
      return NextResponse.json({ error: 'Symbol is required and must be a non-empty string', code: 'INVALID_SYMBOL' }, { status: 400 })
    }

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ error: 'Name is required and must be a non-empty string', code: 'INVALID_NAME' }, { status: 400 })
    }

    const newAsset = await db.insert(assets).values({
      symbol: body.symbol.trim(),
      name: body.name.trim(),
      assetTypeId: body.assetTypeId || null,
      sector: body.sector?.trim() || null,
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning()

    return NextResponse.json(newAsset[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/assets error:', error)
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}
