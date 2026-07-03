<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function before(User $user): ?bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->isCompanyAdmin() || $user->isEmployee();
    }

 function view(User $user, Ticket $ticket): bool
    {
        return $user->company_id === $ticket->company_id;
    }

    public function create(User $user): bool
    {
        return $user->isCompanyAdmin() || $user->isEmployee();
    }

    public function updateStatus(User $user, Ticket $ticket): bool
    {
        return $user->isCompanyAdmin() && $user->company_id === $ticket->company_id;
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        return $user->isCompanyAdmin() && $user->company_id === $ticket->company_id;
    }
}
