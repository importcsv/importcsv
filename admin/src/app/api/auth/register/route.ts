import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Server-side URL for backend (can use Docker internal hostname)
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the registration request to the backend
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/auth/register`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Forward error response from backend
    if (error.response) {
      return NextResponse.json(
        error.response.data,
        { status: error.response.status }
      );
    }
    
    // Network or other error
    return NextResponse.json(
      { detail: 'Failed to connect to authentication service' },
      { status: 500 }
    );
  }
}