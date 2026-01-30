import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export type AppRole = "admin" | "employee" | "client";

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar: string | null;
  contact: string | null;
  representative: string | null;
  role: AppRole;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch profile using setTimeout to avoid Supabase deadlock
        setTimeout(async () => {
          await fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
      }

      if (event === "SIGNED_OUT") {
        setProfile(null);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleError) throw roleError;

      if (profileData) {
        setProfile({
          ...profileData,
          role: (roleData?.role as AppRole) || "client",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    contact?: string,
    representative?: string,
    role: AppRole = "client",
  ) => {
    try {
      const redirectUrl = window.location.origin;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase.from("users").insert({
          user_id: data.user.id,
          name,
          email,
          avatar: name.substring(0, 2).toUpperCase(),
          contact,
          representative,
          role: role,
        });

        if (profileError) throw profileError;

        // Create user role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: data.user.id,
          role,
        });

        if (roleError) throw roleError;

        toast.success("Account created successfully!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Signed in successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setProfile(null);
      navigate("/");
      toast.success("Signed out successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  return {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!session,
  };
}
