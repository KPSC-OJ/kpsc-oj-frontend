import type { AuthApiError } from '../types/auth'

type RequestJsonOptions = {
  accessToken?: string
  body?: unknown
  method: 'GET' | 'POST'
  path: string
}

const defaultApiBaseUrl = 'http://localhost:8000'

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).replace(
  /\/$/,
  '',
)

async function readErrorResponse(response: Response): Promise<AuthApiError> {
  const fallbackError: AuthApiError = {
    code: `HTTP_${response.status}`,
    message: '요청을 처리하지 못했습니다.',
    status: response.status,
  }

  try {
    const errorBody = (await response.json()) as Partial<AuthApiError>

    return {
      code: typeof errorBody.code === 'string' ? errorBody.code : fallbackError.code,
      message:
        typeof errorBody.message === 'string' ? errorBody.message : fallbackError.message,
      status: response.status,
    }
  } catch {
    return fallbackError
  }
}

export async function requestJson<TResponse>({
  accessToken,
  body,
  method,
  path,
}: RequestJsonOptions): Promise<TResponse> {
  const headers = new Headers()

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers,
    method,
  })

  if (!response.ok) {
    throw await readErrorResponse(response)
  }

  return (await response.json()) as TResponse
}

