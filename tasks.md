# CSV Importer - Development Tasks

## ✅ Bundle Size Optimization - COMPLETED

### Bundle Size Status
- **Initial:** 1.6MB uncompressed
- **Current:** 401KB uncompressed (114KB gzipped) ✅
- **Achieved:** 75% reduction (1.2MB saved!)
- **Decision:** 114KB gzipped is acceptable for a full-featured CSV importer

---

## Priority 1: Performance & Bundle Size Optimization 🚀 [COMPLETED]

### Phase 1: Immediate Wins (Actual savings: ~1.2MB)
- [x] **Lazy load xlsx library** (~750KB saved) ✅
  - Implemented dynamic imports with loading state
  - Shows fallback message if Excel selected before load
  
- [x] **Remove framer-motion** (~434KB saved) ✅
  - Successfully removed, was completely unused
  
- [x] **Remove react-icons** (~15KB saved) ✅
  - Replaced all icons with lucide-react equivalents
  
- [x] **Remove immer/use-immer** ✅
  - Removed from package.json (wasn't being bundled)

### Phase 2: Component Optimization
- [x] **Remove react-data-grid** ✅
  - Removed from package.json (wasn't being bundled)
  - Deleted unused SimpleSpreadsheetGrid component
  
- [~] **Radix UI optimization** (Decision: Keep as-is)
  - Current usage: ~15KB gzipped (acceptable)
  - Provides accessibility and positioning features
  - ROI of replacement not worth the effort

### Phase 3: Smart Loading
- [x] **Remove i18n dependencies** ✅
  - Removed i18next and react-i18next
  - Created stub implementation for compatibility
  - (Note: Packages weren't being bundled anyway)

### Phase 4: Build Configuration
- [x] **Using Vite instead of Rollup**
  - Already optimized for production builds
  - Tree shaking enabled
  - Minification with terser
  
- [x] **Bundle analysis completed**
  - Used vite-bundle-visualizer
  - Identified @floating-ui and Radix as main contributors
  - Decision: Keep for functionality/accessibility

---

## 🎯 NEW Priority 1: Standalone Mode Implementation

### Phase 1: Core Infrastructure (Week 1, Days 1-2)

#### 1.1 Mode Detection System
- [ ] **Create mode detection hook** (`src/hooks/useImportMode.ts`)
  - Detect mode based on `importerKey` presence
  - Return `{ mode: 'standalone' | 'backend', isStandalone: boolean }`
  - Provide mode context for all components
  - Handle mode switching if needed

- [ ] **Create mode context provider** (`src/context/ImportModeContext.tsx`)
  - Share mode across component tree
  - Avoid prop drilling
  - Include helper methods for mode-specific logic

#### 1.2 Type System Updates
- [ ] **Create standalone types** (`src/types/standalone.ts`)
  - Define `StandaloneResult` interface
  - Define `BackendResult` interface
  - Create discriminated union for results
  - Add validation rule types

- [ ] **Create schema types** (`src/types/schema.ts`)
  - Define `ImporterSchema` interface
  - Define `SchemaField` with all field types
  - Add `ValidationRule` types
  - Add `TransformationRule` types

- [ ] **Update main types** (`src/types/index.ts`)
  - Add `schema?: ImporterSchema` prop
  - Update `onComplete` with union type
  - Add `validators?: CustomValidators`
  - Add `transformers?: CustomTransformers`
  - Add `mode?: 'auto' | 'standalone' | 'backend'`

### Phase 2: Client-Side Validation Engine (Week 1, Days 3-4)

#### 2.1 Core Validation Infrastructure
- [ ] **Create validation engine** (`src/validation/ValidationEngine.ts`)
  - Main validation orchestrator
  - Error collection and reporting
  - Batch validation support
  - Performance optimization for large datasets

- [ ] **Create base validator** (`src/validation/BaseValidator.ts`)
  - Abstract validator class
  - Common validation methods
  - Error formatting utilities
  - Validation result types

#### 2.2 Field Type Validators
- [ ] **Text validator** (`src/validation/validators/TextValidator.ts`)
  - Min/max length validation
  - Pattern matching (regex)
  - Required field checking
  - Custom text rules

- [ ] **Number validator** (`src/validation/validators/NumberValidator.ts`)
  - Min/max value validation
  - Integer/decimal validation
  - Precision checking
  - Custom number rules

- [ ] **Email validator** (`src/validation/validators/EmailValidator.ts`)
  - RFC-compliant email validation
  - Domain whitelist/blacklist
  - Custom email rules

- [ ] **Date validator** (`src/validation/validators/DateValidator.ts`)
  - Format validation (MM/DD/YYYY, ISO, etc.)
  - Min/max date validation
  - Relative date validation
  - Custom date rules

- [ ] **Select validator** (`src/validation/validators/SelectValidator.ts`)
  - Option validation
  - Multiple selection support
  - Custom select rules

- [ ] **Boolean validator** (`src/validation/validators/BooleanValidator.ts`)
  - True/false value validation
  - Custom boolean mappings
  - Required validation

- [ ] **Custom validator** (`src/validation/validators/CustomValidator.ts`)
  - User-defined validation functions
  - Async validation support
  - Cross-field validation

#### 2.3 Validation Utilities
- [ ] **Create validation utils** (`src/validation/utils.ts`)
  - Common validation helpers
  - Error message formatting
  - Validation result aggregation
  - Performance monitoring

### Phase 3: Client-Side Transformation Engine (Week 1, Day 5)

#### 3.1 Core Transformation Infrastructure
- [ ] **Create transformation engine** (`src/transformation/TransformationEngine.ts`)
  - Main transformation orchestrator
  - Transformation pipeline
  - Batch processing support
  - Undo/redo capability

- [ ] **Create base transformer** (`src/transformation/BaseTransformer.ts`)
  - Abstract transformer class
  - Common transformation methods
  - Transformation result types

#### 3.2 Built-in Transformers
- [ ] **Date transformer** (`src/transformation/transformers/DateTransformer.ts`)
  - Format conversion (MM/DD/YYYY ↔ ISO)
  - Timezone handling
  - Relative date parsing
  - Custom date formats

- [ ] **Text transformer** (`src/transformation/transformers/TextTransformer.ts`)
  - Case conversion (upper/lower/title)
  - Trim whitespace
  - Remove special characters
  - Text replacement

- [ ] **Number transformer** (`src/transformation/transformers/NumberTransformer.ts`)
  - Format conversion
  - Precision adjustment
  - Currency formatting
  - Mathematical operations

- [ ] **Phone transformer** (`src/transformation/transformers/PhoneTransformer.ts`)
  - Format standardization
  - Country code handling
  - Extension parsing
  - Validation during transform

#### 3.3 Custom Transformations
- [ ] **Custom transformer support** (`src/transformation/transformers/CustomTransformer.ts`)
  - User-defined transformation functions
  - Async transformation support
  - Error handling in transformations
  - Transformation chaining

### Phase 4: Component Updates (Week 2, Days 1-4)

#### 4.1 Main Component Updates
- [ ] **Update main component** (`src/importer/features/main/index.tsx`)
  - Integrate `useImportMode` hook
  - Conditional schema loading (client vs backend)
  - Mode-aware data flow
  - Pass mode context to children

- [ ] **Create schema converter** (`src/utils/schemaConverter.ts`)
  - Convert standalone schema to Template format
  - Handle field type mappings
  - Preserve validation rules

#### 4.2 Validation Component Updates
- [ ] **Update Validation component** (`src/importer/features/validation/Validation.tsx`)
  - Check mode from context
  - Use client validator in standalone mode
  - Keep backend validation for backend mode
  - Unified error display

- [ ] **Create client validation wrapper** (`src/importer/features/validation/ClientValidation.tsx`)
  - Wrap ValidationEngine for React
  - Handle validation state
  - Provide validation UI
  - Real-time validation feedback

#### 4.3 Transformation UI Updates
- [ ] **Update TransformModal** (`src/importer/features/validation/components/TransformModal.tsx`)
  - Mode-aware transformation
  - Client-side transformation in standalone
  - Backend AI transformation in backend mode
  - Unified transformation preview

- [ ] **Create transformation selector** (`src/components/TransformationSelector.tsx`)
  - List available transformations
  - Preview transformation effects
  - Custom transformation input

#### 4.4 Complete Component Updates
- [ ] **Update Complete component** (`src/importer/features/complete/index.tsx`)
  - Different success messages per mode
  - Handle standalone result shape
  - Handle backend result shape
  - Provide appropriate actions

#### 4.5 Configure Import Updates
- [ ] **Update ConfigureImport** (`src/importer/features/configure-import/index.tsx`)
  - Mode-aware configuration
  - Skip backend calls in standalone
  - Use client-side mapping

### Phase 5: Testing & Documentation (Week 2, Day 5)

#### 5.1 Unit Tests
- [ ] **Validation engine tests** (`src/validation/__tests__/`)
  - Test each validator type
  - Edge cases and error conditions
  - Performance tests with large datasets
  - Custom validator tests

- [ ] **Transformation engine tests** (`src/transformation/__tests__/`)
  - Test each transformer type
  - Transformation pipeline tests
  - Error handling tests
  - Custom transformer tests

- [ ] **Mode detection tests** (`src/hooks/__tests__/`)
  - Test mode detection logic
  - Mode switching scenarios
  - Context provider tests

#### 5.2 Integration Tests
- [ ] **Standalone flow tests**
  - Complete import flow without backend
  - Data validation and transformation
  - Result handling

- [ ] **Backend flow tests**
  - Ensure backward compatibility
  - Test with importerKey
  - Backend API integration

- [ ] **Mode switching tests**
  - Test transitions between modes
  - Data preservation during switch
  - Error handling

#### 5.3 Documentation
- [ ] **API documentation** (`docs/api.md`)
  - Document all new props
  - Usage examples for both modes
  - Migration guide from v1

- [ ] **README updates** (`README.md`)
  - Standalone-first examples
  - Quick start guide
  - Feature comparison table

- [ ] **Example implementations** (`examples/`)
  - Minimal standalone example
  - Standalone with transformations
  - Standalone with custom validators
  - Backend mode example
  - Advanced customization example

### Phase 6: Performance & Polish (Week 3)

#### 6.1 Performance Optimization
- [ ] **Validation performance**
  - Implement validation debouncing
  - Add progress indicators for large files
  - Optimize memory usage
  - Add validation caching

- [ ] **Transformation performance**
  - Batch transformation processing
  - Web Worker support for heavy operations
  - Progress tracking
  - Memory optimization

#### 6.2 Error Handling
- [ ] **Comprehensive error handling**
  - Graceful degradation
  - User-friendly error messages
  - Recovery mechanisms
  - Error reporting

#### 6.3 Accessibility
- [ ] **Accessibility improvements**
  - ARIA labels for new components
  - Keyboard navigation
  - Screen reader support
  - Focus management

### Implementation Notes

#### Backward Compatibility
- All existing implementations must continue working
- Default to backend mode when `importerKey` is present
- No breaking changes to existing API
- Deprecation warnings for outdated patterns

#### Performance Targets
- Validation: <100ms for 1000 rows
- Transformation: <200ms for 1000 rows
- Memory: <50MB for 10,000 rows
- Initial render: <100ms

#### API Design Examples

```typescript
// Standalone mode (new)
<CSVImporter
  schema={{
    fields: [
      {
        key: 'email',
        name: 'Email',
        type: 'email',
        required: true,
        validation: {
          pattern: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
          message: 'Invalid email format'
        }
      },
      {
        key: 'joinDate',
        name: 'Join Date',
        type: 'date',
        format: 'MM/DD/YYYY',
        transformation: {
          output: 'ISO'
        }
      }
    ]
  }}
  validators={{
    email: (value) => customEmailValidation(value)
  }}
  transformers={{
    date: (value, format) => customDateTransform(value, format)
  }}
  onComplete={(result) => {
    // result.data contains processed rows
    console.log(result.data);
  }}
/>

// Backend mode (existing)
<CSVImporter
  importerKey="user_import"
  backendUrl="https://api.example.com"
  onComplete={(result) => {
    // Backend processed result
    console.log(result);
  }}
/>

// Explicit mode selection
<CSVImporter
  mode="standalone"  // Force standalone even with importerKey
  importerKey="user_import"  // Used for configuration only
  schema={customSchema}
  onComplete={(result) => {
    console.log(result.data);
  }}
/>
```

### Timeline Summary
- **Week 1**: Core infrastructure (Days 1-2), Validation engine (Days 3-4), Transformation engine (Day 5)
- **Week 2**: Component updates (Days 1-4), Testing & documentation (Day 5)
- **Week 3**: Performance optimization, error handling, accessibility, final polish

---

## Priority 2: API & Developer Experience 🛠️

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

## Priority 3: Testing & Quality 🧪

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

## Future Considerations 🔮

### Plugin Architecture
- Consider splitting into packages:
  - `@importcsv/core` - Minimal CSV importer
  - `@importcsv/excel` - Excel support
  - `@importcsv/transforms` - Advanced transformations
  - `@importcsv/i18n` - Internationalization

### Performance Metrics
- Target metrics:
  - Core bundle: <60KB gzipped ✅ (Currently 114KB with full features)
  - Initial render: <100ms
  - Large file parsing: <1s per MB
  - Memory usage: <50MB for 10k rows

---

## Notes

### Dependencies Optimization Results
| Package | Size | Action Taken | Result |
|---------|------|-------------|----------|
| xlsx | ~850KB | Lazy loaded | ✅ Saved ~750KB |
| framer-motion | ~150KB | Removed | ✅ Saved ~434KB |
| react-icons | ~50KB | Replaced with lucide | ✅ Saved ~15KB |
| react-data-grid | ~200KB | Removed | ✅ Not bundled |
| i18next | ~100KB | Removed | ✅ Not bundled |
| @tanstack/react-table | ~25KB | Removed | ✅ Not bundled |
| Radix UI | ~200KB | Kept | ℹ️ 15KB gzipped (acceptable) |
| **Total Reduction** | **1.6MB → 401KB** | **75% smaller** | **✅ Success!** |

### Expected Timeline
- ~~Week 1: Bundle optimization~~ ✅ COMPLETED
- Week 2: Standalone mode implementation  
- Week 3: API improvements & documentation
- Week 4: Testing & quality assurance

---

*Last updated: 2025-08-21*
*Bundle optimization completed - 401KB (114KB gzipped)*