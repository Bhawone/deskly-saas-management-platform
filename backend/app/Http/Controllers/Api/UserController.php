<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $query = User::with('company:id,name');

        if (!$request->user()->isSuperAdmin()) {
            $query->where('company_id', $request->user()->company_id);
        }

        $users = $query->paginate(15);

        return response()->json($users);
    }

    public function invite(Request $request): JsonResponse
    {
        $this->authorize('invite', User::class);

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'role'     => ['required', Rule::in(['Employee', 'CompanyAdmin'])],
            'password' => ['required', 'string', Password::min(8)->letters()->mixedCase()->numbers()->symbols()],
        ]);

        $user = User::create([
            'company_id' => $request->user()->company_id,
            'name'       => $validated['name'],
            'email'      => $validated['email'],
            'password'   => Hash::make($validated['password']),
            'role'       => $validated['role'],
        ]);

        return response()->json([
            'message' => 'User invited successfully.',
            'user'    => $user->only(['id', 'name', 'email', 'role', 'company_id']),
        ], 201);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }
}
