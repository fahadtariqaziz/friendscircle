/**
 * cleanup-expired-posts — Supabase Edge Function
 *
 * 1. Fetches all expired posts (expires_at < NOW()) with their image_urls
 * 2. Deletes images from Cloudinary to avoid storage charges
 * 3. Deletes the posts from Supabase
 *
 * Schedule: Supabase Dashboard → Edge Functions → cleanup-expired-posts
 *           → Cron Schedule → "0 2 * * *"  (daily at 2 AM UTC)
 *
 * Required env vars (set in Supabase Dashboard → Edge Functions → Secrets):
 *   SUPABASE_URL              (auto-set by Supabase)
 *   SUPABASE_SERVICE_ROLE_KEY (auto-set by Supabase)
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CLOUDINARY_CLOUD = Deno.env.get("CLOUDINARY_CLOUD_NAME") ?? "";
const CLOUDINARY_API_KEY = Deno.env.get("CLOUDINARY_API_KEY") ?? "";
const CLOUDINARY_API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET") ?? "";

/**
 * Extract Cloudinary public_id from a secure_url.
 * URL format: https://res.cloudinary.com/{cloud}/image/upload/[transforms/]v{version}/{public_id}.{ext}
 */
function extractPublicId(url: string): string | null {
  // Match public_id after the version segment (v followed by digits)
  const withVersion = url.match(/\/image\/upload\/(?:.*\/)?v\d+\/(.+)\.[^.]+$/);
  if (withVersion) return withVersion[1];
  // Fallback: no version segment
  const noVersion = url.match(/\/image\/upload\/(.+)\.[^.]+$/);
  return noVersion ? noVersion[1] : null;
}

/**
 * Delete a list of Cloudinary public_ids in batches of 100.
 * Uses the Cloudinary Admin API with Basic auth (api_key:api_secret).
 */
async function deleteCloudinaryImages(publicIds: string[]): Promise<number> {
  if (publicIds.length === 0) return 0;
  if (!CLOUDINARY_CLOUD || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn("Cloudinary credentials missing — skipping image deletion");
    return 0;
  }

  const auth = btoa(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`);
  let deleted = 0;

  for (let i = 0; i < publicIds.length; i += 100) {
    const batch = publicIds.slice(i, i + 100);
    const params = new URLSearchParams();
    batch.forEach((id) => params.append("public_ids[]", id));

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/resources/image/upload?${params}`,
        {
          method: "DELETE",
          headers: { Authorization: `Basic ${auth}` },
        },
      );

      if (!res.ok) {
        console.error(`Cloudinary batch ${i / 100 + 1} failed: ${res.status} ${await res.text()}`);
      } else {
        const result = await res.json();
        const batchDeleted = Object.keys(result.deleted ?? {}).length;
        deleted += batchDeleted;
        console.log(`Cloudinary batch ${i / 100 + 1}: deleted ${batchDeleted}/${batch.length} images`);
      }
    } catch (err: any) {
      console.error(`Cloudinary batch ${i / 100 + 1} error:`, err.message);
    }
  }

  return deleted;
}

Deno.serve(async (_req) => {
  try {
    const now = new Date().toISOString();

    // 1. Fetch expired posts with their image URLs
    const { data: expiredPosts, error: fetchError } = await supabase
      .from("posts")
      .select("id, image_urls")
      .lt("expires_at", now)
      .not("expires_at", "is", null);

    if (fetchError) {
      console.error("Fetch error:", fetchError.message);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!expiredPosts || expiredPosts.length === 0) {
      console.log("No expired posts");
      return new Response(
        JSON.stringify({ deleted: 0, imagesRemoved: 0, timestamp: now }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log(`Found ${expiredPosts.length} expired posts`);

    // 2. Collect Cloudinary public_ids from all expired posts
    const publicIds: string[] = [];
    for (const post of expiredPosts) {
      if (Array.isArray(post.image_urls)) {
        for (const url of post.image_urls) {
          const id = extractPublicId(url as string);
          if (id) publicIds.push(id);
        }
      }
    }

    // 3. Delete images from Cloudinary
    const imagesRemoved = await deleteCloudinaryImages(publicIds);

    // 4. Delete posts from Supabase
    const { error: deleteError, count } = await supabase
      .from("posts")
      .delete({ count: "exact" })
      .lt("expires_at", now)
      .not("expires_at", "is", null);

    if (deleteError) {
      console.error("Delete error:", deleteError.message);
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const summary = {
      deleted: count ?? 0,
      imagesRemoved,
      timestamp: now,
    };
    console.log("Cleanup complete:", summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Unexpected error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
