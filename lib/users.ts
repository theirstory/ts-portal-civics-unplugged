import { User } from '@/types/user';
import crypto from 'crypto';

async function getSupabase() {
  const { createServerSupabaseClient } = await import('./supabase/server');
  return createServerSupabaseClient();
}

export async function findUserByToken(token: string): Promise<User | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, created_at')
    .eq('auth_token', token)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    fullName: data.full_name,
    username: data.username,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
  };
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, created_at')
    .ilike('username', username)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    fullName: data.full_name,
    username: data.username,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
  };
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { data } = await supabase.from('profiles').select('id').ilike('username', username).single();

  return !!data;
}

export async function createUser(fullName: string, username: string): Promise<{ user: User; token: string }> {
  const supabase = await getSupabase();
  const token = crypto.randomUUID();

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      full_name: fullName,
      username,
      auth_token: token,
    })
    .select('id, full_name, username, avatar_url, created_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create user');
  }

  return {
    user: {
      id: data.id,
      fullName: data.full_name,
      username: data.username,
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
    },
    token,
  };
}

export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<User | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)
    .select('id, full_name, username, avatar_url, created_at')
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    fullName: data.full_name,
    username: data.username,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
  };
}
