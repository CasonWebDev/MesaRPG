"use client";

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

function CancelSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expiresAt = searchParams.get('expiresAt');

  const formattedDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'final do período atual';

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="mt-4">Cancelamento Agendado!</CardTitle>
          <CardDescription>
            Sua assinatura foi agendada para cancelamento e permanecerá ativa até{" "}
            <strong>{formattedDate}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Você será redirecionado para o dashboard em 3 segundos...
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/dashboard" className="w-full">
            <Button className="w-full">Ir para o Dashboard Agora</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PaymentCancelSuccessPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <CancelSuccessContent />
    </Suspense>
  );
}
