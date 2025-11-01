import { makeDurableObject, makeWorker } from '@livestore/sync-cf/cf-worker'
import * as jose from 'jose'

// Cloudflare Workers type definitions
declare global {
  interface DurableObjectNamespace<T = unknown> {
    newUniqueId(options?: { jurisdiction?: string }): DurableObjectId
    idFromName(name: string): DurableObjectId
    idFromString(id: string): DurableObjectId
    get(id: DurableObjectId): DurableObjectStub<T>
  }

  interface DurableObjectId {
    toString(): string
    equals(other: DurableObjectId): boolean
  }

  interface DurableObjectStub<T = unknown> {
    id: DurableObjectId
    fetch(request: Request): Promise<Response>
  }

  interface D1Database {
    prepare(query: string): D1PreparedStatement
    dump(): Promise<ArrayBuffer>
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>
    exec(query: string): Promise<D1ExecResult>
  }

  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement
    first<T = unknown>(colName?: string): Promise<T | null>
    run(): Promise<D1Result>
    all<T = unknown>(): Promise<D1Result<T>>
    raw<T = unknown>(): Promise<T[]>
  }

  interface D1Result<T = unknown> {
    results?: T[]
    success: boolean
    meta: Record<string, unknown>
  }

  interface D1ExecResult {
    count: number
    duration: number
  }

  interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void
    passThroughOnException(): void
  }
}

// WebSocket Durable Object for real-time sync
export class WebSocketServer extends makeDurableObject({
  onPush: async (message) => {
    console.log('onPush', message.batch)
  },
  onPull: async (message) => {
    console.log('onPull', message)
  },
}) {}

// JWT Verification Helper
async function getUserFromToken(
  token: string,
  secret: string,
): Promise<jose.JWTPayload | undefined> {
  try {
    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(secret),
    )
    return payload
  } catch (error) {
    console.log('⚠️ Error verifying token', error)
  }
}

// Cache for initialized workers per JWT_SECRET
const workerCache = new Map<string, ReturnType<typeof makeWorker>>()

function getOrCreateWsWorker(jwtSecret: string) {
  if (!jwtSecret || jwtSecret.trim() === '') {
    throw new Error('JWT_SECRET is required for WebSocket worker')
  }

  // Return cached worker if exists
  if (workerCache.has(jwtSecret)) {
    return workerCache.get(jwtSecret)!
  }

  // Create new worker
  const wsWorker = makeWorker({
    validatePayload: async (payload: any) => {
      const { authToken } = payload

      if (!authToken) {
        throw new Error('No auth token provided')
      }

      const user = await getUserFromToken(authToken, jwtSecret)

      if (!user) {
        throw new Error('Invalid auth token')
      }

      // Check if token is expired
      if (user.exp && user.exp < Date.now() / 1000) {
        throw new Error('Token expired')
      }
    },
    enableCORS: true,
  })

  // Cache the worker
  workerCache.set(jwtSecret, wsWorker)
  return wsWorker
}

// HTTPS Backend API Handler
interface Env {
  WEBSOCKET_SERVER: DurableObjectNamespace<WebSocketServer>
  DB: D1Database
  JWT_SECRET: string
  ADMIN_SECRET: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
}

// Helper function for CORS headers
function corsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

// Helper function for JSON responses
function jsonResponse(
  data: any,
  status = 200,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
      ...headers,
    },
  })
}

// Main worker export - handles both WebSocket and HTTP
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url)

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(request.headers.get('Origin') || undefined),
      })
    }

    // Route WebSocket connections to the WebSocket worker
    if (
      url.pathname.startsWith('/ws') ||
      request.headers.get('Upgrade') === 'websocket'
    ) {
      // Check if JWT_SECRET is configured for WebSocket auth
      if (!env.JWT_SECRET || env.JWT_SECRET.trim() === '') {
        console.error('JWT_SECRET not configured for WebSocket connection')
        return jsonResponse(
          { error: 'Server authentication not configured' },
          500,
        )
      }

      try {
        const wsWorker = getOrCreateWsWorker(env.JWT_SECRET)
        return wsWorker.fetch(request, env, ctx)
      } catch (error: any) {
        console.error('WebSocket worker error:', error)
        return jsonResponse({ error: 'WebSocket connection failed' }, 500)
      }
    }

    // Handle HTTP API endpoints
    if (url.pathname.startsWith('/api')) {
      return handleApiRequest(request, env, url)
    }

    // Default health check endpoint
    if (url.pathname === '/' || url.pathname === '/health') {
      return jsonResponse({
        status: 'ok',
        timestamp: new Date().toISOString(),
        endpoints: {
          websocket: '/ws',
          api: '/api',
        },
      })
    }

    return jsonResponse({ error: 'Not found' }, 404)
  },
}

// API Request Handler
async function handleApiRequest(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const path = url.pathname.replace('/api', '')

  try {
    // Login endpoint
    if (path === '/login' && request.method === 'POST') {
      return await handleLogin(request, env)
    }

    return jsonResponse({ error: 'Endpoint not found' }, 404)
  } catch (error: any) {
    console.error('API Error:', error)
    return jsonResponse(
      { error: error.message || 'Internal server error' },
      500,
    )
  }
}

// Google JWKS endpoint
const GOOGLE_JWKS_URI = 'https://www.googleapis.com/oauth2/v3/certs'

// Verify Google ID Token
async function verifyGoogleIdToken(
  idToken: string,
  clientId: string,
): Promise<jose.JWTPayload> {
  try {
    // Fetch Google's public keys (JWKS)
    const JWKS = jose.createRemoteJWKSet(new URL(GOOGLE_JWKS_URI))

    // Verify the token
    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: clientId,
    })

    return payload
  } catch (error) {
    console.error('Google ID token verification failed:', error)
    throw new Error('Invalid Google ID token')
  }
}

// Login Handler - Verifies idToken and returns JWT
async function handleLogin(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json()
    const { idToken } = body

    if (!idToken) {
      return jsonResponse({ error: 'idToken is required' }, 400)
    }

    // Check required environment variables
    if (!env.JWT_SECRET || env.JWT_SECRET.trim() === '') {
      console.error('JWT_SECRET is not configured')
      return jsonResponse(
        { error: 'Server authentication not configured (JWT_SECRET missing)' },
        500,
      )
    }

    if (!env.GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID is not configured')
      return jsonResponse(
        {
          error:
            'Google OAuth not configured on server (GOOGLE_CLIENT_ID missing)',
        },
        500,
      )
    }

    // Verify the Google ID token against Google's public keys
    let googlePayload: jose.JWTPayload

    try {
      googlePayload = await verifyGoogleIdToken(idToken, env.GOOGLE_CLIENT_ID)
    } catch (error: any) {
      console.error('Error verifying Google idToken:', error)
      return jsonResponse({ error: error.message || 'Invalid idToken' }, 401)
    }

    // Extract user information from verified Google token
    const userInfo = {
      sub: googlePayload.sub as string,
      email: googlePayload.email as string,
      name: googlePayload.name as string,
      picture: googlePayload.picture as string | undefined,
      email_verified: googlePayload.email_verified as boolean,
    }

    // Ensure email is verified
    if (!userInfo.email_verified) {
      return jsonResponse({ error: 'Email not verified' }, 401)
    }

    // Generate our own JWT token
    const secret = new TextEncoder().encode(env.JWT_SECRET)
    const alg = 'HS256'

    const jwt = await new jose.SignJWT({
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('7d') // Token expires in 7 days
      .sign(secret)

    return jsonResponse({
      token: jwt,
      user: {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      },
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return jsonResponse({ error: 'Login failed' }, 500)
  }
}
