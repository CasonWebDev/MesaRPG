import {
  calculateAbilityModifier,
  calculateProficiencyBonus,
  calculateInitialHitPoints,
  calculateSpellSaveDC,
  calculateSpellAttackBonus,
  getSpellSlotsForClass,
  applySpellSlotsToCharacter,
  evaluateResourceFormula,
  applyClassResourcesToCharacter,
  applyClassProficienciesToCharacter,
  applyHitDiceToCharacter,
  CLASS_DATA,
  SPELL_SLOTS_BY_CLASS_LEVEL,
  initialCharacter,
} from '@/lib/dnd-utils'
import type { Character } from '@/lib/dnd-types'

describe('DnD Utils', () => {
  describe('calculateAbilityModifier', () => {
    it('should calculate correct ability modifiers', () => {
      expect(calculateAbilityModifier(10)).toBe(0)
      expect(calculateAbilityModifier(11)).toBe(0)
      expect(calculateAbilityModifier(12)).toBe(1)
      expect(calculateAbilityModifier(13)).toBe(1)
      expect(calculateAbilityModifier(14)).toBe(2)
      expect(calculateAbilityModifier(15)).toBe(2)
      expect(calculateAbilityModifier(16)).toBe(3)
      expect(calculateAbilityModifier(17)).toBe(3)
      expect(calculateAbilityModifier(18)).toBe(4)
      expect(calculateAbilityModifier(20)).toBe(5)
    })

    it('should handle low ability scores', () => {
      expect(calculateAbilityModifier(8)).toBe(-1)
      expect(calculateAbilityModifier(9)).toBe(-1)
      expect(calculateAbilityModifier(6)).toBe(-2)
      expect(calculateAbilityModifier(7)).toBe(-2)
      expect(calculateAbilityModifier(1)).toBe(-5)
    })

    it('should handle high ability scores', () => {
      expect(calculateAbilityModifier(22)).toBe(6)
      expect(calculateAbilityModifier(24)).toBe(7)
      expect(calculateAbilityModifier(30)).toBe(10)
    })

    it('should handle invalid inputs', () => {
      expect(calculateAbilityModifier(NaN)).toBe(0)
      expect(calculateAbilityModifier(undefined as any)).toBe(0)
      expect(calculateAbilityModifier(null as any)).toBe(0)
    })
  })

  describe('calculateProficiencyBonus', () => {
    it('should calculate correct proficiency bonus by level', () => {
      expect(calculateProficiencyBonus(1)).toBe(2)
      expect(calculateProficiencyBonus(2)).toBe(2)
      expect(calculateProficiencyBonus(3)).toBe(2)
      expect(calculateProficiencyBonus(4)).toBe(2)
      expect(calculateProficiencyBonus(5)).toBe(3)
      expect(calculateProficiencyBonus(6)).toBe(3)
      expect(calculateProficiencyBonus(7)).toBe(3)
      expect(calculateProficiencyBonus(8)).toBe(3)
      expect(calculateProficiencyBonus(9)).toBe(4)
      expect(calculateProficiencyBonus(10)).toBe(4)
      expect(calculateProficiencyBonus(11)).toBe(4)
      expect(calculateProficiencyBonus(12)).toBe(4)
      expect(calculateProficiencyBonus(13)).toBe(5)
      expect(calculateProficiencyBonus(14)).toBe(5)
      expect(calculateProficiencyBonus(15)).toBe(5)
      expect(calculateProficiencyBonus(16)).toBe(5)
      expect(calculateProficiencyBonus(17)).toBe(6)
      expect(calculateProficiencyBonus(18)).toBe(6)
      expect(calculateProficiencyBonus(19)).toBe(6)
      expect(calculateProficiencyBonus(20)).toBe(6)
    })

    it('should handle invalid inputs', () => {
      expect(calculateProficiencyBonus(NaN)).toBe(2)
      expect(calculateProficiencyBonus(undefined as any)).toBe(2)
      expect(calculateProficiencyBonus(null as any)).toBe(2)
    })
  })

  describe('calculateInitialHitPoints', () => {
    it('should calculate correct initial hit points for different classes', () => {
      expect(calculateInitialHitPoints(2, 'Bárbaro')).toBe(14) // 12 + 2
      expect(calculateInitialHitPoints(1, 'Guerreiro')).toBe(11) // 10 + 1
      expect(calculateInitialHitPoints(0, 'Clérigo')).toBe(8) // 8 + 0
      expect(calculateInitialHitPoints(-1, 'Mago')).toBe(5) // 6 + (-1)
      expect(calculateInitialHitPoints(3, 'Monge')).toBe(11) // 8 + 3
    })

    it('should handle minimum hit points', () => {
      expect(calculateInitialHitPoints(-5, 'Mago')).toBe(1) // 6 + (-5) = 1, minimum 1
    })

    it('should handle unknown classes', () => {
      expect(calculateInitialHitPoints(2, 'UnknownClass' as any)).toBe(2) // Falls back to modifier
    })
  })

  describe('calculateSpellSaveDC', () => {
    it('should calculate correct spell save DC', () => {
      expect(calculateSpellSaveDC(2, 3)).toBe(13) // 8 + 2 + 3
      expect(calculateSpellSaveDC(3, 4)).toBe(15) // 8 + 3 + 4
      expect(calculateSpellSaveDC(6, 5)).toBe(19) // 8 + 6 + 5
    })

    it('should handle negative modifiers', () => {
      expect(calculateSpellSaveDC(2, -1)).toBe(9) // 8 + 2 + (-1)
    })
  })

  describe('calculateSpellAttackBonus', () => {
    it('should calculate correct spell attack bonus', () => {
      expect(calculateSpellAttackBonus(2, 3)).toBe(5) // 2 + 3
      expect(calculateSpellAttackBonus(3, 4)).toBe(7) // 3 + 4
      expect(calculateSpellAttackBonus(6, 5)).toBe(11) // 6 + 5
    })

    it('should handle negative modifiers', () => {
      expect(calculateSpellAttackBonus(2, -1)).toBe(1) // 2 + (-1)
    })
  })

  describe('getSpellSlotsForClass', () => {
    it('should return correct spell slots for full casters', () => {
      expect(getSpellSlotsForClass('Mago', 1)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0])
      expect(getSpellSlotsForClass('Mago', 3)).toEqual([4, 2, 0, 0, 0, 0, 0, 0, 0])
      expect(getSpellSlotsForClass('Mago', 5)).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0])
      expect(getSpellSlotsForClass('Mago', 20)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1])
    })

    it('should return correct spell slots for half casters', () => {
      expect(getSpellSlotsForClass('Paladino', 1)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0])
      expect(getSpellSlotsForClass('Paladino', 2)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0])
      expect(getSpellSlotsForClass('Ranger', 5)).toEqual([4, 2, 0, 0, 0, 0, 0, 0, 0])
    })

    it('should return correct spell slots for third casters', () => {
      expect(getSpellSlotsForClass('Guerreiro (Cavaleiro Élfico)', 3)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0])
      expect(getSpellSlotsForClass('Ladino (Trapaceiro Arcano)', 7)).toEqual([4, 2, 0, 0, 0, 0, 0, 0, 0])
    })

    it('should handle unknown classes', () => {
      expect(getSpellSlotsForClass('UnknownClass', 5)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0])
    })

    it('should handle invalid levels', () => {
      expect(getSpellSlotsForClass('Mago', 0)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0])
      expect(getSpellSlotsForClass('Mago', 21)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0])
    })
  })

  describe('applySpellSlotsToCharacter', () => {
    it('should apply spell slots to character', () => {
      const character: Character = {
        ...initialCharacter,
        class: 'Mago',
        level: 3,
        spells: {
          ...initialCharacter.spells,
          1: { slotsTotal: 2, slotsExpended: 1, spells: [] },
          2: { slotsTotal: 0, slotsExpended: 0, spells: [] },
        },
      }

      const result = applySpellSlotsToCharacter(character)

      expect(result.spells[1].slotsTotal).toBe(4) // Level 3 wizard gets 4 1st level slots
      expect(result.spells[1].slotsExpended).toBe(1) // Preserve expended slots
      expect(result.spells[2].slotsTotal).toBe(2) // Level 3 wizard gets 2 2nd level slots
      expect(result.spells[2].slotsExpended).toBe(0) // Preserve expended slots
    })

    it('should reset expended slots if they exceed new total', () => {
      const character: Character = {
        ...initialCharacter,
        class: 'Mago',
        level: 1,
        spells: {
          ...initialCharacter.spells,
          1: { slotsTotal: 4, slotsExpended: 3, spells: [] },
        },
      }

      const result = applySpellSlotsToCharacter(character)

      expect(result.spells[1].slotsTotal).toBe(2) // Level 1 wizard gets 2 1st level slots
      expect(result.spells[1].slotsExpended).toBe(2) // Reduced to match new total
    })
  })

  describe('evaluateResourceFormula', () => {
    const mockCharacter: Character = {
      ...initialCharacter,
      level: 5,
    }

    const mockCalculatedStats = {
      proficiencyBonus: 3,
      abilityModifiers: {
        forca: 2,
        destreza: 1,
        constituicao: 3,
        inteligencia: 0,
        sabedoria: 2,
        carisma: 1,
      },
    }

    it('should evaluate simple level formulas', () => {
      expect(evaluateResourceFormula('level', mockCharacter, mockCalculatedStats)).toBe(5)
      expect(evaluateResourceFormula('level * 2', mockCharacter, mockCalculatedStats)).toBe(10)
    })

    it('should evaluate modifier formulas', () => {
      expect(evaluateResourceFormula('modWis', mockCharacter, mockCalculatedStats)).toBe(2)
      expect(evaluateResourceFormula('modCha', mockCharacter, mockCalculatedStats)).toBe(1)
      expect(evaluateResourceFormula('level + modWis', mockCharacter, mockCalculatedStats)).toBe(7)
    })

    it('should evaluate complex formulas', () => {
      expect(evaluateResourceFormula('level <= 2 ? 2 : level <= 5 ? 3 : 4', mockCharacter, mockCalculatedStats)).toBe(3)
      expect(evaluateResourceFormula('level <= 16 ? 1 : 2', mockCharacter, mockCalculatedStats)).toBe(1)
    })

    it('should handle invalid formulas', () => {
      // For invalid formulas, the function should return 0 or handle gracefully
      const result1 = evaluateResourceFormula('invalid syntax', mockCharacter, mockCalculatedStats)
      const result2 = evaluateResourceFormula('', mockCharacter, mockCalculatedStats)
      
      // Accept either 0 or NaN as valid results for invalid input
      expect(result1 === 0 || isNaN(result1)).toBe(true)
      expect(result2 === 0 || isNaN(result2)).toBe(true)
    })
  })

  describe('applyClassResourcesToCharacter', () => {
    it('should apply class resources to character', () => {
      const character: Character = {
        ...initialCharacter,
        class: 'Bárbaro',
        level: 3,
        classResources: [],
      }

      const mockCalculatedStats = {
        proficiencyBonus: 2,
        abilityModifiers: {
          forca: 3,
          destreza: 2,
          constituicao: 2,
          inteligencia: 0,
          sabedoria: 1,
          carisma: 0,
        },
      }

      const result = applyClassResourcesToCharacter(character, mockCalculatedStats)

      expect(result.classResources).toHaveLength(1)
      expect(result.classResources[0].name).toBe('Fúria')
      expect(result.classResources[0].max).toBe(3) // Level 3 barbarian gets 3 rages
      expect(result.classResources[0].current).toBe(3) // Start at full
    })

    it('should preserve existing resource values', () => {
      const character: Character = {
        ...initialCharacter,
        class: 'Bárbaro',
        level: 5,
        classResources: [
          {
            id: 'class_furia',
            name: 'Fúria',
            max: 3,
            current: 1, // Partially used
          },
        ],
      }

      const mockCalculatedStats = {
        proficiencyBonus: 3,
        abilityModifiers: {
          forca: 3,
          destreza: 2,
          constituicao: 2,
          inteligencia: 0,
          sabedoria: 1,
          carisma: 0,
        },
      }

      const result = applyClassResourcesToCharacter(character, mockCalculatedStats)

      expect(result.classResources[0].max).toBe(3) // Level 5 barbarian still gets 3 rages
      expect(result.classResources[0].current).toBe(1) // Preserve current value
    })

    it('should handle custom resources', () => {
      const character: Character = {
        ...initialCharacter,
        class: 'Guerreiro',
        level: 3,
        classResources: [
          {
            id: 'custom_1',
            name: 'Custom Resource',
            max: 5,
            current: 3,
          },
        ],
      }

      const mockCalculatedStats = {
        proficiencyBonus: 2,
        abilityModifiers: {
          forca: 3,
          destreza: 2,
          constituicao: 2,
          inteligencia: 0,
          sabedoria: 1,
          carisma: 0,
        },
      }

      const result = applyClassResourcesToCharacter(character, mockCalculatedStats)

      // Should have both class resource (Action Surge) and custom resource
      expect(result.classResources).toHaveLength(2)
      expect(result.classResources.find(r => r.name === 'Custom Resource')).toBeDefined()
      expect(result.classResources.find(r => r.name === 'Surto de Ação')).toBeDefined()
    })
  })

  describe('applyClassProficienciesToCharacter', () => {
    it('should apply class proficiencies to character', () => {
      const character: Character = {
        ...initialCharacter,
        class: 'Guerreiro',
      }

      const result = applyClassProficienciesToCharacter(character)

      expect(result.armorProficiencies).toContain('Todas as Armaduras')
      expect(result.armorProficiencies).toContain('Escudos')
      expect(result.weaponProficiencies).toContain('Armas Simples')
      expect(result.weaponProficiencies).toContain('Armas Marciais')
      expect(result.savingThrowProficiencies).toContain('forca')
      expect(result.savingThrowProficiencies).toContain('constituicao')
      expect(result.spellcastingAbility).toBeNull()
    })

    it('should apply spellcasting ability for spellcasters', () => {
      const character: Character = {
        ...initialCharacter,
        class: 'Mago',
      }

      const result = applyClassProficienciesToCharacter(character)

      expect(result.spellcastingAbility).toBe('inteligencia')
    })

    it('should handle unknown classes', () => {
      const character: Character = {
        ...initialCharacter,
        class: 'UnknownClass',
      }

      const result = applyClassProficienciesToCharacter(character)

      expect(result).toEqual(character) // Should return unchanged
    })
  })

  describe('applyHitDiceToCharacter', () => {
    it('should apply correct hit dice to character', () => {
      const character: Character = {
        ...initialCharacter,
        class: 'Bárbaro',
        level: 5,
      }

      const result = applyHitDiceToCharacter(character)

      expect(result.hitDice).toBe('5d12')
    })

    it('should handle different classes', () => {
      const wizardCharacter: Character = {
        ...initialCharacter,
        class: 'Mago',
        level: 3,
      }

      const result = applyHitDiceToCharacter(wizardCharacter)

      expect(result.hitDice).toBe('3d6')
    })

    it('should handle unknown classes', () => {
      const character: Character = {
        ...initialCharacter,
        class: 'UnknownClass',
        level: 3,
      }

      const result = applyHitDiceToCharacter(character)

      expect(result).toEqual(character) // Should return unchanged
    })
  })

  describe('CLASS_DATA', () => {
    it('should contain all expected classes', () => {
      const expectedClasses = [
        'Bárbaro', 'Bardo', 'Clérigo', 'Druida', 'Feiticeiro',
        'Guerreiro', 'Ladino', 'Mago', 'Monge', 'Paladino', 'Ranger'
      ]

      expectedClasses.forEach(className => {
        expect(CLASS_DATA).toHaveProperty(className)
      })
    })

    it('should have valid hit dice for all classes', () => {
      Object.values(CLASS_DATA).forEach(classData => {
        expect(classData.hitDie).toBeGreaterThan(0)
        expect(classData.hitDie).toBeLessThanOrEqual(12)
        expect([6, 8, 10, 12]).toContain(classData.hitDie)
      })
    })

    it('should have valid saving throw proficiencies', () => {
      const validAbilities = ['forca', 'destreza', 'constituicao', 'inteligencia', 'sabedoria', 'carisma']
      
      Object.values(CLASS_DATA).forEach(classData => {
        expect(classData.savingThrows).toHaveLength(2)
        classData.savingThrows.forEach(ability => {
          expect(validAbilities).toContain(ability)
        })
      })
    })
  })

  describe('SPELL_SLOTS_BY_CLASS_LEVEL', () => {
    it('should have 20 levels for each class', () => {
      Object.values(SPELL_SLOTS_BY_CLASS_LEVEL).forEach(classSlots => {
        expect(classSlots).toHaveLength(20)
      })
    })

    it('should have 9 spell levels for each character level', () => {
      Object.values(SPELL_SLOTS_BY_CLASS_LEVEL).forEach(classSlots => {
        classSlots.forEach(levelSlots => {
          expect(levelSlots).toHaveLength(9)
        })
      })
    })

    it('should have non-negative spell slot values', () => {
      Object.values(SPELL_SLOTS_BY_CLASS_LEVEL).forEach(classSlots => {
        classSlots.forEach(levelSlots => {
          levelSlots.forEach(slotCount => {
            expect(slotCount).toBeGreaterThanOrEqual(0)
          })
        })
      })
    })
  })
})