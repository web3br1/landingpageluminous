#!/usr/bin/env node

/**
 * WhatsApp Integration Setup Script
 * Helps configure WhatsApp Business API credentials
 */

const fs = require("fs");
const path = require("path");

console.log("🚀 WhatsApp Integration Setup\n");

// Check if .env.local exists
const envLocalPath = path.join(process.cwd(), ".env.local");
const envExamplePath = path.join(process.cwd(), ".env.local.example");

if (fs.existsSync(envLocalPath)) {
  console.log("✅ .env.local já existe");
} else {
  console.log("⚠️  .env.local não encontrado");
  console.log("📝 Crie um arquivo .env.local na raiz do projeto com:");
  console.log("");
  console.log("# Número de telefone (OBRIGATÓRIO)");
  console.log("NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999");
  console.log("");
  console.log("# WhatsApp Business API (OPCIONAL)");
  console.log("# WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id");
  console.log("# WHATSAPP_ACCESS_TOKEN=your_access_token");
  console.log("");
}

console.log("\n📋 Para configurar WhatsApp Business API (opcional):");
console.log("");
console.log("1. Acesse: https://developers.facebook.com/");
console.log("2. Crie um app ou selecione um existente");
console.log('3. Adicione o produto "WhatsApp"');
console.log("4. Configure seu número de telefone no WhatsApp Manager");
console.log("5. Copie o Business Account ID");
console.log("6. Gere um Access Token permanente");
console.log("7. Adicione as variáveis no .env.local:");
console.log("");
console.log("   WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345");
console.log("   WHATSAPP_ACCESS_TOKEN=EAA123456789...");
console.log("");

console.log("🧪 Para testar a configuração:");
console.log("");
console.log("npm run dev");
console.log("// Abra o chat no site e clique no botão WhatsApp");
console.log("");
console.log("✅ A integração funcionará mesmo sem Business API!");
console.log("💡 Use apenas URLs do WhatsApp (wa.me) por padrão.");
console.log("");

// Test basic configuration
try {
  const envContent = fs.existsSync(envLocalPath)
    ? fs.readFileSync(envLocalPath, "utf8")
    : "";
  const hasPhoneNumber = envContent.includes("NEXT_PUBLIC_WHATSAPP_NUMBER=");

  if (hasPhoneNumber) {
    console.log("✅ Configuração básica detectada (número de telefone)");
  } else {
    console.log("⚠️  Configure NEXT_PUBLIC_WHATSAPP_NUMBER no .env.local");
  }

  const hasBusinessAPI = envContent.includes("WHATSAPP_BUSINESS_ACCOUNT_ID=");

  if (hasBusinessAPI) {
    console.log("✅ WhatsApp Business API configurado");
    console.log("💡 Você pode enviar mensagens programaticamente via API");
  } else {
    console.log("ℹ️  WhatsApp Business API não configurado (opcional)");
    console.log("💡 Usando apenas redirecionamento para URLs wa.me");
  }
} catch (error) {
  console.log("❌ Erro ao verificar configuração:", error.message);
}

console.log("\n📊 Para monitorar conversões WhatsApp:");
console.log("");
console.log("- Verifique eventos no analytics (whatsapp_redirect)");
console.log("- Monitore taxa de clique no botão WhatsApp");
console.log("- Configure funnels no Google Analytics/Plausible");
console.log("");
