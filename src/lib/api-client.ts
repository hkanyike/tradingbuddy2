// src/lib/api-client.ts
// Utility for making safe API calls with proper error handling

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  code?: string;
  status: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function safeApiCall<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || `HTTP ${response.status}`,
        response.status,
        data.code
      );
    }

    return {
      data,
      status: response.status,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        error: error.message,
        code: error.code,
        status: error.status,
      };
    }

    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500,
    };
  }
}

// Helper for authenticated API calls
export async function authenticatedApiCall<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem("bearer_token");
  
  return safeApiCall<T>(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}
