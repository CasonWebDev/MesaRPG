// Basic Token API - Simplified
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/campaigns/[id]/auto-tokens - Basic endpoint for compatibility
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Simple response for basic token system
    return NextResponse.json({
      success: true,
      message: 'Basic token system active'
    })

  } catch (error) {
    console.error('❌ Auto-tokens GET error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Not needed for basic system
export async function POST() {
  return NextResponse.json({ 
    error: 'Enhanced token features disabled' 
  }, { status: 503 })
}