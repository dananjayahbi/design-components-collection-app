"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { PageLoader } from '@/components/common';
import toast from 'react-hot-toast';

interface ProtectedPageProps {
  children: ReactNode;
  requireRole?: string[];
}

export default function ProtectedPage({ children, requireRole }: ProtectedPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("Please log in to access this page");
      router.push("/login");
    } else if (status === "authenticated" && requireRole && !requireRole.includes(session?.user?.role || "")) {
      toast.error("Access denied. Insufficient permissions.");
      router.push("/dashboard");
    }
  }, [status, session, router, requireRole]);

  if (status === "loading") {
    return <PageLoader />;
  }

  if (!session) {
    return null;
  }

  if (requireRole && !requireRole.includes(session.user.role || "")) {
    return null;
  }

  return <>{children}</>;
}
