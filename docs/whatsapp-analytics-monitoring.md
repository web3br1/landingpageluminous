# WhatsApp Analytics & Monitoring

## Overview

Monitor WhatsApp integration performance through comprehensive analytics tracking and conversion metrics.

## Tracked Events

### WhatsApp Redirect Events

```typescript
analytics.track("whatsapp_redirect", {
  message_length: number,        // Length of the message
  has_context: boolean,          // Whether context was provided
  segments: string[],           // User segments (e.g., ['enterprise', 'mobile_user'])
  intent: string,               // User intent (e.g., 'pricing', 'demo', 'contact')
  page: string                  // Current page path
})
```

### API Message Events (Business API only)

```typescript
analytics.track("whatsapp_api_message_sent", {
  message_id: string, // WhatsApp message ID
  recipient: string, // Recipient phone number
  message_length: number, // Message length
  context: WhatsAppMessage["context"], // Full context object
});
```

### API Error Events

```typescript
analytics.track("whatsapp_api_error", {
  error_code?: string,          // WhatsApp API error code
  error_message: string,        // Error message
  http_status?: number,         // HTTP status code
  error_type?: string,          // 'network' | 'validation' | 'api'
  context: WhatsAppMessage['context']
})
```

### Chat Integration Events

```typescript
analytics.track("chat_whatsapp_redirect", {
  segments: string[],           // Active user segments
  message_count: number,        // Number of messages in conversation
  context: {                    // Full conversation context
    segments: string[],
    intent: string,
    page: string,
    conversation_id: string
  }
})
```

## Key Metrics to Monitor

### Conversion Metrics

- **WhatsApp Click Rate**: `whatsapp_redirect` events / Total contact attempts
- **API Success Rate**: Successful `whatsapp_api_message_sent` / Total API attempts
- **Chat Conversion**: `chat_whatsapp_redirect` / Total chat sessions

### User Behavior

- **Intent Distribution**: Breakdown of user intents (pricing, demo, support)
- **Segment Engagement**: Which user segments use WhatsApp most
- **Page Performance**: Which pages generate most WhatsApp interactions

### Technical Performance

- **API Response Time**: Time between send request and WhatsApp API response
- **Error Rate**: `whatsapp_api_error` events / Total API calls
- **Message Length**: Average character count of messages

## Setting Up Analytics Monitoring

### Google Analytics 4

```javascript
// Enhanced E-commerce tracking
gtag("event", "whatsapp_contact", {
  event_category: "engagement",
  event_label: intent,
  custom_parameters: {
    segments: segments.join(","),
    page: page,
    message_length: message_length,
  },
});
```

### Plausible Analytics

```javascript
// Custom event tracking
plausible("WhatsApp Contact", {
  props: {
    intent: intent,
    segments: segments,
    page: page,
  },
});
```

### Custom Analytics Dashboard

```sql
-- Example SQL queries for monitoring

-- Daily WhatsApp interactions
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_interactions,
  COUNT(CASE WHEN event = 'whatsapp_api_message_sent' THEN 1 END) as api_messages,
  COUNT(CASE WHEN event = 'whatsapp_redirect' THEN 1 END) as url_redirects
FROM analytics_events
WHERE event LIKE 'whatsapp_%'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Intent distribution
SELECT
  JSON_EXTRACT_SCALAR(properties, '$.intent') as intent,
  COUNT(*) as count
FROM analytics_events
WHERE event = 'whatsapp_redirect'
GROUP BY intent
ORDER BY count DESC;

-- Conversion by user segment
SELECT
  segment,
  COUNT(*) as interactions,
  AVG(CAST(JSON_EXTRACT_SCALAR(properties, '$.message_length') AS INT64)) as avg_message_length
FROM analytics_events,
UNNEST(JSON_EXTRACT_ARRAY(properties, '$.segments')) as segment
WHERE event = 'whatsapp_redirect'
GROUP BY segment;
```

## Monitoring Dashboards

### Real-time Dashboard

- Live WhatsApp interaction counter
- Success/error rates
- Geographic distribution of users

### Weekly Reports

- Conversion trends
- Popular intents and segments
- Technical performance metrics

### A/B Testing Results

- Compare different message variations
- Intent-based conversion rates
- Segment-specific performance

## Alerts & Thresholds

### Critical Alerts

- **API Error Rate > 10%**: Indicates connectivity or authentication issues
- **Zero Interactions**: May indicate configuration problems
- **High Response Times**: API performance degradation

### Warning Alerts

- **API Error Rate > 5%**: Monitor for trends
- **Unusual Intent Patterns**: May indicate user experience issues
- **Segment Changes**: Monitor for demographic shifts

## Troubleshooting Analytics

### Common Issues

1. **Missing Events**
   - Check if analytics provider is properly initialized
   - Verify event names match tracking implementation
   - Ensure user consent for tracking (GDPR/CCPA compliance)

2. **Incorrect Data**
   - Validate property names and data types
   - Check for encoding issues in special characters
   - Monitor for truncated or missing context data

3. **Performance Impact**
   - Analytics calls should be asynchronous
   - Avoid blocking operations in user interaction paths
   - Implement proper error boundaries for analytics failures

### Debug Mode

```typescript
// Enable debug logging
const DEBUG_ANALYTICS = process.env.NODE_ENV === "development";

if (DEBUG_ANALYTICS) {
  console.log("WhatsApp Analytics:", {
    event: "whatsapp_redirect",
    properties: eventData,
  });
}
```

## Privacy & Compliance

### Data Collection

- Only collect necessary user context for personalization
- Anonymize phone numbers in analytics (last 4 digits only)
- Respect user consent preferences

### GDPR Considerations

- WhatsApp interactions may be considered personal data
- Implement proper consent flows
- Provide data deletion mechanisms

### Retention Policies

- Define data retention periods for analytics
- Implement automated cleanup procedures
- Archive historical data for trend analysis

## Integration with Business Tools

### CRM Integration

- Sync WhatsApp interactions with customer records
- Track conversation history and outcomes
- Automate follow-up workflows

### Marketing Automation

- Trigger email sequences based on WhatsApp engagement
- Segment users based on WhatsApp interaction patterns
- Personalize future communications

### Support Ticketing

- Create support tickets from WhatsApp conversations
- Track resolution times and satisfaction scores
- Integrate with helpdesk systems

## Performance Optimization

### Client-side Optimization

- Lazy load WhatsApp integration scripts
- Cache user context to reduce API calls
- Implement proper error boundaries

### Server-side Optimization

- Pre-compute personalized messages when possible
- Cache API credentials securely
- Implement rate limiting for API calls

### Monitoring Optimization

- Sample analytics events in production
- Use efficient data structures for context
- Implement proper async error handling
