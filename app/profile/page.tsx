'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, Avatar, Paper, Alert, CircularProgress } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/app/stores/useUserStore';
import { colors } from '@/lib/theme';

export default function ProfilePage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const loading = useUserStore((s) => s.loading);
  const fetchUser = useUserStore((s) => s.fetchUser);
  const setUser = useUserStore((s) => s.setUser);
  const logout = useUserStore((s) => s.logout);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user && loading) {
      fetchUser();
    }
  }, [user, loading, fetchUser]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Upload failed' });
      } else {
        setUser(data.user);
        setMessage({ type: 'success', text: 'Photo updated!' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload photo' });
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Append cache buster to avatar URL to force reload after upload
  const avatarSrc = user.avatarUrl ? `${user.avatarUrl}?t=${Date.now()}` : undefined;

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        px: 2,
        py: 4,
      }}>
      <Box sx={{ width: '100%', maxWidth: 500 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/')} sx={{ textTransform: 'none', mb: 2 }}>
          Back to recordings
        </Button>

        <Paper elevation={2} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {/* Avatar with upload overlay */}
            <Box sx={{ position: 'relative', cursor: 'pointer' }} onClick={handleAvatarClick}>
              <Avatar
                src={avatarSrc}
                sx={{
                  width: 120,
                  height: 120,
                  fontSize: '2.5rem',
                  bgcolor: colors.primary.main,
                  color: colors.primary.contrastText,
                }}>
                {initials}
              </Avatar>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: colors.primary.main,
                  color: colors.primary.contrastText,
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${colors.background.paper}`,
                  '&:hover': { bgcolor: colors.primary.dark },
                }}>
                {uploading ? (
                  <CircularProgress size={18} sx={{ color: colors.primary.contrastText }} />
                ) : (
                  <PhotoCameraIcon sx={{ fontSize: 18 }} />
                )}
              </Box>
            </Box>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <Typography variant="body2" color="text.secondary">
              Click to upload a photo
            </Typography>

            {message && (
              <Alert severity={message.type} sx={{ width: '100%' }}>
                {message.text}
              </Alert>
            )}

            {/* User info */}
            <Box sx={{ width: '100%', mt: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}>
                <Typography variant="body2" color="text.secondary">
                  Full Name
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {user.fullName}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}>
                <Typography variant="body2" color="text.secondary">
                  Username
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  @{user.username}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Member since
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={logout}
              sx={{ mt: 2, textTransform: 'none' }}>
              Sign Out
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
