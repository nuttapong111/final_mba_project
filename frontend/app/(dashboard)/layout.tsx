'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getRoleDashboardPath } from '@/lib/roleConfig';
import Header from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  
  // Check if current path is a full-screen page (content page)
  const isFullScreenPage = pathname?.includes('/content/') || false;

  useEffect(() => {
    // Check authentication on mount
    const verifyAuth = async () => {
      setIsChecking(true);
      try {
        // First check localStorage for quick auth check
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          const storedUser = localStorage.getItem('user');
          
          if (token && storedUser) {
            // User has token, verify with API
            await checkAuth();
            const { isAuthenticated: auth, user: currentUser } = useAuthStore.getState();
            
            if (auth && currentUser) {
              // Redirect to role-specific dashboard if on generic dashboard
              const currentPath = window.location.pathname;
              if (currentPath === '/dashboard' || currentPath.startsWith('/dashboard/')) {
                const rolePath = getRoleDashboardPath(currentUser.role);
                router.replace(rolePath);
              }
              setIsChecking(false);
              return;
            }
          }
        }
        
        // No token or auth failed
        const { isAuthenticated: auth, user: currentUser } = useAuthStore.getState();
        if (!auth || !currentUser) {
          router.replace('/login');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.replace('/login');
      } finally {
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [router, checkAuth]);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {isFullScreenPage ? (
        <main className="w-full h-[calc(100vh-64px)] overflow-hidden">
          {children}
        </main>
      ) : (
        <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      )}
    </div>
  );
}
