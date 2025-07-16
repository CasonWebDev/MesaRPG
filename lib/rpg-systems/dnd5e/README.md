# D&D 5e Character Sheet Components

This directory contains the D&D 5e character sheet components copied from the standalone `dnd-character-sheet` project.

## Files Copied

### Core Files
- **types.ts** - Type definitions for D&D 5e character data
- **utils.ts** - Utility functions, constants, and character logic
- **character-sheet-wrapper.tsx** - Main wrapper component with tabs
- **front-page.tsx** - Front page of the character sheet (main stat page)

### UI Components
- **ui/ability-score.tsx** - Ability score display and controls
- **ui/bordered-box.tsx** - Styled bordered container
- **ui/character-nameplate-art.tsx** - Character name plate SVG art
- **ui/class-resource-tracker.tsx** - Class resource tracking component
- **ui/condition-tracker.tsx** - Condition and exhaustion tracking
- **ui/level-up-modal.tsx** - Level up modal dialog
- **ui/long-rest-modal.tsx** - Long rest confirmation modal
- **ui/short-rest-modal.tsx** - Short rest modal for hit dice
- **ui/stat-box.tsx** - Stat display boxes

## Import Adjustments Made

1. **Updated import paths** from `@/lib/dnd-types` to `./types`
2. **Updated import paths** from `@/lib/dnd-utils` to `./utils`
3. **Updated relative imports** within UI components to use relative paths
4. **Preserved shadcn/ui imports** (these should work in the MesaRPG project)

## Missing Components

The following components were referenced but not copied (would need to be copied separately if needed):
- **PersonalityPage** - Character personality and backstory page
- **SpellsPage** - Spells management page
- **CombatEquipmentPage** - Combat and equipment page
- **FeaturesPage** - Features and traits page

## Dependencies

This component system depends on:
- **shadcn/ui** components (already installed in MesaRPG)
- **lucide-react** icons (already installed in MesaRPG)
- **nanoid** for ID generation (may need to be installed)

## Integration Notes

To integrate these components into the MesaRPG project:

1. **Install missing dependencies** if needed:
   ```bash
   npm install nanoid
   ```

2. **Import the main component**:
   ```tsx
   import CharacterSheetWrapper from "@/lib/rpg-systems/dnd5e/character-sheet-wrapper"
   ```

3. **Use in your RPG system**:
   ```tsx
   <CharacterSheetWrapper />
   ```

## Character Data Structure

The character sheet uses a comprehensive Character interface with:
- Basic character info (name, class, level, etc.)
- Ability scores and modifiers
- Combat stats (HP, AC, initiative, etc.)
- Proficiencies and skills
- Equipment and inventory
- Spells and spell slots
- Class resources and features
- Personality traits and backstory

## Features Included

- **Ability Score Management** - Adjustable ability scores with calculated modifiers
- **Combat Stats** - AC, HP, initiative, saving throws
- **Skill System** - Complete D&D 5e skill list with proficiency tracking
- **Class Resources** - Automated class-specific resource tracking
- **Condition Tracking** - All D&D 5e conditions plus exhaustion
- **Rest System** - Short and long rest mechanics
- **Level Up System** - Guided level progression with HP calculation
- **Import/Export** - Character data persistence

## Notes

- The character sheet is in Portuguese (Brazilian Portuguese)
- All D&D 5e rules and calculations are implemented
- The UI uses a traditional D&D character sheet aesthetic
- Components are fully typed with TypeScript
- The system is modular and can be extended