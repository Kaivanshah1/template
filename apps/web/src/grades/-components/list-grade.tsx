import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { listGradesAction } from '@/lib/wmsactions'
import { TGrade } from '@/schemas/wms'

type GradeListingProps = {
  initialGrades?: TGrade[]
  canUpdateMasters: boolean
}

export default function GradeListing({ initialGrades, canUpdateMasters }: GradeListingProps) {
  const [search, setSearch] = useState<string>('')
  const size = 25
  const [page, setPage] = useState<number>(1)
  const navigate = useNavigate()

  const gradesQuery = useQuery<TGrade[]>({
    queryKey: ['grades', page, size, search],
    queryFn: () =>
      listGradesAction({
        search: search,
        page: page,
        size: size,
      }),
    initialData: initialGrades,
  })

  // Backend already handles search and pagination, so use data directly
  const grades = gradesQuery.data || []

  if (gradesQuery.isError) {
    return <div>Error loading grades. Please try again later.</div>
  }

  return (
    <div className="p-2 sm:p-4">
      <div className="grid sm:grid-cols-4 gap-2">
        <Input
          placeholder="Search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1) // Reset page to 1 when search changes
          }}
          className="h-8"
        />
      </div>

      <div className="my-4" />

      <Table className="bg-[var(--background)] text-[var(--foreground)]">
        <TableHeader>
          <TableRow className="bg-[var(--card)] text-[var(--card-foreground)]">
            <TableHead className="w-1/12">Sr. No.</TableHead>
            <TableHead className="w-8/12">Grade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gradesQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={2} className="h-24 text-center bg-[var(--card)] text-[var(--muted-foreground)]">
                Loading grades...
              </TableCell>
            </TableRow>
          ) : grades.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="h-24 text-center bg-[var(--card)] text-[var(--muted-foreground)]">
                No grades found.
              </TableCell>
            </TableRow>
          ) : (
            grades.map((grade, index) => {
              return (
                <TableRow
                  key={grade.id}
                  onClick={() =>
                    canUpdateMasters &&
                    navigate({
                      to: '/app/wms/grades/$gradeId',
                      params: { gradeId: grade.id ?? '' },
                    })
                  }
                  className={`${canUpdateMasters ? 'cursor-pointer' : ''} hover:bg-[var(--muted)] transition-colors`}
                  style={{ color: 'var(--foreground)' }}
                >
                  <TableCell>{index + 1 + (page - 1) * size}</TableCell>
                  <TableCell className="font-medium">{grade.name}</TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      <div className="my-4 flex justify-end items-center space-x-2">
        <Button onClick={() => setPage(page - 1)} size="sm" variant="outline" disabled={page === 1} className="disabled:opacity-30">
          Previous
        </Button>
        <p className="text-xs">Page: {page}</p>
        <Button onClick={() => setPage(page + 1)} size="sm" variant="outline" disabled={grades.length < size} className="disabled:opacity-30">
          Next
        </Button>
      </div>
    </div>
  )
}
