# CSV Importer - Development Tasks

## <¯ Current Focus: Performance & Bundle Size Optimization

### Bundle Size Status
- **Current:** 1.6MB uncompressed
- **Target:** <200KB uncompressed (~60KB gzipped)
- **Savings Potential:** ~90% reduction

---

## Priority 1: Performance & Bundle Size Optimization =€

### Phase 1: Immediate Wins (Est. savings: ~1070KB)
- [ ] **Lazy load xlsx library** (~850KB savings)
  - Only load when Excel files are detected
  - Use dynamic imports: `() => import('xlsx')`
  - Fallback message if Excel selected before load completes
  
- [ ] **Remove framer-motion** (~150KB savings)
  - Replace with CSS transitions
  - Use `transition` property for smooth animations
  - Keep animations simple and performant
  
- [ ] **Remove react-icons** (~50KB savings)
  - Use only lucide-react (already in use)
  - Or inline critical SVG icons
  
- [ ] **Remove immer/use-immer** (~20KB savings)
  - Use React's built-in state management
  - Replace with spread operators for immutability

### Phase 2: Component Optimization (Est. savings: ~400KB)
- [ ] **Replace react-data-grid** (~200KB savings)
  - Build custom lightweight grid component
  - Features needed: cell editing, copy/paste, selection
  - Use native table or CSS grid
  
- [ ] **Optimize Radix UI usage** (~200KB savings)
  - Replace with custom components where possible:
    - Dialog ’ Portal + backdrop
    - Select ’ Native select or custom dropdown
    - Tooltip ’ CSS-only tooltips
    - Switch ’ Styled checkbox
  - Keep only essential Radix components

### Phase 3: Smart Loading (Est. savings: ~100KB)
- [ ] **Make i18n optional** (~100KB savings)
  - Default to English strings
  - Lazy load i18n only when `language` prop is provided
  - Create simple fallback translation system

### Phase 4: Build Configuration
- [ ] **Optimize Rollup config**
  - Enable aggressive tree shaking
  - Mark React as external
  - Minify with terser
  - Remove console.logs in production
  
- [ ] **Add bundle analysis**
  - Install rollup-plugin-visualizer
  - Generate bundle reports
  - Track size over time
  
- [ ] **Implement code splitting**
  - Separate core from optional features
  - Create entry points for different use cases

---

## Priority 2: Standalone Mode Implementation <×

### Core Architecture
- [ ] **Mode detection**
  - Default to standalone (no backend)
  - Activate backend mode when `importerKey` is provided
  - Create `useImportMode` hook
  
- [ ] **Type definitions** (`src/types/index.ts`)
  - Add `schema` prop for standalone mode
  - Update `onComplete` for dual-mode results
  - Add `transformers` prop
  - Add `theme` object prop
  
- [ ] **Client-side validation** (`src/importer/validation/clientValidator.ts`)
  - Extract validation from Validation.tsx
  - Support all field types
  - Custom validation functions
  - Pattern matching
  
- [ ] **Client-side transformers** (`src/importer/transformation/clientTransformer.ts`)
  - Built-in transformers (date, phone, text formatting)
  - Custom transformer support
  - Transformation UI for standalone

### Component Updates
- [ ] **Main component** (`src/importer/features/main/index.tsx`)
  - Conditional schema handling
  - Dual-mode data submission
  - Pass mode context to children
  
- [ ] **Validation component**
  - Use client validator in standalone
  - Keep backend transformation support
  - Update TransformModal
  
- [ ] **Complete component**
  - Different messages per mode
  - Handle different result shapes

---

## Priority 3: API & Developer Experience =Ú

### API Simplification
- [ ] **Reduce props to essentials**
  - schema, onComplete (required for standalone)
  - importerKey (triggers backend mode)
  - Theme props (dark, colors)
  - UI props (modal, language)
  
- [ ] **Better TypeScript support**
  - Discriminated unions for modes
  - Better type inference
  - JSDoc comments

### Documentation
- [ ] **Update README**
  - Standalone-first examples
  - Bundle size considerations
  - Performance tips
  
- [ ] **Create examples**
  - Minimal standalone
  - With transformations
  - With backend
  - With theming
  
- [ ] **Migration guide**
  - For existing backend users
  - Breaking changes (if any)

---

## Priority 4: Testing & Quality >ê

- [ ] **Performance testing**
  - Measure bundle sizes
  - Test with large CSV files
  - Memory profiling
  
- [ ] **Cross-browser testing**
  - Chrome, Firefox, Safari, Edge
  - Mobile browsers
  
- [ ] **Accessibility audit**
  - Keyboard navigation
  - Screen reader support
  - ARIA labels

---

## Future Considerations =.

### Plugin Architecture
- Consider splitting into packages:
  - `@importcsv/core` - Minimal CSV importer
  - `@importcsv/excel` - Excel support
  - `@importcsv/transforms` - Advanced transformations
  - `@importcsv/i18n` - Internationalization

### Performance Metrics
- Target metrics:
  - Core bundle: <60KB gzipped
  - Initial render: <100ms
  - Large file parsing: <1s per MB
  - Memory usage: <50MB for 10k rows

---

## Notes

### Dependencies to Remove/Replace
| Package | Size | Replacement | Priority |
|---------|------|-------------|----------|
| xlsx | ~850KB | Lazy load | High |
| react-data-grid | ~200KB | Custom grid | High |
| framer-motion | ~150KB | CSS animations | High |
| i18next | ~100KB | Optional/lazy | Medium |
| react-icons | ~50KB | lucide-react | High |
| Radix UI (multiple) | ~200KB | Custom/selective | Medium |
| immer | ~20KB | Native state | Low |

### Expected Timeline
- Week 1: Phase 1 optimizations
- Week 2: Phase 2 & 3 optimizations  
- Week 3: Standalone mode implementation
- Week 4: Documentation & testing

---

*Last updated: 2025-08-21*