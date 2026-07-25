export function setupAuthGuard(router, options) {
  const {
    authContext,
    loginPath = '/login',
    forbiddenPath = '/403',
    notFoundPath = '/404',
  } = options;
  
  router.beforeEach((to, from) => {
    if (!authContext) return true;
    
    if (to.meta.requiresAuth) {
      if (!authContext.user || !authContext.user.id) {
        const redirectUrl = from ? from.fullPath : to.fullPath;
        return {
          path: loginPath,
          query: { redirect: redirectUrl },
        };
      }
    }
    
    if (to.meta.permission) {
      if (!authContext.hasPermission || !authContext.hasPermission(to.meta.permission)) {
        return { path: forbiddenPath };
      }
    }
    
    if (to.meta.role) {
      if (!authContext.hasRole || !authContext.hasRole(to.meta.role)) {
        return { path: forbiddenPath };
      }
    }
    
    return true;
  });
  
  return () => {};
}
