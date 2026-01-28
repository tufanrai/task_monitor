// 1. We use the 'standard' Supabase Edge Function imports
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req: any) => {
  // This is the payload sent by the Supabase Webhook
  const { record, old_record } = await req.json();

  // Only run if the status changed (e.g., from 'pending' to 'approved')
  if (record.status !== old_record.status) {
    // Initialize Supabase Client to fetch the User's Email
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch the email from the profiles table using the user_id from the booking
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("email, name")
      .eq("id", record.user_id)
      .single();

    if (profileError || !profile?.email) {
      return new Response(
        JSON.stringify({ error: "Could not find user email" }),
        { status: 400 },
      );
    }

    // Send the Email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Studio Booking <onboarding@resend.dev>",
        to: [profile.email],
        subject: `Your Booking is ${record.status.toUpperCase()}`,
        html: `
          <h3>Hello ${profile.name || "there"}!</h3>
          <p>The admin has reviewed your request for the studio.</p>
          <p><strong>Status:</strong> ${record.status}</p>
          <p><strong>Reason for booking:</strong> ${record.reason}</p>
          <br />
          <p>Login to the dashboard for more details.</p>
        `,
      }),
    });

    const result = await res.json();
    return new Response(JSON.stringify(result), { status: 200 });
  }

  return new Response(
    JSON.stringify({ message: "No status change detected" }),
    { status: 200 },
  );
});
