// Teste básico para funções matemáticas simples
describe('Basic Math Functions', () => {
  // Função simples para testar
  const add = (a, b) => a + b
  const multiply = (a, b) => a * b
  const divide = (a, b) => b !== 0 ? a / b : 0

  describe('Addition', () => {
    test('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5)
    })

    test('should add negative numbers', () => {
      expect(add(-2, -3)).toBe(-5)
    })

    test('should add zero', () => {
      expect(add(5, 0)).toBe(5)
    })
  })

  describe('Multiplication', () => {
    test('should multiply two numbers', () => {
      expect(multiply(3, 4)).toBe(12)
    })

    test('should multiply by zero', () => {
      expect(multiply(5, 0)).toBe(0)
    })

    test('should multiply negative numbers', () => {
      expect(multiply(-2, 3)).toBe(-6)
    })
  })

  describe('Division', () => {
    test('should divide two numbers', () => {
      expect(divide(10, 2)).toBe(5)
    })

    test('should handle division by zero', () => {
      expect(divide(10, 0)).toBe(0)
    })

    test('should divide negative numbers', () => {
      expect(divide(-10, 2)).toBe(-5)
    })
  })
})