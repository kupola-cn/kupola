export function setupAuthGuard(router, options) {
  const {
    authContext,
    loginPath = '/login',
    forbiddenPath = '/403',
    notFoundPath = '/404',
  } = options;
  
  const getAuth = () => {
    if (typeof authContext === 'function') {
      return authContext();
    }
    return authContext;
  };
  
  router.beforeEach((to, from) => {
    const currentAuth = getAuth();
    
    if (to.meta.requiresAuth) {
      if (!currentAuth || !currentAuth.user || !currentAuth.user.id) {
        const redirectUrl = from ? from.fullPath : to.fullPath;
        return {
          path: loginPath,
          query: { redirect: redirectUrl },
        };
      }
    }
    
    if (to.meta.permission) {
      if (!currentAuth.hasPermission || !currentAuth.hasPermission(to.meta.permission)) {
        return { path: forbiddenPath };
      }
    }
    
    if (to.meta.role) {
      if (!currentAuth.hasRole || !currentAuth.hasRole(to.meta.role)) {
        return { path: forbiddenPath };
      }
    }
    
    return true;
  });
  
  return () => {};
}
