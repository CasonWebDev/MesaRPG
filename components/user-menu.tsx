"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { User, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditProfileDialog } from "./edit-profile-dialog"

interface UserMenuProps {
  user: {
    name: string
    email: string
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden md:block">
        Olá, {user.name}
      </span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
            <span className="sr-only">Menu do usuário</span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {user.email}
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setIsEditProfileOpen(true)}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            Editar Perfil
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleLogout}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProfileDialog 
        user={user}
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
      />
    </div>
  )
}