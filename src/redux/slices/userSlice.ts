import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags?: string[];
}

interface UserState {
  currentUser: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  recentlyViewedProducts: string[];
  wishlist: string[];
}

const initialState: UserState = {
  currentUser: null,
  isLoggedIn: false,
  isLoading: false,
  recentlyViewedProducts: [],
  wishlist: [],
};

/**
 * User Slice - Manages user authentication and profile
 * Example slice - feel free to modify or delete
 */
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
      state.isLoggedIn = true;
      state.isLoading = false;
    },

    clearUser: (state) => {
      state.currentUser = null;
      state.isLoggedIn = false;
      state.isLoading = false;
    },

    setUserLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },

    addToRecentlyViewed: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      state.recentlyViewedProducts = state.recentlyViewedProducts.filter(id => id !== productId);
      state.recentlyViewedProducts.unshift(productId);
      
      // Keep only last 10 items
      if (state.recentlyViewedProducts.length > 10) {
        state.recentlyViewedProducts = state.recentlyViewedProducts.slice(0, 10);
      }
    },

    addToWishlist: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      if (!state.wishlist.includes(productId)) {
        state.wishlist.push(productId);
      }
    },

    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.wishlist = state.wishlist.filter(id => id !== action.payload);
    },

    clearWishlist: (state) => {
      state.wishlist = [];
    },
  },
});

export const {
  setUser,
  clearUser,
  setUserLoading,
  updateUser,
  addToRecentlyViewed,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} = userSlice.actions;

export default userSlice.reducer; 