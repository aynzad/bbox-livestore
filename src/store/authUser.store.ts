import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const USER_STORE_KEY = 'auth-user-store'

interface UserInfo {
  name: string
  id: string
  email: string
  image?: string
  token: string
}
interface AuthUserStoreState {
  user: UserInfo | null
}

const INITIAL_USER_STORE: AuthUserStoreState = {
  user: null,
}

const useAuthUserStore = create<AuthUserStoreState>()(
  persist(() => INITIAL_USER_STORE, {
    name: USER_STORE_KEY, // storage key
  }),
)

// Selectors
export const useAuthUser = () =>
  useAuthUserStore((state: AuthUserStoreState) => state.user)

export const isAuthUserAuthenticated = () =>
  useAuthUserStore.getState().user !== null

// Actions
export const setAuthUser = (user: UserInfo) =>
  useAuthUserStore.setState({ user })

export const resetAuthUserStore = () =>
  useAuthUserStore.setState(INITIAL_USER_STORE)
