<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class CompanyController extends Controller
{
    public function onboard(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_name'  => ['required', 'string', 'max:255'],
            'name'          => ['required', 'string', 'max:255'],
            'email'         => ['required', 'email', 'unique:users,email'],
            'password'      => ['required', 'string', Password::min(8)->letters()->mixedCase()->numbers()->symbols()],
            'subscription_tier' => ['sometimes', 'in:free,pro,enterprise'],
        ]);

        $result = DB::transaction(function () use ($validated) {
            $company = Company::create([
                'name'              => $validated['company_name'],
                'subscription_tier' => $validated['subscription_tier'] ?? 'free',
            ]);

            $user = User::create([
                'company_id' => $company->id,
                'name'       => $validated['name'],
                'email'      => $validated['email'],
                'password'   => Hash::make($validated['password']),
                'role'       => 'CompanyAdmin',
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;

            return compact('company', 'user', 'token');
        });

        return response()->json([
            'message' => 'Company onboarded successfully.',
            'token'   => $result['token'],
            'user'    => [
                'id'      => $result['user']->id,
                'name'    => $result['user']->name,
                'email'   => $result['user']->email,
                'role'    => $result['user']->role,
                'company' => [
                    'id'                => $result['company']->id,
                    'name'              => $result['company']->name,
                    'subscription_tier' => $result['company']->subscription_tier,
                ],
            ],
        ], 201);
    }

    public function upgrade(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subscription_tier' => ['required', 'in:free,pro,enterprise'],
        ]);

        $company = $request->user()->company;
        
        if (!$company) {
            return response()->json(['message' => 'Company not found.'], 404);
        }

        $company->update([
            'subscription_tier' => $validated['subscription_tier'],
        ]);

        return response()->json([
            'message' => 'Subscription upgraded successfully.',
            'company' => $company,
        ]);
    }
}
