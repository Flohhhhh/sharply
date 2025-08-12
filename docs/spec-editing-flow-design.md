# Spec Editing Flow Design

## Overview

The spec editing system provides a clean, intuitive interface for users to suggest changes to gear specifications while maintaining an uncluttered reading experience. The system uses progressive enhancement to deliver the best experience across different devices and user preferences.

## Design Philosophy

### Core Principles

1. **Clean Reading Experience** - Users browsing gear data should not be distracted by editing UI
2. **Progressive Enhancement** - Basic functionality works everywhere, enhanced experience on capable devices
3. **Contextual Editing** - Editing interface appears when users explicitly choose to edit
4. **Unified Data Model** - Single editing interface handles both metadata and specifications
5. **Domain-Specific Validation** - Photography gear specs require specialized input components and validation logic

## UI Architecture

### Desktop Experience (Route Intercepting)

- **Modal Interface**: Clicking "Suggest Edit" opens a modal via Next.js route intercepting
- **Parallel Routing**: Uses `@edit` folder structure for seamless modal experience
- **URL Routing**: Modal maintains proper URL state (`/gear/[slug]/edit`)
- **Context Preservation**: Users stay in context of the gear page

### Mobile Experience (Full Page Navigation)

- **Dedicated Page**: "Suggest Edit" navigates to full edit page
- **Full-Screen Layout**: Optimized for touch interaction and small screens
- **Native Navigation**: Standard browser back button and navigation patterns

## Implementation Strategy

### File Structure

```
app/gear/[slug]/
├── page.tsx                    # Main gear page
├── layout.tsx                  # Handles modal rendering
├── edit/
│   └── page.tsx               # Full edit page
└── @edit/
    └── page.tsx               # Modal intercept
```

### Route Intercepting

- **Desktop**: `@edit` folder intercepts `/edit` route and renders in modal
- **Mobile**: Direct navigation to `/edit` renders full page
- **Fallback**: Modal gracefully degrades to full page if JavaScript is disabled

## Validation Strategy

### Custom Input Components Approach

#### Why Custom Components?

Photography gear specs are incredibly diverse and domain-specific:

- **Aperture**: Specific formatting (f/2.8) with common values
- **Focal Length**: Ranges (24-70mm) or single values (50mm) for prime lenses
- **Resolution**: Complex formats (1920x1080) with presets
- **ISO**: Ranges (100-51200) with standard values
- **Megapixels**: Decimal precision (24.1 MP)

#### Component Examples

```typescript
// Focal Length with Prime/Zoom Toggle
<FocalLengthInput
  value={focalLength}
  onChange={setFocalLength}
  isPrime={isPrimeLens}
  onPrimeToggle={setIsPrimeLens}
/>

// Aperture with Common Values
<ApertureInput
  value={aperture}
  onChange={setAperture}
  commonValues={['f/1.4', 'f/1.8', 'f/2.8', 'f/4']}
/>

// Resolution with Format Presets
<ResolutionInput
  value={resolution}
  onChange={setResolution}
  commonFormats={['4K', '1080p', '720p']}
/>
```

#### Dynamic Form Structure

Components handle complex UI logic internally:

- **State Management**: Prime/zoom toggle, range vs single value
- **Smart Validation**: Business rules (prime lenses must have equal min/max)
- **Value Transformation**: Converting between different data representations
- **User Experience**: Intuitive controls photographers understand

### Zod Integration

#### Perfect Compatibility

Zod works seamlessly with custom components:

```typescript
const FocalLengthSchema = z.object({
  min: z.number().min(8).max(800),
  max: z.number().min(8).max(800),
}).refine(data => data.min <= data.max, {
  message: "Min must be less than or equal to max"
});

// Components use Zod internally for validation
const FocalLengthInput = ({ value, onChange, error }) => {
  const result = FocalLengthSchema.safeParse(value);
  const hasError = !result.success;

  return (
    <div>
      {/* inputs */}
      {hasError && <ErrorMessage>{result.error.message}</ErrorMessage>}
    </div>
  );
};
```

#### Benefits

- **Type Safety**: Full TypeScript support
- **Runtime Validation**: Immediate feedback on data entry
- **Centralized Rules**: Validation logic in one place
- **Component Autonomy**: Each component handles its own validation

### Dynamic Input Rendering

#### Schema-Driven Component Selection

```typescript
const SPEC_FIELD_CONFIG = {
  focalLength: {
    component: 'FocalLengthInput',
    props: { allowRange: true, unit: 'mm' },
    validation: FocalLengthSchema,
    display: 'Focal Length'
  },
  aperture: {
    component: 'ApertureInput',
    props: { allowRange: false, commonValues: ['f/1.4', 'f/2.8'] },
    validation: ApertureSchema,
    display: 'Maximum Aperture'
  }
};

// Dynamic component rendering
const SpecField = ({ fieldName, value, onChange }) => {
  const config = SPEC_FIELD_CONFIG[fieldName];
  if (!config) return <TextInput value={value} onChange={onChange} />;

  const Component = COMPONENT_MAP[config.component];
  return (
    <Component
      value={value}
      onChange={onChange}
      {...config.props}
    />
  );
};
```

#### Component Registry Pattern

```typescript
// src/components/spec-inputs/index.ts
export const SPEC_INPUT_COMPONENTS = {
  FocalLengthInput,
  ApertureInput,
  ResolutionInput,
  ISOInput,
  MegapixelInput,
} as const;

type ComponentName = keyof typeof SPEC_INPUT_COMPONENTS;
```

## User Experience Flow

### 1. Discovery

- **Metadata Section**: "Suggest Edit" button positioned near key information
- **Specs Table**: "Suggest Edit" button above specifications table
- **Visual Design**: Buttons styled as secondary actions, not competing with primary content

### 2. Editing Interface

- **Form Sections**: Logical grouping (Basic Info, Camera Specs, Lens Specs)
- **Current Values**: Pre-filled forms showing existing data
- **Change Preview**: Side-by-side comparison of current vs. proposed values
- **Validation**: Real-time feedback on data entry
- **Smart Defaults**: Common values and presets for photography specs

### 3. Submission

- **Review Changes**: Summary of all proposed modifications
- **Notes**: Optional explanation of why changes are needed
- **Submit**: Creates gear proposal for admin review

## Technical Considerations

### State Management

#### Centralized Spec Management

```typescript
const useSpecForm = (initialSpecs) => {
  const [specs, setSpecs] = useState(initialSpecs);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  const updateSpec = useCallback((field, value) => {
    setSpecs((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  return { specs, errors, isDirty, updateSpec };
};
```

#### Form State Complexity

- **Change Tracking**: Clear indication of unsaved modifications
- **Validation State**: Real-time feedback without blocking submission
- **Performance**: Debounced validation to prevent excessive API calls

### Validation Dependencies

#### Cross-Field Validation

```typescript
const validateCameraSpecs = (specs) => {
  if (specs.sensorFormat === "APS-C" && specs.resolutionMp > 50) {
    return "APS-C sensors don't support resolutions above 50MP";
  }
  // More complex interdependencies between specs
};
```

#### Business Logic Validation

- **Prime vs Zoom Lenses**: Different validation rules for focal length
- **Sensor Format Constraints**: Resolution limits based on sensor type
- **Mount Compatibility**: Lens specs must match mount requirements

### Advanced Features

#### Undo/Redo Functionality

```typescript
const [specHistory, setSpecHistory] = useState([]);
const [currentIndex, setCurrentIndex] = useState(-1);

const undo = () => {
  if (currentIndex > 0) {
    setCurrentIndex(currentIndex - 1);
    setSpecs(specHistory[currentIndex - 1]);
  }
};
```

### Performance Optimization

#### Memoization and Debouncing

```typescript
const SpecForm = memo(({ specs, onChange }) => {
  // Memoize expensive validation
  const validationErrors = useMemo(() =>
    validateAllSpecs(specs), [specs]
  );

  // Debounce onChange to prevent excessive re-renders
  const debouncedOnChange = useCallback(
    debounce(onChange, 300), [onChange]
  );

  return (/* form JSX */);
});
```

#### Lazy Loading

- **Edit Interface**: Loads only when needed
- **Component Libraries**: Import spec input components on demand
- **Validation Rules**: Load validation schemas as required

### Accessibility

#### ARIA and Screen Reader Support

```typescript
const FocalLengthInput = () => {
  return (
    <fieldset aria-labelledby="focal-length-legend">
      <legend id="focal-length-legend">Focal Length</legend>
      <div role="group" aria-describedby="focal-length-help">
        {/* inputs */}
      </div>
      <div id="focal-length-help" className="sr-only">
        Enter focal length in millimeters. For zoom lenses, provide both minimum and maximum values.
      </div>
    </fieldset>
  );
};
```

#### Focus Management

- **Modal Context**: Proper focus handling in modal context
- **Keyboard Navigation**: Full keyboard support for editing interface
- **Screen Reader Support**: Clear navigation and state announcements

## Future Enhancements

### Advanced Features

- **Bulk Editing**: Edit multiple gear items simultaneously
- **Template System**: Pre-defined edit templates for common changes
- **Collaboration**: Multiple users working on the same edit proposal
- **Version History**: Track changes and rollback capabilities
- **AI-Powered Suggestions**: Smart recommendations for common spec values

### Integration Points

- **Admin Workflow**: Seamless integration with existing gear proposal system
- **User Permissions**: Role-based access to different editing capabilities
- **Notification System**: Updates on proposal status and approvals
- **Manufacturer Integration**: Auto-validation against official specifications

## Success Metrics

### User Experience

- **Edit Completion Rate**: Percentage of started edits that are submitted
- **Time to Edit**: Average time from starting edit to submission
- **Error Rate**: Frequency of validation errors and failed submissions
- **User Satisfaction**: Feedback on editing interface usability

### System Performance

- **Modal Load Time**: Time to display editing interface
- **Form Responsiveness**: Input lag and validation feedback speed
- **Mobile Performance**: Edit page load times on mobile devices
- **Validation Performance**: Time to validate complex spec combinations

### Data Quality

- **Validation Success Rate**: Percentage of submissions that pass validation
- **Admin Approval Rate**: Percentage of proposals approved by admins
- **Data Accuracy**: Reduction in spec errors after implementation

## Implementation Timeline

### Phase 1: Core Editing Interface

- Basic edit page with form validation
- Route intercepting for desktop modal experience
- Integration with existing gear proposal system
- Core custom input components (FocalLength, Aperture, Resolution)

### Phase 2: Enhanced User Experience

- Advanced validation and error handling
- Mobile-optimized interface improvements
- Additional spec input components (ISO, Megapixels, etc.)
- Cross-field validation logic

### Phase 3: Advanced Features

- Bulk editing capabilities
- Template system for common changes
- Advanced collaboration features
- Performance optimization and accessibility improvements
