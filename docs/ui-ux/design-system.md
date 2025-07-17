# 🎨 Sistema de Design e UX

## 📋 Visão Geral

O MesaRPG implementa um sistema de design coeso e profissional, inspirado em elementos medievais e RPG, com foco em usabilidade, acessibilidade e experiência do usuário. O design combina elementos modernos com temática RPG para criar uma experiência imersiva.

## 🎭 Identidade Visual

### **Paleta de Cores**
```css
/* Primary Colors */
--primary: 13 84% 57%        /* #E84A33 - Vermelho RPG */
--primary-foreground: 0 0% 98%  /* #FAFAFA - Branco */

/* Secondary Colors */
--secondary: 215 28% 17%      /* #1E293B - Azul escuro */
--secondary-foreground: 0 0% 98%  /* #FAFAFA - Branco */

/* Background Colors */
--background: 0 0% 100%       /* #FFFFFF - Branco */
--foreground: 222 84% 5%      /* #0F172A - Preto suave */

/* Muted Colors */
--muted: 210 40% 96%          /* #F1F5F9 - Cinza claro */
--muted-foreground: 215 16% 47%  /* #64748B - Cinza médio */

/* Border Colors */
--border: 214 32% 91%         /* #E2E8F0 - Cinza borda */
--input: 214 32% 91%          /* #E2E8F0 - Input background */
--ring: 13 84% 57%            /* #E84A33 - Focus ring */

/* Semantic Colors */
--destructive: 0 84% 60%      /* #F87171 - Vermelho erro */
--destructive-foreground: 0 0% 98%  /* #FAFAFA - Branco */
--success: 142 76% 36%        /* #16A34A - Verde sucesso */
--warning: 45 93% 47%         /* #F59E0B - Amarelo aviso */
```

### **Tipografia**
```css
/* Fontes Principais */
--font-heading: 'Cinzel Decorative', serif;  /* Títulos medievais */
--font-body: 'Inter', sans-serif;            /* Texto geral */
--font-mono: 'JetBrains Mono', monospace;    /* Código e dados */

/* Escalas Tipográficas */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
```

### **Espaçamentos**
```css
/* Sistema de Grid 4px */
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
```

## 🧩 Componentes Base

### **Button System**
```typescript
// Variantes de botão
const buttonVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline"
}

// Tamanhos
const buttonSizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10"
}

// Exemplo de uso
<Button variant="default" size="sm">
  Criar Campanha
</Button>
```

### **Card System**
```typescript
// Componente Card base
export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
}

// Card com temática RPG
export function RPGCard({ children, title, icon }: RPGCardProps) {
  return (
    <Card className="bg-parchment border-gold shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-ink-text flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-ink-text">
        {children}
      </CardContent>
    </Card>
  )
}
```

### **Form Controls**
```typescript
// Input com validação visual
export function Input({ className, type, error, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-destructive",
        className
      )}
      {...props}
    />
  )
}

// Select customizado
export function Select({ children, ...props }: SelectProps) {
  return (
    <SelectPrimitive.Root {...props}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {children}
      </SelectContent>
    </SelectPrimitive.Root>
  )
}
```

## 🎮 Componentes Específicos RPG

### **Character Sheet Components**
```typescript
// Ability Score Display
export function AbilityScore({ ability, score, modifier, isEditable, onChange }: AbilityScoreProps) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <Label className="text-xs font-medium uppercase text-muted-foreground">
        {ability}
      </Label>
      <div className="flex flex-col items-center space-y-1">
        <Input
          type="number"
          value={score}
          onChange={(e) => onChange(parseInt(e.target.value) || 10)}
          disabled={!isEditable}
          className="w-16 h-12 text-lg font-bold text-center"
          min="1"
          max="30"
        />
        <div className="w-12 h-8 border border-foreground rounded-sm bg-muted flex items-center justify-center">
          <span className="text-sm font-bold">
            {modifier >= 0 ? '+' : ''}{modifier}
          </span>
        </div>
      </div>
    </div>
  )
}

// Skill Input with Roll Button
export function SkillInput({ name, ability, modifier, isProficient, onRoll }: SkillInputProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={isProficient}
        onCheckedChange={onProficiencyToggle}
        className="w-4 h-4"
      />
      <div className="flex h-6 w-8 items-center justify-center rounded-sm border border-foreground bg-muted text-sm font-bold">
        {modifier >= 0 ? '+' : ''}{modifier}
      </div>
      <Label className="flex-grow text-sm">
        <span className="text-xs text-muted-foreground">
          ({ability?.slice(0, 3) || ""})
        </span> {name}
      </Label>
      <Button
        variant="default"
        size="sm"
        onClick={onRoll}
        className="h-6 w-6 p-0"
      >
        <Dice6 className="h-3 w-3" />
      </Button>
    </div>
  )
}
```

### **Game UI Components**
```typescript
// Token Component
export function Token({ token, isSelected, onSelect, onMove }: TokenProps) {
  return (
    <div
      className={cn(
        "absolute cursor-pointer transition-all duration-200",
        "w-8 h-8 rounded-full border-2 bg-cover bg-center",
        isSelected && "ring-2 ring-primary ring-offset-2",
        token.hidden && "opacity-50"
      )}
      style={{
        left: token.x,
        top: token.y,
        borderColor: token.borderColor,
        backgroundImage: token.imageUrl ? `url(${token.imageUrl})` : undefined,
        backgroundColor: token.imageUrl ? undefined : '#6B7280'
      }}
      onClick={onSelect}
      onMouseDown={onMove}
    >
      {token.showName && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-black/75 text-white px-1 rounded whitespace-nowrap">
          {token.name}
        </div>
      )}
    </div>
  )
}

// Chat Message Component
export function ChatMessage({ message, isOwn }: ChatMessageProps) {
  const getMessageIcon = (type: MessageType) => {
    switch (type) {
      case 'DICE_ROLL':
        return <Dice6 className="w-4 h-4 text-primary" />
      case 'SYSTEM':
        return <Info className="w-4 h-4 text-blue-500" />
      case 'OOC':
        return <MessageCircle className="w-4 h-4 text-gray-500" />
      default:
        return null
    }
  }

  return (
    <div className={cn(
      "flex gap-2 p-2 rounded-lg",
      isOwn ? "bg-primary/10 ml-8" : "bg-muted/50 mr-8"
    )}>
      <div className="flex-shrink-0">
        {getMessageIcon(message.type)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">{message.user.name}</span>
          <span>{formatTime(message.createdAt)}</span>
        </div>
        <div className="text-sm mt-1">
          {message.type === 'DICE_ROLL' ? (
            <DiceRollDisplay roll={JSON.parse(message.metadata)} />
          ) : (
            message.message
          )}
        </div>
      </div>
    </div>
  )
}
```

## 📱 Responsividade

### **Breakpoints**
```css
/* Tailwind CSS breakpoints */
sm: 640px    /* Small devices */
md: 768px    /* Medium devices */
lg: 1024px   /* Large devices */
xl: 1280px   /* Extra large devices */
2xl: 1536px  /* 2X large devices */
```

### **Responsive Grid System**
```typescript
// Layout responsivo para ficha de personagem
export function CharacterSheetLayout({ children }: LayoutProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar - esconde em mobile */}
      <div className="hidden lg:block lg:col-span-1">
        <CharacterSidebar />
      </div>
      
      {/* Main content - responsivo */}
      <div className="col-span-1 lg:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// Tactical grid responsivo
export function TacticalGrid({ width = 800, height = 600 }: GridProps) {
  return (
    <div className="relative overflow-auto">
      <div 
        className="relative bg-grid-pattern border-2 border-muted mx-auto"
        style={{
          width: Math.min(width, window.innerWidth - 32),
          height: Math.min(height, window.innerHeight - 200)
        }}
      >
        {/* Grid content */}
      </div>
    </div>
  )
}
```

## 🌙 Sistema de Temas

### **Theme Provider**
```typescript
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

### **Dark Mode Colors**
```css
/* Dark mode palette */
.dark {
  --background: 222 84% 5%;           /* #0F172A */
  --foreground: 210 40% 98%;          /* #F8FAFC */
  --primary: 13 84% 57%;              /* #E84A33 - Unchanged */
  --primary-foreground: 0 0% 98%;     /* #FAFAFA */
  --secondary: 217 33% 17%;           /* #1E293B */
  --secondary-foreground: 0 0% 98%;   /* #FAFAFA */
  --muted: 215 28% 17%;               /* #1E293B */
  --muted-foreground: 215 16% 65%;    /* #94A3B8 */
  --border: 215 28% 17%;              /* #1E293B */
  --input: 215 28% 17%;               /* #1E293B */
}
```

## ♿ Acessibilidade

### **ARIA Implementation**
```typescript
// Componente acessível
export function AccessibleButton({ 
  children, 
  ariaLabel, 
  ariaDescribedBy,
  onClick 
}: AccessibleButtonProps) {
  return (
    <button
      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// Skip navigation
export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-primary text-primary-foreground p-2 rounded-br-lg z-50"
    >
      Pular para o conteúdo principal
    </a>
  )
}
```

### **Keyboard Navigation**
```typescript
// Hook para navegação por teclado
export function useKeyboardNavigation(items: NavItem[]) {
  const [focusedIndex, setFocusedIndex] = useState(0)

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setFocusedIndex((prev) => (prev + 1) % items.length)
        break
      case 'ArrowUp':
        event.preventDefault()
        setFocusedIndex((prev) => (prev - 1 + items.length) % items.length)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        items[focusedIndex].onClick()
        break
      case 'Escape':
        event.preventDefault()
        setFocusedIndex(0)
        break
    }
  }

  return { focusedIndex, handleKeyDown }
}
```

## 🎨 Animações e Transições

### **Micro-interactions**
```css
/* Smooth transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}

.transition-colors {
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
}

/* Hover effects */
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Loading animations */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Fade animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

### **Toast Notifications**
```typescript
export function Toast({ message, type, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for animation
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300",
      isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full",
      type === 'success' && "bg-green-500 text-white",
      type === 'error' && "bg-red-500 text-white",
      type === 'info' && "bg-blue-500 text-white"
    )}>
      <div className="flex items-center gap-2">
        {type === 'success' && <CheckCircle className="w-5 h-5" />}
        {type === 'error' && <XCircle className="w-5 h-5" />}
        {type === 'info' && <Info className="w-5 h-5" />}
        <span>{message}</span>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-2 hover:opacity-70"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
```

## 📊 Performance Visual

### **Loading States**
```typescript
// Skeleton loader
export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-full"></div>
    </div>
  )
}

// Lazy image loading
export function LazyImage({ src, alt, className, ...props }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={imgRef} className={cn("relative", className)}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded" />
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          {...props}
        />
      )}
    </div>
  )
}
```

## 🔧 Customização

### **CSS Variables**
```css
/* Customizable theme variables */
:root {
  /* Brand colors */
  --brand-primary: #E84A33;
  --brand-secondary: #1E293B;
  
  /* RPG theme colors */
  --parchment: #F7F3E9;
  --gold: #FFD700;
  --ink-text: #2D1B07;
  --medieval-brown: #8B4513;
  
  /* Component specific */
  --dice-color: var(--brand-primary);
  --grid-line-color: #E5E7EB;
  --token-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
```

### **Component Theming**
```typescript
// Themeable component
export function ThemedCard({ variant = 'default', children }: ThemedCardProps) {
  const variants = {
    default: "bg-card border-border",
    parchment: "bg-parchment border-gold",
    dark: "bg-gray-800 border-gray-600",
    danger: "bg-red-50 border-red-200"
  }

  return (
    <div className={cn(
      "rounded-lg border p-4 shadow-sm",
      variants[variant]
    )}>
      {children}
    </div>
  )
}
```

## 📝 Conclusão

O sistema de design do MesaRPG é **coeso, acessível e extensível**, oferecendo:

- ✅ **Identidade visual** consistente com temática RPG
- ✅ **Componentes reutilizáveis** e bem estruturados
- ✅ **Responsividade** completa para todos os dispositivos
- ✅ **Acessibilidade** com ARIA e navegação por teclado
- ✅ **Performance visual** com loading states
- ✅ **Customização** através de CSS variables
- ✅ **Animações** sutis e profissionais

**Status**: Sistema de design maduro e production-ready, pronto para extensões futuras.

---

*Documentação atualizada em: Janeiro 2025*  
*Próxima revisão: Expansão para mobile-first*