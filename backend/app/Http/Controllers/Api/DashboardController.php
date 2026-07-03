<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $ticketStats = Ticket::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        $totalTickets   = Ticket::count();
        $openTickets    = $ticketStats['open'] ?? 0;
        $inProgress     = $ticketStats['in_progress'] ?? 0;
        $resolved       = $ticketStats['resolved'] ?? 0;
        $closed         = $ticketStats['closed'] ?? 0;

        $totalUsers = $user->isSuperAdmin()
            ? User::count()
            : User::where('company_id', $user->company_id)->count();

        $recentTickets = Ticket::with('user:id,name')
            ->latest()
            ->take(5)
            ->get(['id', 'title', 'status', 'user_id', 'created_at']);

        return response()->json([
            'tickets' => [
                'total'       => $totalTickets,
                'open'        => $openTickets,
                'in_progress' => $inProgress,
                'resolved'    => $resolved,
                'closed'      => $closed,
            ],
            'users'          => $totalUsers,
            'recent_tickets' => $recentTickets,
        ]);
    }
}
