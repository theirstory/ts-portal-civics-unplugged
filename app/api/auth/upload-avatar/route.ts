import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateUserAvatar } from '@/lib/users';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${user.username}.${ext}`;

    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = await createServerSupabaseClient();

    // Remove old avatar files for this user
    const { data: existingFiles } = await supabase.storage.from('avatars').list('', { search: user.username });

    if (existingFiles && existingFiles.length > 0) {
      const toRemove = existingFiles.filter((f) => f.name.startsWith(`${user.username}.`)).map((f) => f.name);
      if (toRemove.length > 0) {
        await supabase.storage.from('avatars').remove(toRemove);
      }
    }

    // Upload new avatar
    const bytes = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, bytes, {
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;
    const updated = await updateUserAvatar(user.id, avatarUrl);

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}
