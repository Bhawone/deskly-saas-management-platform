<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/companies/onboard', [CompanyController::class, 'onboard']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::post('/companies/upgrade', [CompanyController::class, 'upgrade']);

    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    Route::get('/tickets', [TicketController::class, 'index']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/{ticket}', [TicketController::class, 'show']);
    Route::patch('/tickets/{ticket}/status', [TicketController::class, 'updateStatus']);
    Route::delete('/tickets/{ticket}', [TicketController::class, 'destroy']);

    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users/invite', [UserController::class, 'invite']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
});
