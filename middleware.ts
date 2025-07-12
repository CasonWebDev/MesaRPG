import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protected routes
        const protectedRoutes = ['/dashboard', '/campaign']
        const isProtectedRoute = protectedRoutes.some(route => 
          req.nextUrl.pathname.startsWith(route)
        )
        
        if (isProtectedRoute) {
          return !!token
        }
        
        return true
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/campaign/:path*']
}