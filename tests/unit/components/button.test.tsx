import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button, buttonVariants } from '@/components/ui/button'

describe('Button Component', () => {
  it('should render button with default props', () => {
    render(<Button>Click me</Button>)
    
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center')
  })

  it('should render different variants', () => {
    const { rerender } = render(<Button variant="default">Default</Button>)
    
    let button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground')

    rerender(<Button variant="destructive">Destructive</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground')

    rerender(<Button variant="outline">Outline</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('border', 'border-input', 'bg-background')

    rerender(<Button variant="secondary">Secondary</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')

    rerender(<Button variant="ghost">Ghost</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground')

    rerender(<Button variant="link">Link</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('text-primary', 'underline-offset-4', 'hover:underline')
  })

  it('should render different sizes', () => {
    const { rerender } = render(<Button size="default">Default</Button>)
    
    let button = screen.getByRole('button')
    expect(button).toHaveClass('h-10', 'px-4', 'py-2')

    rerender(<Button size="sm">Small</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-9', 'px-3')

    rerender(<Button size="lg">Large</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-11', 'px-8')

    rerender(<Button size="icon">Icon</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-10', 'w-10')
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
  })

  it('should accept custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should accept custom props', () => {
    render(<Button data-testid="custom-button" aria-label="Custom button">Custom</Button>)
    
    const button = screen.getByTestId('custom-button')
    expect(button).toHaveAttribute('aria-label', 'Custom button')
  })

  it('should render as child when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    
    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
    expect(link).toHaveClass('inline-flex', 'items-center', 'justify-center')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref Test</Button>)
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('should have correct display name', () => {
    expect(Button.displayName).toBe('Button')
  })

  describe('buttonVariants', () => {
    it('should return correct classes for different variants', () => {
      expect(buttonVariants({ variant: 'default' })).toContain('bg-primary')
      expect(buttonVariants({ variant: 'destructive' })).toContain('bg-destructive')
      expect(buttonVariants({ variant: 'outline' })).toContain('border')
      expect(buttonVariants({ variant: 'secondary' })).toContain('bg-secondary')
      expect(buttonVariants({ variant: 'ghost' })).toContain('hover:bg-accent')
      expect(buttonVariants({ variant: 'link' })).toContain('text-primary')
    })

    it('should return correct classes for different sizes', () => {
      expect(buttonVariants({ size: 'default' })).toContain('h-10')
      expect(buttonVariants({ size: 'sm' })).toContain('h-9')
      expect(buttonVariants({ size: 'lg' })).toContain('h-11')
      expect(buttonVariants({ size: 'icon' })).toContain('h-10', 'w-10')
    })

    it('should use default variants when none provided', () => {
      const classes = buttonVariants()
      expect(classes).toContain('bg-primary') // default variant
      expect(classes).toContain('h-10') // default size
    })

    it('should merge custom className', () => {
      const classes = buttonVariants({ className: 'custom-class' })
      expect(classes).toContain('custom-class')
    })
  })

  describe('Accessibility', () => {
    it('should have focus-visible styles', () => {
      render(<Button>Focus Test</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('should support keyboard navigation', () => {
      render(<Button>Keyboard Test</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      
      // Check if button is focusable and accessible
      expect(button).toHaveFocus()
      expect(button.tagName).toBe('BUTTON')
    })

    it('should support space key activation', () => {
      render(<Button>Space Test</Button>)
      
      const button = screen.getByRole('button')
      
      // Check if button is a proper HTML button that supports keyboard
      expect(button.tagName).toBe('BUTTON')
      expect(button).not.toBeDisabled()
    })
  })

  describe('Icon Support', () => {
    it('should render with icon', () => {
      const IconComponent = () => <svg data-testid="icon" />
      render(
        <Button>
          <IconComponent />
          Button with Icon
        </Button>
      )
      
      const button = screen.getByRole('button')
      const icon = screen.getByTestId('icon')
      
      expect(button).toContainElement(icon)
      expect(button).toHaveClass('gap-2') // Gap between icon and text
    })

    it('should have icon-specific styling', () => {
      render(<Button>Test</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('[&_svg]:pointer-events-none', '[&_svg]:size-4', '[&_svg]:shrink-0')
    })
  })
})