'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext"; 
import { useRouter } from 'next/navigation'; 
import Link from 'next/link';
import React, { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); 
  const { login } = useAuth(); 
  const router = useRouter(); 

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null); 

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const response = await fetch(`${backendUrl}/api/v1/auth/jwt/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (response.ok) {
        const data = await response.json();
        login({ token: data.access_token, /* other user details */ });
        router.push('/dashboard'); 
      } else {
        let errorMessage = 'Login failed. Please check your credentials.';
        try {
            const errorData = await response.json();
            if (errorData.detail) {
                errorMessage = errorData.detail;
            }
        } catch (e) {
            console.error('Error parsing error response:', e);
        }
        setError(errorMessage);
        console.error('Login failed:', response.status, response.statusText);
      }
    } catch (error) {
      setError('An error occurred during login. Please try again.');
      console.error('Login request error:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="mb-6 text-2xl font-semibold text-center">ImportCSV Admin</h2>
        <form onSubmit={handleLogin}>
          {error && <p className="mb-4 text-red-500 text-sm text-center">{error}</p>} 
          <div className="mb-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="mb-6">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full">Login</Button>
        </form>
        
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
