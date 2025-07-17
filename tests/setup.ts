import '@testing-library/jest-dom'
// import { server } from './mocks/server'

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/mesarpg_test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    has: jest.fn(),
    getAll: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/test-path',
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'PLAYER',
      },
    },
    status: 'authenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

// Mock Socket.IO
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  })),
}))

// Establish API mocking before all tests (commented out for now)
// beforeAll(() => {
//   server.listen()
// })

// Reset any runtime request handlers we may add during the tests
// afterEach(() => {
//   server.resetHandlers()
// })

// Clean up after the tests are finished
// afterAll(() => {
//   server.close()
// })

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    reload: jest.fn(),
    assign: jest.fn(),
    replace: jest.fn(),
  },
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock fetch
global.fetch = jest.fn()

// Suppress console errors in tests unless explicitly testing them
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})