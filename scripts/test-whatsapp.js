#!/usr/bin/env node

/**
 * WhatsApp Integration Configuration Test
 * Tests the WhatsApp environment variables and configuration
 */

const path = require("path");
const fs = require("fs");

function testWhatsAppConfiguration() {
  console.log("🧪 Testing WhatsApp Configuration\n");

  try {
    // Load environment variables manually
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      envContent.split("\n").forEach((line) => {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          if (value && !value.startsWith("#")) {
            process.env[key.trim()] = value.replace(/^["']|["']$/g, ""); // Remove quotes
          }
        }
      });
      console.log("✅ Loaded .env.local");
    } else {
      console.log("⚠️  .env.local not found, using defaults");
    }

    // Test environment variables
    const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    // Test 1: Phone number configuration
    console.log("\n📱 Phone Number Configuration:");
    if (phoneNumber) {
      console.log("✅ Configured:", phoneNumber);

      // Basic validation
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      if (/^55\d{10,11}$/.test(cleanPhone)) {
        console.log("✅ Format valid (Brazilian phone number)");
      } else {
        console.log("⚠️  Format may be invalid (expected: 5511999999999)");
      }

      // Generate expected WhatsApp URL
      const encodedMessage = encodeURIComponent(
        "Olá, gostaria de mais informações!",
      );
      const expectedUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      console.log(
        "📱 Sample WhatsApp URL:",
        expectedUrl.substring(0, 60) + "...",
      );
    } else {
      console.log("❌ Not configured - set NEXT_PUBLIC_WHATSAPP_NUMBER");
    }

    // Test 2: Business API configuration
    console.log("\n🔧 Business API Configuration:");
    if (businessAccountId && accessToken) {
      console.log("✅ Business API configured");
      console.log("📊 Account ID:", businessAccountId.substring(0, 10) + "...");
      console.log("🔑 Token length:", accessToken.length, "characters");
      console.log("💡 You can send programmatic messages via WhatsApp API");
    } else {
      console.log("ℹ️  Business API not configured (optional)");
      console.log("💡 Integration will use WhatsApp URL redirects instead");
    }

    // Test 3: Additional configuration
    console.log("\n📧 Additional Configuration:");
    console.log("Email:", process.env.CONTACT_EMAIL || "Not configured");
    console.log(
      "Site URL:",
      process.env.NEXT_PUBLIC_SITE_URL || "Not configured",
    );
    console.log(
      "API Version:",
      process.env.WHATSAPP_API_VERSION || "v18.0 (default)",
    );

    // Summary
    console.log("\n📋 Configuration Summary:");
    const hasBasic = !!phoneNumber;
    const hasAPI = !!(businessAccountId && accessToken);

    console.log(
      `📱 Basic Setup: ${hasBasic ? "✅ Complete" : "❌ Missing phone number"}`,
    );
    console.log(
      `🔧 Business API: ${hasAPI ? "✅ Configured" : "ℹ️  Not configured (URL fallback)"}`,
    );

    if (hasBasic) {
      console.log("\n🎉 WhatsApp integration is ready!");
      console.log("💡 Test it in the browser at /playground/whatsapp-test");
      console.log("💡 Or run: npm run dev and click the chat button");
    } else {
      console.log(
        "\n⚠️  Configure NEXT_PUBLIC_WHATSAPP_NUMBER to enable WhatsApp integration",
      );
    }

    // Instructions
    console.log("\n📝 To configure WhatsApp Business API (optional):");
    console.log("1. Go to: https://developers.facebook.com/");
    console.log("2. Create/select an app");
    console.log("3. Add WhatsApp product");
    console.log("4. Configure your phone number");
    console.log("5. Copy Business Account ID and generate Access Token");
    console.log("6. Add to .env.local:");
    console.log("   WHATSAPP_BUSINESS_ACCOUNT_ID=your_id");
    console.log("   WHATSAPP_ACCESS_TOKEN=your_token");
  } catch (error) {
    console.error("❌ Configuration test failed:", error.message);
  }
}

// Run the test
testWhatsAppConfiguration();
