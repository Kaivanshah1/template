import { createFileRoute, redirect } from '@tanstack/react-router'
import GradeForm from './-components/create-grade'
import { authService } from '@/lib/auth'

export const Route = createFileRoute('/app/wms/grades/create')({
  component: RouteComponent,
  loader: async () => {
    const userDetails = await authService.getUserDetails()
    if (!userDetails) {
      throw redirect({ to: '/' })
    }
    return {
      userId: userDetails.userId,
    }
  },
})

function RouteComponent() {
  return <GradeForm />
}
