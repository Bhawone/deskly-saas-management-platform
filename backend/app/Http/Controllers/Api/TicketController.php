<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Ticket::class);

        $query = Ticket::with(['user:id,name,email', 'company:id,name'])
            ->when($request->status, fn ($q) => $q->byStatus($request->status))
            ->when($request->date_from || $request->date_to, fn ($q) =>
                $q->byDateRange($request->date_from, $request->date_to)
            )
            ->when($request->search, fn ($q) =>
                $q->where(function ($q2) use ($request) {
                    $q2->where('title', 'like', "%{$request->search}%")
                       ->orWhere('description', 'like', "%{$request->search}%");
                })
            );

        $sortField     = in_array($request->sort_by, ['title', 'status', 'created_at']) ? $request->sort_by : 'created_at';
        $sortDirection = $request->sort_dir === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortField, $sortDirection);

        $tickets = $query->paginate($request->per_page ?? 10);

        return response()->json($tickets);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Ticket::class);

        $validated = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
        ]);

        $ticket = Ticket::create([
            'company_id'  => $request->user()->company_id,
            'user_id'     => $request->user()->id,
            'title'       => $validated['title'],
            'description' => $validated['description'],
            'status'      => 'open',
        ]);

        return response()->json($ticket->load(['user:id,name,email']), 201);
    }

    public function show(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('view', $ticket);

        return response()->json($ticket->load(['user:id,name,email', 'company:id,name']));
    }

    public function updateStatus(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('updateStatus', $ticket);

        $validated = $request->validate([
            'status' => ['required', 'in:open,in_progress,resolved,closed'],
        ]);

        $ticket->update(['status' => $validated['status']]);

        return response()->json($ticket);
    }

    public function destroy(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('delete', $ticket);

        $ticket->delete();

        return response()->json(['message' => 'Ticket deleted successfully.'], 200);
    }
}
