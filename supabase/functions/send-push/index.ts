import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req) => {
  try {
    const payload = await req.json();

    // Database webhook sends: { type: "INSERT", table: "notifications", record: {...} }
    const record = payload.record;

    if (!record?.user_id) {
      return new Response(
        JSON.stringify({ error: "No record in payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up user's push token
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("push_token")
      .eq("id", record.user_id)
      .single();

    if (profileError || !profile?.push_token) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "No push token" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = profile.push_token;

    // Validate Expo push token format
    if (!token.startsWith("ExponentPushToken[")) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Invalid token format" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build Expo push message
    const pushMessage = {
      to: token,
      sound: "default",
      title: record.title,
      body: record.body,
      data: record.data || {},
      channelId: "default",
    };

    // Send via Expo Push API
    const pushResponse = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pushMessage),
    });

    const pushResult = await pushResponse.json();

    // Handle push errors (e.g., DeviceNotRegistered)
    if (pushResult.data?.[0]?.status === "error") {
      const errorDetail = pushResult.data[0].details;

      // Clear invalid tokens
      if (errorDetail?.error === "DeviceNotRegistered") {
        await supabase
          .from("profiles")
          .update({ push_token: null })
          .eq("id", record.user_id);
      }

      return new Response(
        JSON.stringify({ error: pushResult.data[0].message }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
