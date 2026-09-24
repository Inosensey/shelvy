"use server"

import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  return (
    <AuthCard
      heading="Sign in"
      subheading="Welcome back — enter your details below."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-clay hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
