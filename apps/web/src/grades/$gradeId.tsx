import { createFileRoute } from '@tanstack/react-router'
import GradeForm from './-components/create-grade'
import { LoadingScreen } from '@/components/loading-screen'
import { getGradeByIdAction } from '@/lib/wmsactions'
import { TGrade } from '@/schemas/wms'

export const Route = createFileRoute('/app/wms/grades/$gradeId')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const gradeId = params.gradeId
    const grade = await getGradeByIdAction(gradeId)
    return { grade }
  },
  pendingComponent: () => {
    return <LoadingScreen />
  },
})

function RouteComponent() {
  const { grade } = Route.useLoaderData() as { grade: TGrade }
  return <GradeForm grade={grade} enableEdit={false} />
}
