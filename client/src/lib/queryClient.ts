import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | FormData,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  // Get token from localStorage if available
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type for JSON data, not FormData
  if (data && !(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let res: Response;
  
  try {
    res = await fetch(url, {
      method,
      headers,
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
      credentials: "include",
    });
  } catch (networkError) {
    // Handle network errors (Failed to fetch, etc.)
    throw new Error(`Erro de conexão: Verifique sua internet e tente novamente`);
  }

  // Handle 401 errors specifically - but only if not already on login page
  if (res.status === 401 && !window.location.pathname.includes('/login')) {
    // Clear invalid token and redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('401: Sessão expirada, faça login novamente');
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let res: Response;
    
    try {
      res = await fetch(queryKey.join("/") as string, {
        headers,
        credentials: "include",
      });
    } catch (networkError) {
      // Handle network errors for queries
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw new Error(`Erro de conexão: Verifique sua internet e tente novamente`);
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 2000, // Refetch every 2 seconds
      refetchOnWindowFocus: true,
      staleTime: 0, // Always consider data stale
      gcTime: 0, // Don't cache data
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
