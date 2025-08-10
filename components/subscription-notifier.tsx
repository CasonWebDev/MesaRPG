"use client"

import { useEffect } from "react"
import { toast } from "sonner"

interface SubscriptionNotifierProps {
  notification: {
    planExpired: boolean
    planStartedAt?: string | null
    planExpiresAt?: string | null
  } | null
}

export function SubscriptionNotifier({ notification }: SubscriptionNotifierProps) {
  useEffect(() => {
    if (notification?.planExpired) {
      const timer = setTimeout(() => {
        toast.info("Seu plano expirou", {
          description: `Seu plano contratado em ${new Date(notification.planStartedAt!).toLocaleDateString('pt-BR')} expirou em ${new Date(notification.planExpiresAt!).toLocaleDateString('pt-BR')}. Você foi movido para o plano Gratuito.`,
          duration: 10000,
        });
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  return null
}
