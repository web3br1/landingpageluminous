# Real-Time A/B Testing for Themes

## Overview

The Real-Time A/B Testing system provides live experimentation capabilities for themes and UI variants, with automatic analytics, progressive rollout, and privacy-first tracking.

## Key Features

- 🎯 **Consistent User Assignment**: Same user always sees same variant
- 📊 **Auto Analytics**: Real-time conversion tracking and statistical analysis
- 🚀 **Progressive Rollout**: Winners automatically rolled out to more users
- 🎨 **Theme Integration**: Variants can change themes and custom tokens
- 🔒 **Privacy First**: No personal data stored, consent-aware
- 📈 **Statistical Significance**: Automated winner detection with confidence intervals

## Architecture

### Core Components

1. **Experiment Configuration** (`lib/ab-testing/real-time-experiments.ts`)
   - Defines experiment parameters, variants, targeting rules
   - Handles rollout percentage and confidence thresholds

2. **React Hooks** (`lib/hooks/use-real-time-experiment.ts`)
   - `useRealTimeExperiment()` - Main experiment hook
   - `useExperimentAnalytics()` - Analytics for admin dashboard
   - `useExperimentCTA()` - Specialized CTA tracking

3. **Admin Dashboard** (`components/admin/experiment-dashboard.tsx`)
   - Real-time analytics visualization
   - Experiment management interface
   - Auto-rollout controls

## Usage Examples

### Basic Theme Experiment

```tsx
import { useRealTimeExperiment } from "@/lib/hooks/use-real-time-experiment";

function HeroSection() {
  const experiment = useRealTimeExperiment("theme-hero-optimization", userId);

  // Component automatically gets assigned to variant and theme
  return (
    <div data-theme={experiment.themeId}>
      <h1>Hero Content</h1>
      <button onClick={() => experiment.trackConversion()}>CTA Button</button>
    </div>
  );
}
```

### Advanced Layout Experiment

```tsx
import { ExperimentWrapper } from "@/components/experiments/experiment-wrapper";

function CardSection() {
  return (
    <ExperimentWrapper experimentId="theme-card-layout" userId={userId}>
      {(experiment) => {
        const customTokens = experiment.customTokens || {};

        return (
          <Card
            style={{
              borderRadius: customTokens.cardBorderRadius,
              boxShadow: customTokens.cardShadow,
            }}
          >
            <CardContent>
              <ExperimentCTA experimentId="theme-card-layout" ctaType="primary">
                Test Button
              </ExperimentCTA>
            </CardContent>
          </Card>
        );
      }}
    </ExperimentWrapper>
  );
}
```

## Experiment Configuration

### Basic Structure

```typescript
export const REAL_TIME_EXPERIMENTS: Record<string, ExperimentConfig> = {
  "experiment-id": {
    id: "experiment-id",
    name: "Experiment Name",
    description: "What this experiment tests",
    type: "theme", // 'theme' | 'content' | 'layout'
    status: "running", // 'draft' | 'running' | 'paused' | 'completed'

    variants: {
      A: {
        name: "Control",
        themeId: "liquid-glass",
        weight: 50, // Percentage weight
      },
      B: {
        name: "Variant",
        themeId: "tech-blueprint",
        weight: 50,
        customTokens: {
          // Optional custom styling
          cardBorderRadius: "1rem",
          cardShadow: "lg",
        },
      },
    },

    targeting: {
      userSegment: ["free", "trial"],
      countries: ["BR", "US"],
      devices: ["mobile", "desktop"],
    },

    rollout: {
      percentage: 25, // Start with 25% of traffic
      minSampleSize: 1000,
      confidenceThreshold: 95,
    },

    metrics: {
      primary: "cta_click",
      secondary: ["scroll_depth", "time_on_page"],
    },
  },
};
```

### Targeting Rules

```typescript
targeting: {
  // User segment targeting
  userSegment: ['free', 'trial', 'premium'],

  // Geographic targeting
  countries: ['BR', 'US', 'DE'],

  // Device targeting
  devices: ['mobile', 'tablet', 'desktop'],

  // User type targeting
  userTypes: ['new', 'returning', 'premium']
}
```

## Analytics & Tracking

### Automatic Tracking Events

- `experiment_exposure` - When user is assigned to experiment
- `cta_click` - Primary CTA interactions
- `cta_click_primary/secondary` - CTA type tracking
- `conversion` - Primary conversion events
- `scroll_25/50/75` - Scroll depth milestones
- `time_on_page` - Time spent on page
- `page_hidden/visible` - Visibility changes

### Custom Event Tracking

```typescript
const experiment = useRealTimeExperiment("experiment-id");

// Track custom events
experiment.trackEvent("feature_click", 1);
experiment.trackConversion(1);
experiment.trackEngagement("button_click");
```

## Admin Dashboard

### Accessing the Dashboard

Navigate to `/admin/experiments` to access the real-time dashboard featuring:

- **Live Metrics**: Total users, conversion rates, uplift percentages
- **Variant Comparison**: Side-by-side performance analysis
- **Progress Tracking**: Statistical significance progress bars
- **Winner Alerts**: Automatic notifications when winners are detected
- **Rollout Controls**: Manual and automatic rollout management

### Key Metrics Displayed

- **Conversion Rate**: Primary metric performance
- **Uplift**: Percentage improvement over control
- **Confidence**: Statistical confidence level
- **Sample Size**: Current user count per variant
- **Rollout Percentage**: Current traffic allocation

## Progressive Rollout

### Automatic Rollout Logic

```typescript
function checkAutoRollout(experimentId: string): boolean {
  const analytics = getExperimentAnalytics(experimentId);

  if (analytics.winner && analytics.confidence >= threshold) {
    // Increase rollout by 25%
    experiment.rollout.percentage = Math.min(current + 25, 100);
    return true;
  }

  return false;
}
```

### Rollout Phases

1. **Pilot (0-25%)**: Initial testing with small user segment
2. **Expansion (25-50%)**: Increased traffic if showing promise
3. **Scale (50-100%)**: Full rollout for clear winners
4. **Complete**: Experiment ends, winner becomes default

## Privacy & Compliance

### Data Handling

- **No Personal Data**: Only anonymous user IDs and session tracking
- **Consent Aware**: Respects user privacy preferences
- **GDPR Compliant**: No cross-site tracking or personal data storage
- **Local Storage Only**: Demo uses localStorage; production uses secure analytics

### Data Retention

- **Session Data**: Cleared on session end
- **Analytics Data**: Retained only for experiment duration
- **User Assignment**: Consistent but anonymous

## Best Practices

### Experiment Design

1. **Clear Hypothesis**: Define what you're testing and why
2. **Primary Metric**: Choose one clear success metric
3. **Sample Size**: Ensure adequate statistical power
4. **Runtime**: Run experiments long enough for significance

### Implementation

1. **Consistent Assignment**: Same user always sees same variant
2. **Loading States**: Handle experiment loading gracefully
3. **Fallbacks**: Always provide fallback for failed experiments
4. **Performance**: Don't impact page load speed

### Analysis

1. **Statistical Significance**: Wait for adequate confidence levels
2. **Secondary Metrics**: Monitor for unintended consequences
3. **User Segments**: Analyze performance across different user types
4. **Long-term Impact**: Consider effects beyond immediate metrics

## Troubleshooting

### Common Issues

- **Inconsistent Variants**: Check user ID consistency
- **Low Sample Size**: Wait for more users or reduce rollout percentage
- **No Conversions**: Verify tracking implementation
- **Performance Impact**: Optimize experiment loading

### Debug Tools

```typescript
// Debug experiment assignment
const experiment = useRealTimeExperiment("experiment-id");
console.log("Experiment:", experiment);

// Debug analytics
const analytics = getExperimentAnalytics("experiment-id");
console.log("Analytics:", analytics);
```

## Integration with Existing Systems

### Theme System Integration

Experiments automatically integrate with the existing theme system:

```typescript
// Experiment assigns theme
const experiment = useRealTimeExperiment("theme-experiment");
const themeId = experiment.themeId; // 'liquid-glass' or 'tech-blueprint'

// Custom tokens for advanced variants
const customTokens = experiment.customTokens; // { cardBorderRadius: '1rem' }
```

### Analytics Integration

Replace localStorage with your analytics provider:

```typescript
function trackExperimentEvent(experimentId, variant, userId, eventName, value) {
  // Replace with your analytics service
  analytics.track("experiment_event", {
    experiment_id: experimentId,
    variant,
    user_id: userId,
    event: eventName,
    value,
  });
}
```

## Future Enhancements

- **Multi-armed Bandit**: Dynamic traffic allocation based on real-time performance
- **Personalization Engine**: ML-based variant assignment
- **Cross-device Consistency**: Sync experiments across devices
- **Advanced Targeting**: Behavioral and contextual targeting
- **Automated Experiment Creation**: AI-assisted experiment setup
