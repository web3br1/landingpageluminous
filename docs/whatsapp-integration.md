# WhatsApp Integration Documentation

## Overview

A robust WhatsApp integration system that supports both direct URL redirection and WhatsApp Business API messaging. Designed with SSR safety, comprehensive error handling, and personalized messaging based on user context.

## Features

- **URL-based Messaging**: Direct `wa.me` links for instant WhatsApp redirection
- **Business API Support**: Full WhatsApp Business API integration for programmatic messaging
- **Personalized Messages**: Context-aware message generation based on user segments and intent
- **SSR Safe**: Client-side detection and server-side safety checks
- **Analytics Integration**: Comprehensive tracking of user interactions
- **Fallback Strategies**: Graceful degradation when API is unavailable

## Configuration

### Environment Variables

```bash
# Required - Phone number for WhatsApp (no + prefix)
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999

# Optional - WhatsApp Business API (enables programmatic messaging)
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_API_VERSION=v18.0

# Optional - Alternative contact methods
CONTACT_EMAIL=contato@luminaris.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Setup Steps

1. **Basic Setup** (Required):
   - Add `NEXT_PUBLIC_WHATSAPP_NUMBER` to your environment
   - Integration works with URL-based messaging immediately

2. **Business API Setup** (Optional):
   - Create a WhatsApp Business Account
   - Get API credentials from Facebook Developers
   - Configure `WHATSAPP_BUSINESS_ACCOUNT_ID` and `WHATSAPP_ACCESS_TOKEN`

## Usage

### Basic URL Generation

```typescript
import { whatsappIntegration } from "@/lib/whatsapp/integration";

// Generate WhatsApp URL
const url = whatsappIntegration.generateWhatsAppUrl(
  "Olá, gostaria de mais informações!",
);

// Open in new tab
window.open(url, "_blank");
```

### Personalized Messages

```typescript
// Generate context-aware message
const context = {
  segments: ["enterprise", "mobile_user"],
  intent: "demo",
  page: "/pricing",
};

const message = whatsappIntegration.generatePersonalizedMessage(context);
// Returns: "Olá! Tenho interesse em uma demonstração do sistema Luminaris.
// Represento uma empresa e preciso de uma solução corporativa.
// Acesso principalmente pelo celular. (Vindo da página de preços)"
```

### Business API Messaging

```typescript
// Send message via API (requires Business API setup)
const result = await whatsappIntegration.sendMessage({
  to: "5511987654321",
  message: "Mensagem de teste",
  context: {
    segments: ["lead"],
    intent: "contact",
    page: "/contact",
  },
});

if (result.success) {
  console.log("Message sent:", result.messageId);
} else {
  console.error("Failed to send:", result.error);
}
```

### Multiple Contact Methods

```typescript
// Get all contact URLs
const urls = whatsappIntegration.generateContactUrls(context);

console.log({
  whatsapp: urls.whatsapp, // wa.me URL
  phone: urls.phone, // tel: URL
  email: urls.email, // mailto: URL
});
```

## Message Personalization

### Supported Segments

- `mobile_user` → Prioritizes WhatsApp, mentions mobile usage
- `enterprise` → Emphasizes corporate solutions
- `pricing` → Focuses on pricing inquiries
- `demo` → Requests demonstration interest

### Intent Mapping

```typescript
const intents = {
  pricing:
    "Tenho interesse nos planos da Luminaris e gostaria de mais detalhes sobre preços.",
  demo: "Gostaria de agendar uma demonstração do sistema Luminaris.",
  contact: "Preciso de mais informações sobre o sistema Luminaris.",
  support: "Tenho uma dúvida técnica sobre o sistema Luminaris.",
};
```

### Page Context

Messages include contextual information based on the current page:

- `/pricing` → "(Vindo da página de preços)"
- `/features` → "(Vindo da página de funcionalidades)"
- `/demo` → "(Vindo da página de demo)"

## Error Handling

### Validation

The integration includes comprehensive input validation:

```typescript
// Phone number validation (Brazilian format)
const cleanPhone = phone.replace(/\D/g, "");
if (!/^55\d{10,11}$/.test(cleanPhone)) {
  // Invalid phone number
}

// Message length validation
if (message.length > 4096) {
  // Message too long
}
```

### API Error Handling

```typescript
try {
  const result = await whatsappIntegration.sendMessage(messageData);

  if (!result.success) {
    // Handle different error types
    switch (result.error) {
      case "Business API not configured":
        // Fallback to URL method
        break;
      case "Invalid recipient phone number format":
        // Show validation error
        break;
      default:
        // Generic error handling
        break;
    }
  }
} catch (error) {
  // Network or unexpected errors
}
```

## Analytics & Tracking

### Tracked Events

```typescript
// URL redirects
analytics.track("whatsapp_redirect", {
  message_length: number,
  has_context: boolean,
  segments: string[],
  intent: string,
  page: string
})

// API messages sent
analytics.track("whatsapp_api_message_sent", {
  message_id: string,
  recipient: string,
  message_length: number,
  context: WhatsAppMessage['context']
})

// API errors
analytics.track("whatsapp_api_error", {
  error_code?: string,
  error_message: string,
  http_status?: number,
  error_type?: string,
  context: WhatsAppMessage['context']
})
```

### Chat Integration

The live chat component (`LiveChat`) automatically integrates WhatsApp:

```typescript
// Automatic WhatsApp redirect from chat
const startWhatsApp = () => {
  const context = {
    segments: activeSegments,
    intent: "contact",
    page: window.location.pathname,
  };

  const urls = whatsappIntegration.generateContactUrls(context);
  window.open(urls.whatsapp, "_blank");
};
```

## Testing

### API Connectivity Test

```typescript
// Test Business API connection
const testResult = await whatsappIntegration.testAPIConnection();

if (testResult.success) {
  console.log("API Connected:", testResult.details);
} else {
  console.error("API Test Failed:", testResult.error);
}
```

### WhatsApp Availability Check

```typescript
// Check if WhatsApp Web is available (client-side only)
const available = await whatsappIntegration.isWhatsAppAvailable();
if (available) {
  // WhatsApp Web detected
} else {
  // Fallback to mobile app URL
}
```

## Best Practices

### 1. Phone Number Format

- Always use international format without `+` prefix
- Example: `5511999999999` (Brazil)
- Validate format before sending

### 2. Message Length

- WhatsApp Business API limit: 4096 characters
- Keep messages concise and actionable
- Use personalization sparingly

### 3. Error Handling

- Always check `result.success` before proceeding
- Implement proper fallbacks (URL when API fails)
- Log errors for debugging but don't expose sensitive data

### 4. Privacy & Compliance

- Don't store message content unnecessarily
- Respect user consent for messaging
- Include clear opt-out instructions

### 5. Rate Limiting

- WhatsApp Business API has rate limits
- Implement exponential backoff for retries
- Monitor API usage and costs

## Troubleshooting

### Common Issues

1. **"Business API not configured"**
   - Solution: Configure `WHATSAPP_BUSINESS_ACCOUNT_ID` and `WHATSAPP_ACCESS_TOKEN`

2. **"Invalid recipient phone number format"**
   - Solution: Ensure phone numbers are in international format (5511999999999)

3. **"Message too long"**
   - Solution: Truncate or split long messages

4. **WhatsApp Web not detected**
   - Solution: Method checks for WhatsApp Web availability
   - Fallback: Always provide mobile app URLs

### Debug Information

```typescript
// Check configuration status
console.log("API Configured:", whatsappIntegration.isBusinessAPIConfigured());

// Test API connection
const test = await whatsappIntegration.testAPIConnection();
console.log("API Test:", test);
```

## Security Considerations

- Never log API tokens or sensitive message content
- Validate all input data before API calls
- Use HTTPS for all WhatsApp API communications
- Implement proper CORS policies for webhooks
- Regular rotation of API credentials

## Performance

- URL generation is synchronous and instant
- API calls include timeout handling (default: 30s)
- Client-side availability checks are optimized
- Minimal bundle impact when API features are unused

## Future Enhancements

- **Media Support**: Image, document, and video attachments
- **Interactive Messages**: Buttons, lists, and quick replies
- **Webhooks**: Real-time message status updates
- **Templates**: Pre-approved message templates for marketing
- **Multi-language**: Localized message generation
