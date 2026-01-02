import { SidebarTrigger } from '@/components/ui/sidebar'
import { BreadcrumbLink } from '@/components/ui/breadcrumb'
import { BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { BreadcrumbPage } from '@/components/ui/breadcrumb'
import { BreadcrumbItem } from '@/components/ui/breadcrumb'
import { BreadcrumbList } from '@/components/ui/breadcrumb'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset } from '@/components/ui/sidebar'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/loading-screen'
import GradeListing from './-components/list-grade'
import { listGradesAction } from '@/lib/wmsactions'
import { TGrade } from '@/schemas/wms'
import { authService } from '@/lib/auth'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/app/wms/grades/')({
  component: RouteComponent,
  loader: async () => {
    const grades = await listGradesAction()
    return grades as TGrade[]
  },
  pendingComponent: () => {
    return <LoadingScreen />
  },
})

function RouteComponent() {
  const navigate = useNavigate()
  const grades = Route.useLoaderData()
  const [canUpdateMasters, setCanUpdateMasters] = useState(false)

  useEffect(() => {
    const fetchUserDetails = async () => {
      const userDetails = await authService.getUserDetails()
      if (userDetails) {
        if (userDetails.roles.includes('ADMIN')) {
          setCanUpdateMasters(true)
        } else {
          setCanUpdateMasters(userDetails.permissions.includes('WMS_CAN_UPDATE_MASTERS'))
        }
      }
    }
    fetchUserDetails()
  }, [])

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center justify-between w-full px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink onClick={() => navigate({ to: '/app/wms/grades' })}>Grades</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Grades List</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {canUpdateMasters && (
            <Button size="xs" onClick={() => navigate({ to: '/app/wms/grades/create' })}>
              <PlusIcon className="size-3 mr-1" />
              Add Grade
            </Button>
          )}
        </div>
      </header>
      <Separator className="mb-4" />
      <GradeListing initialGrades={grades} canUpdateMasters={canUpdateMasters} />
    </SidebarInset>
  )
}
