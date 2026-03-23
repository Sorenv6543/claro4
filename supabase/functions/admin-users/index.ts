import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse (data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function errorResponse (message: string, status = 400) {
  return jsonResponse({ error: message }, status)
}

// deno-lint-ignore no-explicit-any
type AdminClient = SupabaseClient<any, 'public', any>

async function handleCreate (adminClient: AdminClient, body: Record<string, unknown>) {
  const { email, password, name, role, company_name, access_level, skills, max_daily_bookings, location_lat, location_lng, timezone, language, notifications_enabled } = body

  if (!email || !password || !name || !role) {
    return errorResponse('Missing required fields: email, password, name, role')
  }

  // Create auth user — the on_auth_user_created trigger automatically
  // inserts a row into user_profiles using user_metadata fields.
  const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
    email: email as string,
    password: password as string,
    email_confirm: true,
    user_metadata: { name, role, company_name: company_name || undefined },
  })

  if (createError || !authData?.user) {
    return errorResponse(createError?.message || 'Failed to create auth user', 500)
  }

  // Update the trigger-created profile with additional fields
  const { error: updateError } = await adminClient
    .from('user_profiles')
    .update({
      access_level: access_level || null,
      skills: skills || null,
      max_daily_bookings: max_daily_bookings || null,
      location_lat: location_lat || null,
      location_lng: location_lng || null,
      timezone: (timezone as string) || 'UTC',
      language: (language as string) || 'en',
      notifications_enabled: notifications_enabled ?? true,
    })
    .eq('id', authData.user.id)

  if (updateError) {
    console.error('Failed to update extra profile fields:', updateError.message)
  }

  return jsonResponse({ user: { id: authData.user.id, email, name, role } }, 201)
}

async function handleDelete (adminClient: AdminClient, body: Record<string, unknown>, callerId: string) {
  const { userId } = body
  if (!userId) {
    return errorResponse('Missing required field: userId')
  }
  if (userId === callerId) {
    return errorResponse('Cannot delete your own account', 400)
  }

  const { error: delProfileError } = await adminClient
    .from('user_profiles')
    .delete()
    .eq('id', userId as string)
  if (delProfileError) {
    return errorResponse(delProfileError.message, 500)
  }

  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId as string)
  if (authDeleteError) {
    return jsonResponse({ warning: 'Profile deleted but auth account remains. ' + authDeleteError.message }, 207)
  }

  return jsonResponse({ success: true })
}

async function handleResetPassword (adminClient: AdminClient, body: Record<string, unknown>) {
  const { userId, newPassword } = body
  if (!userId || !newPassword) {
    return errorResponse('Missing required fields: userId, newPassword')
  }

  const { error: resetError } = await adminClient.auth.admin.updateUserById(userId as string, { password: newPassword as string })
  if (resetError) {
    return errorResponse(resetError.message, 500)
  }

  return jsonResponse({ success: true })
}

async function authenticateCaller (adminClient: AdminClient, authHeader: string) {
  const token = authHeader.replace('Bearer ', '')

  const { data: { user: caller }, error: authError } = await adminClient.auth.getUser(token)
  if (authError || !caller) {
    return { error: errorResponse('Invalid or expired token: ' + (authError?.message || 'no user'), 401) }
  }

  const { data: callerProfile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'admin') {
    return { error: errorResponse('Admin access required', 403) }
  }

  return { caller }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const authResult = await authenticateCaller(adminClient, authHeader)
    if (authResult.error) {
      return authResult.error
    }

    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'create': {
        return await handleCreate(adminClient, body)
      }
      case 'delete': {
        return await handleDelete(adminClient, body, authResult.caller!.id)
      }
      case 'reset-password': {
        return await handleResetPassword(adminClient, body)
      }
      default: {
        return errorResponse(`Unknown action: ${action}`)
      }
    }
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
})
