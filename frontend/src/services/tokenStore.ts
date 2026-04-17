// ── JWT Token Storage (localStorage) ─────────────────────────────
const KEYS = {
  ACCESS:  'eco_access_token',
  REFRESH: 'eco_refresh_token',
  USER:    'eco_user',
};

export const tokenStore = {
  setTokens(accessToken, refreshToken, user) {
    localStorage.setItem(KEYS.ACCESS, accessToken);
    localStorage.setItem(KEYS.REFRESH, refreshToken);
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  getAccessToken: ()  => localStorage.getItem(KEYS.ACCESS),
  getRefreshToken: () => localStorage.getItem(KEYS.REFRESH),

  getUser() {
    try { return JSON.parse(localStorage.getItem(KEYS.USER) || 'null'); }
    catch { return null; }
  },

  clear() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  },

  isLoggedIn: () => !!localStorage.getItem(KEYS.ACCESS),
};
