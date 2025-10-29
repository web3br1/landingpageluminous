#!/usr/bin/env node

/**
 * WhatsApp API Diagnostic Script
 * Diagnoses WhatsApp Business API access issues
 */

const fs = require("fs");
const path = require("path");

async function diagnoseWhatsAppAPI() {
  console.log("🔍 WhatsApp API Diagnostic Tool\n");

  // Load environment variables
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        if (value && !value.startsWith("#")) {
          process.env[key.trim()] = value.replace(/^["']|["']$/g, "");
        }
      }
    });
  }

  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v18.0";

  console.log("📋 Configuration Check:");
  console.log(`Phone Number: ${phoneNumber ? "✅ Set" : "❌ Missing"}`);
  console.log(
    `Business Account ID: ${businessAccountId ? "✅ Set" : "❌ Missing"}`,
  );
  console.log(`Access Token: ${accessToken ? "✅ Set" : "❌ Missing"}`);
  console.log(`API Version: ${apiVersion}`);
  console.log();

  // Check if Business API is configured
  if (!businessAccountId || !accessToken) {
    console.log("⚠️  WhatsApp Business API not configured");
    console.log("💡 Using URL-based messaging only (no API access needed)");
    console.log("✅ This is perfectly fine for most use cases!\n");
    return;
  }

  console.log("🔧 Testing WhatsApp Business API Access...\n");

  // Test 1: Basic token validation
  console.log("1️⃣ Testing Token Validity:");
  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/me`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    );

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Token is valid");
      console.log(`   App ID: ${data.id}`);
      console.log(`   App Name: ${data.name}`);
    } else {
      console.log("❌ Token validation failed");
      console.log(`   Error: ${data.error?.message || response.statusText}`);
      console.log(`   Code: ${data.error?.code || response.status}`);

      if (data.error?.code === 190) {
        console.log("💡 This usually means the token is expired or invalid");
        console.log(
          "🔧 Solution: Generate a new access token in Facebook Developers",
        );
      }
    }
  } catch (error) {
    console.log("❌ Network error during token validation");
    console.log(`   Error: ${error.message}`);
  }

  console.log();

  // Test 2: Business Account Access
  console.log("2️⃣ Testing Business Account Access:");
  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${businessAccountId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    );

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Business Account accessible");
      console.log(`   Account ID: ${data.id}`);
      console.log(`   Account Name: ${data.name || "N/A"}`);
    } else {
      console.log("❌ Business Account access failed");
      console.log(`   Error: ${data.error?.message || response.statusText}`);
      console.log(`   Code: ${data.error?.code || response.status}`);

      if (data.error?.code === 200) {
        console.log(
          "💡 Permission denied - check if your app has WhatsApp API approval",
        );
        console.log("🔧 Solution: Request WhatsApp API approval in App Review");
      }
    }
  } catch (error) {
    console.log("❌ Network error during business account check");
    console.log(`   Error: ${error.message}`);
  }

  console.log();

  // Test 3: Phone Numbers
  console.log("3️⃣ Testing Phone Numbers:");
  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${businessAccountId}/phone_numbers`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    );

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Phone numbers accessible");
      if (data.data && data.data.length > 0) {
        data.data.forEach((phone, index) => {
          console.log(
            `   Phone ${index + 1}: ${phone.display_phone_number} (${phone.verified ? "Verified" : "Unverified"})`,
          );
        });
      } else {
        console.log("⚠️  No phone numbers found");
        console.log("💡 Add and verify a phone number in WhatsApp Manager");
      }
    } else {
      console.log("❌ Phone numbers access failed");
      console.log(`   Error: ${data.error?.message || response.statusText}`);
      console.log(`   Code: ${data.error?.code || response.status}`);
    }
  } catch (error) {
    console.log("❌ Network error during phone numbers check");
    console.log(`   Error: ${error.message}`);
  }

  console.log();

  // Test 4: Message Template (if possible)
  console.log("4️⃣ Testing Message Templates:");
  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${businessAccountId}/message_templates`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    );

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Message templates accessible");
      console.log(`   Templates: ${data.data?.length || 0} available`);
      if (data.data && data.data.length > 0) {
        data.data.slice(0, 3).forEach((template, index) => {
          console.log(
            `   Template ${index + 1}: ${template.name} (${template.status})`,
          );
        });
      }
    } else {
      console.log("❌ Message templates access failed");
      console.log(`   Error: ${data.error?.message || response.statusText}`);
      console.log(`   Code: ${data.error?.code || response.status}`);
    }
  } catch (error) {
    console.log("❌ Network error during templates check");
    console.log(`   Error: ${error.message}`);
  }

  console.log();
  console.log("📊 Diagnostic Summary:");
  console.log("======================");

  const issues = [];

  if (!businessAccountId) issues.push("Business Account ID not configured");
  if (!accessToken) issues.push("Access Token not configured");

  if (issues.length > 0) {
    console.log("❌ Configuration Issues:");
    issues.forEach((issue) => console.log(`   - ${issue}`));
  } else {
    console.log("✅ Configuration appears correct");
    console.log("💡 If API calls are failing, check:");
    console.log("   - App Review status for WhatsApp API");
    console.log("   - Business verification completion");
    console.log("   - Phone number verification in WhatsApp Manager");
  }

  console.log();
  console.log("🔗 Useful Links:");
  console.log("   Facebook Developers: https://developers.facebook.com/");
  console.log("   WhatsApp Manager: https://business.whatsapp.com/");
  console.log(
    "   API Documentation: https://developers.facebook.com/docs/whatsapp/",
  );
  console.log("   Troubleshooting: docs/whatsapp-troubleshooting.md");
}

async function testMessageSending() {
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  if (!businessAccountId || !accessToken || !phoneNumber) {
    console.log("⚠️  Skipping message test - missing configuration");
    return;
  }

  console.log(
    "\n5️⃣ Testing Message Sending (CAUTION: This may send a real message):",
  );
  console.log(
    "⚠️  This test will attempt to send a message to your configured number",
  );
  console.log("💡 Comment out this section if you don't want to test sending");

  // Uncomment to test actual message sending (be careful!)
  /*
  try {
    const testMessage = {
      to: phoneNumber,
      message: '🧪 WhatsApp API Test Message - Please ignore',
      context: {
        segments: ['test'],
        intent: 'diagnostic',
        page: '/diagnostic'
      }
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${businessAccountId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: testMessage.to,
        type: 'text',
        text: { body: testMessage.message }
      })
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Test message sent successfully')
      console.log(`   Message ID: ${data.messages?.[0]?.id}`)
    } else {
      console.log('❌ Test message failed')
      console.log(`   Error: ${data.error?.message || response.statusText}`)
      console.log(`   Code: ${data.error?.code || response.status}`)
    }
  } catch (error) {
    console.log('❌ Network error during message test')
    console.log(`   Error: ${error.message}`)
  }
  */
}

// Run diagnostics
diagnoseWhatsAppAPI()
  .then(() => {
    console.log("\n✨ Diagnostic complete!");
    console.log(
      "💡 Check the results above and refer to docs/whatsapp-troubleshooting.md for solutions",
    );
  })
  .catch((error) => {
    console.error("💥 Diagnostic failed:", error.message);
  });
