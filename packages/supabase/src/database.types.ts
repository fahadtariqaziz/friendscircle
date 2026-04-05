// Simplified Database types for Supabase client
// Run `supabase gen types typescript` for auto-generated types

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          university_id: string | null;
          campus_id: string | null;
          year: string | null;
          bio: string | null;
          points: number;
          level: string;
          interests: string[];
          push_token: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          avatar_url?: string | null;
          university_id?: string | null;
          campus_id?: string | null;
          year?: string | null;
          bio?: string | null;
          points?: number;
          level?: string;
          interests?: string[];
          push_token?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          avatar_url?: string | null;
          university_id?: string | null;
          campus_id?: string | null;
          year?: string | null;
          bio?: string | null;
          points?: number;
          level?: string;
          interests?: string[];
          push_token?: string | null;
        };
      };
      universities: {
        Row: {
          id: string;
          name: string;
          short_name: string;
          logo_url: string | null;
          city: string;
          country: string;
        };
        Insert: {
          id?: string;
          name: string;
          short_name: string;
          logo_url?: string | null;
          city: string;
          country: string;
        };
        Update: {
          name?: string;
          short_name?: string;
          logo_url?: string | null;
          city?: string;
          country?: string;
        };
      };
      campuses: {
        Row: {
          id: string;
          university_id: string;
          name: string;
          address: string | null;
        };
        Insert: {
          id?: string;
          university_id: string;
          name: string;
          address?: string | null;
        };
        Update: {
          university_id?: string;
          name?: string;
          address?: string | null;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          post_type: string;
          title: string;
          body: string | null;
          university_id: string | null;
          campus_id: string | null;
          status: string;
          metadata: Record<string, unknown> | null;
          image_urls: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_type: string;
          title: string;
          body?: string | null;
          university_id?: string | null;
          campus_id?: string | null;
          status?: string;
          metadata?: Record<string, unknown> | null;
          image_urls?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          body?: string | null;
          status?: string;
          metadata?: Record<string, unknown> | null;
          image_urls?: string[] | null;
        };
      };
      friend_circles: {
        Row: {
          id: string;
          creator_id: string;
          name: string;
          photo_url: string | null;
          university_id: string | null;
          campus_id: string | null;
          is_public: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          name: string;
          photo_url?: string | null;
          university_id?: string | null;
          campus_id?: string | null;
          is_public?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          photo_url?: string | null;
          is_public?: boolean;
        };
      };
      friend_circle_members: {
        Row: {
          id: string;
          circle_id: string;
          user_id: string | null;
          status: string;
          invited_email: string | null;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          circle_id: string;
          user_id?: string | null;
          status: string;
          invited_email?: string | null;
          joined_at?: string | null;
        };
        Update: {
          user_id?: string | null;
          status?: string;
          joined_at?: string | null;
        };
      };
      friend_circle_invites: {
        Row: {
          id: string;
          circle_id: string;
          email: string;
          invited_by: string;
          token: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          circle_id: string;
          email: string;
          invited_by: string;
          token?: string;
          status: string;
          created_at?: string;
        };
        Update: {
          status?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string | null;
          circle_id: string | null;
          user_id: string;
          body: string;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id?: string | null;
          circle_id?: string | null;
          user_id: string;
          body: string;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          body?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          likeable_type: string;
          likeable_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          likeable_type: string;
          likeable_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          data: Record<string, unknown> | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          data?: Record<string, unknown> | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
      };
      admin_actions: {
        Row: {
          id: string;
          admin_id: string;
          post_id: string;
          action: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          post_id: string;
          action: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          reason?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      post_type: string;
      post_status: string;
    };
  };
}
