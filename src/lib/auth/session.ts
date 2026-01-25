// Re-export from demo-auth for backwards compatibility
export {
  getCurrentUserId,
  isAuthenticated,
  isInDemoMode,
  getAuthSession,
  getAuthSession as getSession, // Alias for backwards compatibility
  createDemoSession,
  destroyDemoSession,
  getDemoSession,
  isDemoUser,
} from '@/lib/demo-auth'
