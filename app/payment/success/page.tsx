"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    toast({
      title: "Pagamento Aprovado!",
      description: "Seus créditos foram adicionados à sua conta.",
      duration: 5000,
    });

    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="mt-4">Pagamento Bem-sucedido!</CardTitle>
          <CardDescription>Sua compra foi concluída e os créditos já estão disponíveis na sua conta.</CardDescription>
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
