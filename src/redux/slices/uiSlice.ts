import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface UIState {
  isSearchModalOpen: boolean;
  isMenuOpen: boolean;
  isQuickViewOpen: boolean;
  quickViewProductId: string | null;
  isLoading: boolean;
  toasts: Toast[];
  isMobile: boolean;
}

const initialState: UIState = {
  isSearchModalOpen: false,
  isMenuOpen: false,
  isQuickViewOpen: false,
  quickViewProductId: null,
  isLoading: false,
  toasts: [],
  isMobile: false,
};

/**
 * UI Slice - Manages interface state
 * Example slice - feel free to modify or delete
 */
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSearchModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isSearchModalOpen = action.payload;
    },

    setMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMenuOpen = action.payload;
    },

    toggleMenu: (state) => {
      state.isMenuOpen = !state.isMenuOpen;
    },

    openQuickView: (state, action: PayloadAction<string>) => {
      state.isQuickViewOpen = true;
      state.quickViewProductId = action.payload;
    },

    closeQuickView: (state) => {
      state.isQuickViewOpen = false;
      state.quickViewProductId = null;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        id: Date.now().toString(),
        duration: 5000,
        ...action.payload,
      };
      state.toasts.push(toast);
    },

    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },

    clearToasts: (state) => {
      state.toasts = [];
    },

    setIsMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload;
    },

    closeAllModals: (state) => {
      state.isSearchModalOpen = false;
      state.isQuickViewOpen = false;
      state.quickViewProductId = null;
      state.isMenuOpen = false;
    },
  },
});

export const {
  setSearchModalOpen,
  setMenuOpen,
  toggleMenu,
  openQuickView,
  closeQuickView,
  setLoading,
  addToast,
  removeToast,
  clearToasts,
  setIsMobile,
  closeAllModals,
} = uiSlice.actions;

export default uiSlice.reducer; 