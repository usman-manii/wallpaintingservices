import { NextResponse } from 'next/server';

/**
 * Health Check API Endpoint
 * Used by load balancers and monitoring systems
 */
export async function GET() {
  try {
    // Check if backend API is accessible
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    let backendStatus = 'unknown';
    
    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      backendStatus = response.ok ? 'healthy' : 'unhealthy';
    } catch (error) {
      backendStatus = 'unreachable';
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      frontend: 'healthy',
      backend: backendStatus,
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  }
}
