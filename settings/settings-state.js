// settings-state.js
export const settingsState = {
    isOpen: false,
    activeGlobalTheme: localStorage.getItem('global_theme') || 'default',
    activeWishlistTheme: localStorage.getItem('wishlist_theme') || 'default',
    selectedThemeType: null, // 'global' or 'wishlist'
    selectedThemeName: null,
    previewMode: false
};