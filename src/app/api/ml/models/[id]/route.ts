import { NextRequest, NextResponse } from 'next/server';
import { modelService } from '@/lib/ml/model-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// GET /api/ml/models/[id] - Get specific model
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const model = modelService.getModel(id);

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ model }, { status: 200 });
  } catch (error) {
    console.error('Error fetching model:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// DELETE /api/ml/models/[id] - Delete model
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const deleted = modelService.deleteModel(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Model not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Model deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting model:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
