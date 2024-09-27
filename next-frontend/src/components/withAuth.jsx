"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function withAuth(WrappedComponent) {
  return function WithAuth(props) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !user) {
        router.push("/login");
      }
    }, [user, isLoading, router]);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!user) {
      router.push("/login");
      // return null;
    }

    return <WrappedComponent {...props} />;
  };
}
