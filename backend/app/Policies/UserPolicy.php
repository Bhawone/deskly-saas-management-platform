<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
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
        return $user->isCompanyAdmin();
    }

    public function invite(User $user): bool
    {
        return $user->isCompanyAdmin();
    }

    public function delete(User $authUser, User $targetUser): bool
    {
        return $authUser->isCompanyAdmin()
            && $authUser->company_id === $targetUser->company_id
            && $authUser->id !== $targetUser->id;
    }
}
