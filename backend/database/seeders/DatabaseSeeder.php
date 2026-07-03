<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Platform SuperAdmin ────────────────────────────────────────
        User::create([
            'company_id' => null,
            'name'       => 'Platform Admin',
            'email'      => 'admin@deskly.ph',
            'password'   => Hash::make('password'),
            'role'       => 'SuperAdmin',
        ]);

        // ── Company 1: San Miguel Corp ─────────────────────────────────
        $smc = Company::create([
            'name'              => 'San Miguel Corp',
            'subscription_tier' => 'pro',
        ]);

        $smcAdmin = User::create([
            'company_id' => $smc->id,
            'name'       => 'Juan Dela Cruz',
            'email'      => 'juan.delacruz@sanmiguel.com.ph',
            'password'   => Hash::make('password'),
            'role'       => 'CompanyAdmin',
        ]);

        $smcEmp1 = User::create([
            'company_id' => $smc->id,
            'name'       => 'Jose Rizal',
            'email'      => 'jose.rizal@sanmiguel.com.ph',
            'password'   => Hash::make('password'),
            'role'       => 'Employee',
        ]);

        $smcEmp2 = User::create([
            'company_id' => $smc->id,
            'name'       => 'Andres Bonifacio',
            'email'      => 'andres.bonifacio@sanmiguel.com.ph',
            'password'   => Hash::make('password'),
            'role'       => 'Employee',
        ]);

        $smcTickets = [
            ['title' => 'Users locked out after password reset',      'description' => 'Several users are reporting they cannot log back in after using the password reset link. The link appears to expire too quickly.', 'status' => 'open'],
            ['title' => 'Dashboard loading slowly on large accounts', 'description' => 'Accounts with more than 2,000 records are seeing the main dashboard take 12+ seconds to load. Smaller accounts are fine.', 'status' => 'in_progress'],
            ['title' => 'CSV export includes wrong date range',       'description' => 'When exporting data for "last 30 days", the file is pulling 45 days of records instead.', 'status' => 'resolved'],
            ['title' => 'Two-factor authentication setup failing',    'description' => 'The QR code on the 2FA setup page is not rendering for users on iOS 17. Works fine on Android.', 'status' => 'open'],
            ['title' => 'Email notifications going to spam',          'description' => 'Transactional emails from our domain are being marked as spam by major providers since last Tuesday.', 'status' => 'in_progress'],
            ['title' => 'Search returns no results for new records',  'description' => 'Records created in the last 48 hours do not appear in search results. Older records work fine.', 'status' => 'open'],
            ['title' => 'API rate limit too restrictive for bulk ops', 'description' => 'Our integration hits the rate limit when syncing large batches. We need either a higher limit or a bulk endpoint.', 'status' => 'closed'],
            ['title' => 'Notification preferences not saving',        'description' => 'Users update their notification settings, but the changes revert after logging out and back in.', 'status' => 'resolved'],
        ];

        foreach ($smcTickets as $i => $ticket) {
            Ticket::create(array_merge($ticket, [
                'company_id' => $smc->id,
                'user_id'    => $i % 2 === 0 ? $smcEmp1->id : $smcEmp2->id,
            ]));
        }

        // ── Company 2: Jollibee Foods ──────────────────────────────────
        $jfc = Company::create([
            'name'              => 'Jollibee Foods',
            'subscription_tier' => 'enterprise',
        ]);

        $jfcAdmin = User::create([
            'company_id' => $jfc->id,
            'name'       => 'Maria Santos',
            'email'      => 'maria.santos@jollibee.com.ph',
            'password'   => Hash::make('password'),
            'role'       => 'CompanyAdmin',
        ]);

        $jfcEmp1 = User::create([
            'company_id' => $jfc->id,
            'name'       => 'Ana Reyes',
            'email'      => 'ana.reyes@jollibee.com.ph',
            'password'   => Hash::make('password'),
            'role'       => 'Employee',
        ]);

        $jfcEmp2 = User::create([
            'company_id' => $jfc->id,
            'name'       => 'Pedro Penduko',
            'email'      => 'pedro.penduko@jollibee.com.ph',
            'password'   => Hash::make('password'),
            'role'       => 'Employee',
        ]);

        $jfcTickets = [
            ['title' => 'Billing portal shows incorrect invoice total', 'description' => 'The billing page is displaying last month\'s total for the current period. The underlying charge is correct but the display is wrong.', 'status' => 'open'],
            ['title' => 'Slack integration stopped posting updates',    'description' => 'Automated Slack messages stopped appearing in our #alerts channel around 14:00 on Monday. The webhook URL has not changed.', 'status' => 'in_progress'],
            ['title' => 'Monthly activity report missing data',         'description' => 'The report for June shows activity only up to June 18th. We\'re missing 12 days of data.', 'status' => 'open'],
            ['title' => 'Mobile app crashes on launch (iOS 18)',        'description' => 'After updating to iOS 18, the app crashes immediately on startup. Reinstalling does not fix it.', 'status' => 'resolved'],
            ['title' => 'SAML SSO redirect failing',                   'description' => 'Users authenticating via SSO are hitting an attribute mapping error on redirect. The IdP config has not changed on our side.', 'status' => 'open'],
            ['title' => 'Outgoing webhook payload missing fields',      'description' => 'The `updated_by` and `timestamp` fields are absent from recent webhook payloads. This is breaking our downstream automation.', 'status' => 'closed'],
            ['title' => 'Audit log not recording delete actions',       'description' => 'When a record is deleted, the action does not appear in the audit log. Create and update events are logged correctly.', 'status' => 'in_progress'],
        ];

        foreach ($jfcTickets as $i => $ticket) {
            Ticket::create(array_merge($ticket, [
                'company_id' => $jfc->id,
                'user_id'    => $i % 2 === 0 ? $jfcEmp1->id : $jfcEmp2->id,
            ]));
        }

        // ── Company 3: SM Prime ───────────────────────────────────
        $smPrime = Company::create([
            'name'              => 'SM Prime',
            'subscription_tier' => 'free',
        ]);

        $smpAdmin = User::create([
            'company_id' => $smPrime->id,
            'name'       => 'Henry Sy Jr.',
            'email'      => 'admin@smprime.com.ph',
            'password'   => Hash::make('password'),
            'role'       => 'CompanyAdmin',
        ]);

        $smpEmployee = User::create([
            'company_id' => $smPrime->id,
            'name'       => 'Teresa Magbanua',
            'email'      => 'teresa.m@smprime.com.ph',
            'password'   => Hash::make('password'),
            'role'       => 'Employee',
        ]);

        $smPrimeTickets = [
            ['title' => 'File uploads fail above 5 MB',            'description' => 'Uploading any file larger than 5 MB results in a silent failure. No error is shown to the user and the file does not appear.', 'status' => 'open'],
            ['title' => 'Date picker broken in Firefox',            'description' => 'The date range picker on the reports page does not open in Firefox 126. It works in Chrome and Safari.', 'status' => 'in_progress'],
            ['title' => 'Invitation link expires in 1 hour',        'description' => 'Team invitation links are expiring after one hour instead of the documented 48 hours. New hires are missing the window.', 'status' => 'open'],
            ['title' => 'Report timestamps showing wrong timezone', 'description' => 'All report timestamps are displayed in UTC. We need them to respect the account\'s configured timezone (GMT+8).', 'status' => 'resolved'],
            ['title' => 'Custom subdomain not resolving',           'description' => 'We configured our custom subdomain five days ago but it is still not resolving. DNS propagation appears complete on our end.', 'status' => 'closed'],
        ];

        foreach ($smPrimeTickets as $i => $ticket) {
            Ticket::create(array_merge($ticket, [
                'company_id' => $smPrime->id,
                'user_id'    => $i % 2 === 0 ? $smpAdmin->id : $smpEmployee->id,
            ]));
        }

        $this->command->info('✅ Seeded: 1 Platform Admin, 3 Companies, 9 Users, 20 Tickets');
        $this->command->table(
            ['Role', 'Name', 'Email', 'Password', 'Company'],
            [
                ['SuperAdmin',   'Platform Admin',  'admin@deskly.ph',                'password', 'N/A (system-wide)'],
                ['CompanyAdmin', 'Juan Dela Cruz',  'juan.delacruz@sanmiguel.com.ph', 'password', 'San Miguel Corp'],
                ['Employee',     'Jose Rizal',      'jose.rizal@sanmiguel.com.ph',    'password', 'San Miguel Corp'],
                ['Employee',     'Andres Bonifacio','andres.bonifacio@sanmiguel.com.ph','password', 'San Miguel Corp'],
                ['CompanyAdmin', 'Maria Santos',    'maria.santos@jollibee.com.ph',   'password', 'Jollibee Foods'],
                ['Employee',     'Ana Reyes',       'ana.reyes@jollibee.com.ph',      'password', 'Jollibee Foods'],
                ['Employee',     'Pedro Penduko',   'pedro.penduko@jollibee.com.ph',  'password', 'Jollibee Foods'],
                ['CompanyAdmin', 'Henry Sy Jr.',    'admin@smprime.com.ph',           'password', 'SM Prime'],
                ['Employee',     'Teresa Magbanua', 'teresa.m@smprime.com.ph',        'password', 'SM Prime'],
            ]
        );
    }
}
