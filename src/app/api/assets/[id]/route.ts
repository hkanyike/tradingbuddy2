// src/app/api/assets/[id]/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { assets } from '@/db/schema'
import { eq } from 'drizzle-orm'

type RouteContext = {
  params: Record<string, string>
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const id = params.id

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 },
      )
    }

    const asset = await db
      .select()
      .from(assets)
      .where(eq(assets.id, parseInt(id)))
      .limit(1)

    if (asset.length === 0) {
      return NextResponse.json(
        { error: 'Asset not found', code: 'ASSET_NOT_FOUND' },
        { status: 404 },
      )
    }

    return NextResponse.json(asset[0], { status: 200 })
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 },
    )
  }
}

export async function PUT(req: Request, { params }: RouteContext) {
  try {
    const id = params.id

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 },
      )
    }

    const body = await req.json()

    const existingAsset = await db
      .select()
      .from(assets)
      .where(eq(assets.id, parseInt(id)))
      .limit(1)

    if (existingAsset.length === 0) {
      return NextResponse.json(
        { error: 'Asset not found', code: 'ASSET_NOT_FOUND' },
        { status: 404 },
      )
    }

    const updateData: any = {}

    if (body.symbol !== undefined) {
      if (!body.symbol || typeof body.symbol !== 'string' || body.symbol.trim() === '') {
        return NextResponse.json(
          { error: 'Symbol must be a non-empty string', code: 'INVALID_SYMBOL' },
          { status: 400 },
        )
      }
      updateData.symbol = body.symbol.trim()
    }

    if (body.name !== undefined) {
      if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
        return NextResponse.json(
          { error: 'Name must be a non-empty string', code: 'INVALID_NAME' },
          { status: 400 },
        )
      }
      updateData.name = body.name.trim()
    }

    if (body.assetTypeId !== undefined) {
      if (body.assetTypeId !== null && (typeof body.assetTypeId !== 'number' || isNaN(body.assetTypeId))) {
        return NextResponse.json(
          { error: 'Asset type ID must be a valid number or null', code: 'INVALID_ASSET_TYPE_ID' },
          { status: 400 },
        )
      }
      updateData.assetTypeId = body.assetTypeId
    }

    if (body.sector !== undefined) {
      if (body.sector !== null && typeof body.sector !== 'string') {
        return NextResponse.json(
          { error: 'Sector must be a string or null', code: 'INVALID_SECTOR' },
          { status: 400 },
        )
      }
      updateData.sector = body.sector ? body.sector.trim() : null
    }

    if (body.liquidityRank !== undefined) {
      if (body.liquidityRank !== null && (typeof body.liquidityRank !== 'number' || isNaN(body.liquidityRank))) {
        return NextResponse.json(
          { error: 'Liquidity rank must be a valid number or null', code: 'INVALID_LIQUIDITY_RANK' },
          { status: 400 },
        )
      }
      updateData.liquidityRank = body.liq
