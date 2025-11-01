import { isAuthUserAuthenticated } from '@/store/authUser.store'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (!isAuthUserAuthenticated()) {
      throw redirect({
        to: '/login',
      })
    } else {
      throw redirect({
        to: '/projects',
      })
    }
  },
})
