"use client"

import { Input } from "@/components/ui/input"
import { BorderedBox } from "./bordered-box"

interface CurrencyTrackerProps {
  currencies: {
    copper: number
    silver: number
    electrum: number
    gold: number
    platinum: number
  }
  onUpdate: (field: string, value: number) => void
  className?: string
}

export const CurrencyTracker = ({ currencies, onUpdate, className }: CurrencyTrackerProps) => {
  const currencyTypes = [
    { key: 'copper', label: 'PC', value: currencies.copper },
    { key: 'silver', label: 'PP', value: currencies.silver },
    { key: 'electrum', label: 'PE', value: currencies.electrum },
    { key: 'gold', label: 'PO', value: currencies.gold },
    { key: 'platinum', label: 'PL', value: currencies.platinum }
  ]

  return (
    <BorderedBox className={`p-3 ${className}`}>
      <h3 className="font-bold text-sm mb-2 text-center border-b border-gray-300 pb-1">
        Moedas
      </h3>
      <div className="grid grid-cols-5 gap-2">
        {currencyTypes.map((currency) => (
          <div key={currency.key} className="text-center">
            <div className="border rounded-md p-2 bg-gray-50">
              <Input
                type="number"
                min="0"
                value={currency.value || ''}
                onChange={(e) => onUpdate(currency.key, parseInt(e.target.value) || 0)}
                className="w-full text-center text-sm border-0 bg-transparent p-0 h-8"
                placeholder="0"
              />
            </div>
            <label className="text-xs font-bold mt-1 block">
              {currency.label}
            </label>
          </div>
        ))}
      </div>
    </BorderedBox>
  )
}