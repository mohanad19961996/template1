import { NextResponse } from 'next/server';

const USER_ID = 'default-user';

export function getUserId(): string {
  return USER_ID;
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse(data: unknown, status: number = 200) {
  return NextResponse.json({ data }, { status });
}

// Validate required string field
export function requireString(value: unknown, fieldName: string): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return `${fieldName} is required and must be a non-empty string`;
  }
  return null;
}

// Validate enum field
export function requireEnum(value: unknown, allowed: string[], fieldName: string): string | null {
  if (!allowed.includes(value as string)) {
    return `${fieldName} must be one of: ${allowed.join(', ')}`;
  }
  return null;
}

// Validate date string (YYYY-MM-DD)
export function isValidDateKey(dateKey: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) && !isNaN(new Date(dateKey).getTime());
}
