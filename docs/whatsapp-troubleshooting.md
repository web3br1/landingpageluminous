# WhatsApp Integration Troubleshooting

## Meta Platform Access Error

### Error: "You cannot access this service. For more information refer to Meta's Platform Terms of Service and Developer Policy."

This error occurs when trying to access WhatsApp Business API or Facebook Graph API. Here's how to diagnose and resolve it.

## Common Causes & Solutions

### 1. **App Review Status**

**Problem**: Your Facebook App hasn't been approved for WhatsApp API access.

**Symptoms**:

- Error when calling WhatsApp API endpoints
- Access denied messages
- API returns 403 Forbidden

**Solution**:

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Navigate to **App Review > Permissions and Features**
4. Request approval for `whatsapp_business_messaging` permission
5. Wait for Meta review (can take 1-2 weeks)

**Temporary Workaround**:
Use URL-based messaging only (doesn't require API approval):

```bash
# Remove these from .env.local
# WHATSAPP_BUSINESS_ACCOUNT_ID=
# WHATSAPP_ACCESS_TOKEN=
```

### 2. **Invalid or Expired Credentials**

**Problem**: Access token or Business Account ID is incorrect.

**Symptoms**:

- API calls fail with authentication errors
- Token validation errors

**Verification Steps**:

```bash
# Test your credentials
curl -X GET "https://graph.facebook.com/v18.0/YOUR_BUSINESS_ACCOUNT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Solutions**:

1. **Regenerate Access Token**:
   - Go to Facebook Developers
   - Your App > WhatsApp > Settings
   - Generate new permanent access token

2. **Verify Business Account ID**:
   - Check the correct ID in WhatsApp Manager
   - Ensure it matches your app configuration

### 3. **Phone Number Not Verified**

**Problem**: WhatsApp Business number not properly set up.

**Symptoms**:

- Messages fail to send
- "Phone number not verified" errors

**Solution**:

1. Go to [WhatsApp Manager](https://business.whatsapp.com/)
2. Add and verify your phone number
3. Link it to your Facebook Business account
4. Test with a real WhatsApp message

### 4. **Rate Limiting**

**Problem**: Too many API calls in short time.

**Symptoms**:

- 429 Too Many Requests errors
- Temporary access blocks

**Solutions**:

1. **Implement exponential backoff**:

```typescript
// In your WhatsApp integration
async function sendWithRetry(messageData: WhatsAppMessage, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await whatsappIntegration.sendMessage(messageData);
      if (result.success) return result;
      if (i === maxRetries - 1) return result;
    } catch (error) {
      if (error.status === 429) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

2. **Check your API limits** in Facebook Developers dashboard

### 5. **App Configuration Issues**

**Problem**: App not properly configured for WhatsApp.

**Symptoms**:

- Business Account ID mismatch
- Webhook configuration errors

**Solution**:

1. **Verify App Setup**:
   - App must be a "Business" app type
   - WhatsApp product must be added
   - Business verification completed

2. **Check Business Account**:
   - Ensure Business Account is linked to your app
   - Verify account ownership

### 6. **Account Suspension**

**Problem**: Facebook/Meta account or app suspended.

**Symptoms**:

- Complete access denial
- Account flagged messages

**Solution**:

1. Check email for violation notices
2. Appeal the suspension if unjustified
3. Create new app/account if necessary (last resort)

## Step-by-Step Diagnosis

### 1. Run Diagnostic Tests

```bash
# Test basic configuration
npm run whatsapp:test

# Test API connectivity (if configured)
npm run whatsapp:setup
```

### 2. Check API Access

```bash
# Test token validity
curl -X GET "https://graph.facebook.com/v18.0/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Should return your app/user info
```

### 3. Verify WhatsApp Setup

```bash
# Check phone number status
curl -X GET "https://graph.facebook.com/v18.0/YOUR_BUSINESS_ACCOUNT_ID/phone_numbers" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Prevention Best Practices

### 1. **Monitor API Usage**

```typescript
// Add usage tracking
const apiUsage = {
  requests: 0,
  errors: 0,
  lastReset: Date.now(),
};

// Reset counters daily
setInterval(
  () => {
    apiUsage.requests = 0;
    apiUsage.errors = 0;
    apiUsage.lastReset = Date.now();
  },
  24 * 60 * 60 * 1000,
);
```

### 2. **Implement Proper Error Handling**

```typescript
class WhatsAppErrorHandler {
  static handleAPIError(error: any) {
    switch (error.code) {
      case 100:
        console.error("Invalid parameter");
        break;
      case 200:
        console.error("Permission denied");
        break;
      case 429:
        console.error("Rate limited - implement backoff");
        break;
      default:
        console.error("Unknown API error:", error);
    }
  }
}
```

### 3. **Regular Token Rotation**

```typescript
// Rotate tokens every 30 days
const TOKEN_ROTATION_DAYS = 30;

function shouldRotateToken(lastRotation: Date): boolean {
  const daysSinceRotation =
    (Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceRotation > TOKEN_ROTATION_DAYS;
}
```

## Emergency Fallback

If API access is blocked, switch to URL-only mode:

```typescript
// Modify integration to force URL mode
const whatsappIntegration = new WhatsAppIntegration({
  phoneNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511999999999",
  // Remove businessAccountId and accessToken
});

// All calls will use URL fallback automatically
const result = await whatsappIntegration.sendMessage(messageData);
// Returns: { success: false, error: 'Business API not configured' }
```

## Contact Support

If you believe this is an error:

1. **Meta Business Support**:
   - Visit: https://business.facebook.com/business/help
   - Submit a support ticket
   - Include your App ID and Business Account ID

2. **WhatsApp Business Support**:
   - Visit: https://developers.facebook.com/docs/whatsapp/support
   - Use the developer support form

3. **Include in your request**:
   - App ID
   - Business Account ID
   - Error messages with timestamps
   - Steps to reproduce

## Testing Checklist

- [ ] App approved for WhatsApp API access
- [ ] Access token is valid and not expired
- [ ] Business Account ID is correct
- [ ] Phone number verified in WhatsApp Manager
- [ ] Rate limits not exceeded
- [ ] App configuration complete
- [ ] Business verification passed

## Alternative Solutions

If Meta API access is problematic, consider:

1. **URL-based messaging** (current fallback)
2. **Third-party WhatsApp services** (Twilio, 360Dialog)
3. **Custom WhatsApp Web integration**
4. **Email/SMS fallbacks**

Remember: URL-based messaging works without API approval and handles most use cases effectively!
