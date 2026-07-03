'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable, getCoreRowModel, flexRender,
  type ColumnDef, type SortingState, type PaginationState,
} from '@tanstack/react-table';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Plus, Search, ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal,
  Trash2, RefreshCw, Filter, X, Ticket,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ── Types ────────────────────────────────────────────────────────────
interface TicketRow {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  company_id: number;
  user: { id: number; name: string; email: string };
  created_at: string;
}

interface PaginatedTickets {
  data: TicketRow[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

// ── Status config ─────────────────────────────────────────────────────
const statusConfig = {
  open:        { label: 'Open',        cls: 'status-open' },
  in_progress: { label: 'In Progress', cls: 'status-in_progress' },
  resolved:    { label: 'Resolved',    cls: 'status-resolved' },
  closed:      { label: 'Closed',      cls: 'status-closed' },
};

// ── Create Ticket Form ────────────────────────────────────────────────
function CreateTicketDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [errors, setErrors]     = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () => api.post('/tickets', { title, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Ticket created successfully!');
      setTitle(''); setDesc(''); setErrors({});
      onClose();
    },
    onError: (err: any) => {
      if (err.response?.data?.errors) {
        const errs: Record<string, string> = {};
        for (const [k, v] of Object.entries(err.response.data.errors)) {
          errs[k] = Array.isArray(v) ? (v as string[])[0] : String(v);
        }
        setErrors(errs);
      } else {
        toast.error(err.response?.data?.message || 'Failed to create ticket.');
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Ticket className="h-4 w-4 text-emerald-400" /> New Ticket
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">Submit a new support ticket for your team.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="ticket-title" className="text-muted-foreground">Title</Label>
            <Input
              id="ticket-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              className={`bg-muted border text-foreground placeholder:text-muted-foreground focus:border-emerald-500 ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ticket-desc" className="text-muted-foreground">Description</Label>
            <textarea
              id="ticket-desc"
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Provide as much detail as possible…"
              rows={4}
              className={`w-full rounded-md border bg-muted border text-foreground placeholder:text-muted-foreground focus:border-emerald-500 px-3 py-2 text-sm focus:outline-none resize-none ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">Cancel</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !title || !description}
              className="bg-emerald-500 hover:bg-emerald-600 text-foreground"
              id="create-ticket-submit"
            >
              {mutation.isPending ? 'Creating…' : 'Create Ticket'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function TicketsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Table state ────────────────────────────────────────────────────
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting]       = useState<SortingState>([{ id: 'created_at', desc: true }]);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TicketRow | null>(null);

  // ── Fetch tickets ──────────────────────────────────────────────────
  const queryKey = ['tickets', pagination, sorting, search, statusFilter, dateFrom, dateTo];
  const { data, isLoading, isFetching } = useQuery<PaginatedTickets>({
    queryKey,
    queryFn: () => {
      const sort = sorting[0];
      const params: Record<string, string | number> = {
        page:     pagination.pageIndex + 1,
        per_page: pagination.pageSize,
      };
      if (sort) { params.sort_by = sort.id; params.sort_dir = sort.desc ? 'desc' : 'asc'; }
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo)   params.date_to   = dateTo;
      return api.get('/tickets', { params }).then((r) => r.data);
    },
    placeholderData: (prev) => prev,
  });

  // ── Delete mutation ────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/tickets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Ticket deleted.');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('Failed to delete ticket.');
      setDeleteTarget(null);
    },
  });

  // ── Status update mutation ─────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/tickets/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Status updated.');
    },
    onError: () => toast.error('Failed to update status.'),
  });

  // ── Columns ────────────────────────────────────────────────────────
  const columns: ColumnDef<TicketRow>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <SortHeader label="Title" column={column} />
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground text-sm">{row.original.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{row.original.description}</p>
        </div>
      ),
      size: 320,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <SortHeader label="Status" column={column} />,
      cell: ({ row }) => {
        const cfg = statusConfig[row.original.status];
        return (
          <Badge className={`text-xs ${cfg?.cls}`}>{cfg?.label || row.original.status}</Badge>
        );
      },
      size: 130,
    },
    {
      id: 'user',
      header: 'Submitted By',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.user?.name}</span>
      ),
      size: 150,
    },
    ...(user?.role === 'SuperAdmin' ? [{
      id: 'company',
      header: 'Company',
      cell: ({ row }: { row: any }) => (
        <span className="text-sm text-muted-foreground">{row.original.company?.name || '-'}</span>
      ),
      size: 150,
    }] : []),
    {
      accessorKey: 'created_at',
      header: ({ column }) => <SortHeader label="Created" column={column} />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.created_at), { addSuffix: true })}
        </span>
      ),
      size: 130,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const ticket = row.original;
        const isAdmin = user?.role === 'CompanyAdmin' || user?.role === 'SuperAdmin';
        if (!isAdmin) return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              id={`ticket-actions-${ticket.id}`}
              aria-label="Ticket actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border text-foreground">
              {(['open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
                <DropdownMenuItem
                  key={s}
                  className="text-muted-foreground hover:text-foreground focus:bg-muted cursor-pointer text-xs"
                  onClick={() => statusMutation.mutate({ id: ticket.id, status: s })}
                >
                  Set: {statusConfig[s].label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                className="text-red-400 hover:text-red-300 focus:bg-red-500/10 cursor-pointer"
                onClick={() => setDeleteTarget(ticket)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 48,
    },
  ];

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: { pagination, sorting },
    manualPagination: true,
    manualSorting: true,
    pageCount: data?.last_page ?? -1,
    rowCount: data?.total ?? 0,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
  });

  const clearFilters = () => {
    setSearch(''); setStatus('all'); setDateFrom(''); setDateTo('');
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };
  const hasFilters = search || statusFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.total ?? '…'} ticket{data?.total !== 1 ? 's' : ''} total
          </p>
        </div>
        {user?.role !== 'SuperAdmin' && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-foreground shadow-lg shadow-emerald-500/25"
            id="new-ticket-btn"
          >
            <Plus className="h-4 w-4 mr-1.5" /> New Ticket
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="animate-fade-in-up delay-100 border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Filter className="h-3.5 w-3.5" /> Filters
            {hasFilters && (
              <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-muted-foreground transition-colors">
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="ticket-search"
                  placeholder="Search tickets…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
                  className="pl-9 bg-muted border text-foreground placeholder:text-muted-foreground focus:border-emerald-500 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => { setStatus(v ?? 'all'); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
                <SelectTrigger id="status-filter" className="bg-muted border text-foreground focus:border-emerald-500 text-sm">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="bg-card border text-foreground">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">From date</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
                className="bg-muted border text-foreground focus:border-emerald-500 text-sm [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">To date</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
                className="bg-muted border text-foreground focus:border-emerald-500 text-sm [color-scheme:dark]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="animate-fade-in-up delay-200 border bg-card overflow-hidden">
        <div className="relative overflow-x-auto">
          {isFetching && !isLoading && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 animate-pulse" />
          )}
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="border hover:bg-transparent">
                  {hg.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-muted-foreground text-xs font-medium uppercase tracking-wide py-3"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i} className="border">
                    {columns.map((_, j) => (
                      <TableCell key={j} className="py-4">
                        <div className="h-4 rounded shimmer" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow className="border hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="py-16 text-center text-muted-foreground">
                    <Ticket className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No tickets found.</p>
                    {hasFilters && (
                      <button onClick={clearFilters} className="mt-2 text-xs text-emerald-400 hover:text-emerald-300">
                        Clear filters
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border hover:bg-card transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between border-t border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {(pagination.pageIndex * pagination.pageSize) + 1}–
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.total)} of {data.total}
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(v) => setPagination({ pageIndex: 0, pageSize: Number(v) })}
              >
                <SelectTrigger className="h-7 w-16 bg-muted border text-foreground text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border text-foreground">
                  {[5, 10, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-7 border bg-muted text-foreground hover:bg-muted text-xs"
                onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))}
                disabled={pagination.pageIndex === 0}
                id="prev-page"
              >
                Prev
              </Button>
              <span className="text-xs text-muted-foreground">{pagination.pageIndex + 1} / {data.last_page}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 border bg-muted text-foreground hover:bg-muted text-xs"
                onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
                disabled={pagination.pageIndex >= data.last_page - 1}
                id="next-page"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <CreateTicketDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ticket?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete the ticket <strong className="text-foreground">"{deleteTarget?.title}"</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background hover:bg-accent text-foreground border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortHeader({ label, column }: { label: string; column: any }) {
  const sorted = column.getIsSorted();
  return (
    <button
      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-xs font-medium uppercase tracking-wide"
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {label}
      {sorted === 'asc'  ? <ChevronUp className="h-3 w-3" />   :
       sorted === 'desc' ? <ChevronDown className="h-3 w-3" /> :
       <ChevronsUpDown className="h-3 w-3 opacity-50" />}
    </button>
  );
}
