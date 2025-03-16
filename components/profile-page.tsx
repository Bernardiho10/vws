'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Image from 'next/image';

export function ProfilePage() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState<string>(user || '');
  const [email, setEmail] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Create URL for the profile picture preview
  useEffect(() => {
    if (profilePicture) {
      const url = URL.createObjectURL(profilePicture);
      setProfilePictureUrl(url);
      
      // Clean up the URL when component unmounts or when file changes
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [profilePicture]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username || !email) {
      setError('Username and email are required');
      return;
    }
    // Here you can implement logic to update user profile information
    login(username);
    setError('');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setProfilePicture(event.target.files[0]);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {profilePictureUrl && (
            <div className="flex justify-center mb-4">
              <div className="relative rounded-full w-24 h-24 overflow-hidden">
                <Image 
                  src={profilePictureUrl} 
                  alt="Profile Preview" 
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="96px"
                  priority
                  aria-label="Profile picture preview" 
                />
              </div>
            </div>
          )}
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            aria-required="true"
          />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            aria-required="true"
          />
          <Input
            type="file"
            onChange={handleFileChange}
            aria-label="Profile Picture"
          />
          {error && <p className="text-red-500 text-sm" role="alert">{error}</p>}
          <Button type="submit" className="w-full">Update Profile</Button>
        </form>
      </CardContent>
    </Card>
  );
}
