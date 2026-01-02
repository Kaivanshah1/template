import { useState } from 'react'
import { useForm, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNavigate, useRouter } from '@tanstack/react-router'

// UI Components
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { SidebarInset } from '@/components/ui/sidebar'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { authService } from '@/lib/auth'
import { gradeSchema, TGrade } from '@/schemas/wms'
import { createGradeAction, updateGradeAction } from '@/lib/wmsactions'

type GradeFormProps = {
  grade?: TGrade
  enableEdit?: boolean
}

export default function GradeForm({ grade, enableEdit = true }: GradeFormProps) {
  const router = useRouter()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Use TanStack Query to get user details
  const { data: userDetails } = useQuery({
    queryKey: ['userDetails'],
    queryFn: authService.getUserDetails,
  })

  const canEdit = !!userDetails
  const [editMode, setEditMode] = useState(enableEdit)

  const form = useForm<TGrade>({
    resolver: zodResolver(gradeSchema),
    defaultValues: grade ?? {
      name: '',
    },
  })

  const saveGradeMutation = useMutation({
    mutationFn: async (data: TGrade) => {
      // Check if this is an update (has id) or create (no id)
      if (grade?.id) {
        return updateGradeAction({ ...data, id: grade.id })
      } else {
        return createGradeAction(data)
      }
    },
    onSuccess: () => {
      router.invalidate()
      queryClient.invalidateQueries({ queryKey: ['grades'] })
      toast.success(grade?.id ? 'Grade updated successfully' : 'Grade created successfully')
      navigate({ to: '/app/wms/grades' })
    },
    onError: async (error: any) => {
      let errorMessage = 'An error occurred'

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.error) {
        errorMessage = error.error
      } else if (error?.message) {
        errorMessage = error.message
      }

      console.log(error)
      toast.error(errorMessage)
    },
  })

  const onSubmit = (data: TGrade) => {
    console.log('Form data:', data)
    saveGradeMutation.mutate(data)
  }

  const onFormError = (errors: FieldErrors<TGrade>) => {
    console.log(errors)
  }

  return (
    <SidebarInset>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onFormError)} className="w-full">
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center justify-between w-full px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" type="button" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink onClick={() => navigate({ to: '/app/wms/grades' })}>Grades</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{grade?.id ? 'Edit Grade' : 'Create Grade'}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              {editMode && (
                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    type="button"
                    variant="ghost"
                    disabled={saveGradeMutation.isPending}
                    className="cursor-pointer"
                    onClick={() => navigate({ to: '/app/wms/grades' })}
                  >
                    Cancel
                  </Button>

                  <Button size="xs" type="submit" disabled={saveGradeMutation.isPending} className="cursor-pointer">
                    {saveGradeMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}

              {!editMode && canEdit && (
                <div className="flex items-center gap-2">
                  <Button size="xs" type="button" disabled={saveGradeMutation.isPending} className="cursor-pointer" onClick={() => setEditMode(true)}>
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </header>

          <Separator className="mb-4" />

          <div className="p-4 space-y-6">
            {/* Grade Information Section */}
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 pb-12 md:grid-cols-3">
              <div>
                <h2 className="text-base/7 font-semibold">Grade Information</h2>
                <p className="mt-1 text-sm/6 text-muted-foreground">Enter grade details.</p>
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
                <div className="sm:col-span-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Grade Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} disabled={saveGradeMutation.isPending || !editMode} autoComplete="off" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </SidebarInset>
  )
}
