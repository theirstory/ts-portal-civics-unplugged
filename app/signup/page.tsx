'use client';

import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/app/stores/useUserStore';
import { config, isAuthEnabled, requireSitePassword } from '@/config/organizationConfig';
import { colors } from '@/lib/theme';

export default function SignupPage() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [sitePassword, setSitePassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If auth is disabled, redirect to home
  if (!isAuthEnabled) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, username, sitePassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      setUser(data.user);
      router.push('/');
    } catch {
      setError('Failed to connect. Please try again.');
      setLoading(false);
    }
  };

  const organizationLogoPath = config.organization.logo?.path?.trim();
  const logoAlt = config.organization.logo?.alt?.trim() || `${config.organization.displayName} logo`;

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: colors.background.mainPage,
        px: 2,
        py: 4,
      }}>
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 440,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
        }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          {organizationLogoPath ? (
            <Box
              component="img"
              src={organizationLogoPath}
              alt={logoAlt}
              sx={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain', mb: 2 }}
            />
          ) : (
            <Typography variant="h5" fontWeight={700} color="primary" sx={{ mb: 1 }}>
              {config.organization.displayName}
            </Typography>
          )}
          <Typography variant="h5" fontWeight={600} sx={{ textAlign: 'center' }}>
            Welcome
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 0.5 }}>
            Create an account to explore the archive
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            fullWidth
            autoFocus
            autoComplete="name"
          />
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
            required
            fullWidth
            autoComplete="username"
            helperText="Letters, numbers, hyphens, and underscores only"
          />
          {requireSitePassword && (
            <TextField
              label="Site Password"
              type="password"
              value={sitePassword}
              onChange={(e) => setSitePassword(e.target.value)}
              required
              fullWidth
              autoComplete="off"
            />
          )}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || !fullName.trim() || !username.trim() || (requireSitePassword && !sitePassword)}
            sx={{ mt: 1, py: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '1rem' }}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
