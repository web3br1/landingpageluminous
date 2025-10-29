import { readdirSync } from 'fs'
import { join } from 'path'

// Test each composer individually
async function testComposers() {
  console.log('🧪 Testing individual composers...\n')

  const composersDir = './domains/marketing/composers'
  const files = readdirSync(composersDir).filter(f => f.endsWith('-composer.ts'))

  const composers = [
    'hero',
    'benefits',
    'features',
    'pricing',
    'social-proof',
    'faq',
    'demo',
    'final-cta',
    'footer'
  ]

  for (const composerName of composers) {
    const fileName = `${composerName}-composer.ts`
    const filePath = join(composersDir, fileName)

    console.log(`\n📦 Testing ${composerName} composer...`)

    try {
      const modulePath = `../${filePath.replace('.ts', '.js')}`
      const { [`compose${composerName.charAt(0).toUpperCase() + composerName.slice(1)}Content`]: composeFunction } = await import(modulePath)

      if (!composeFunction) {
        console.log(`❌ Function compose${composerName.charAt(0).toUpperCase() + composerName.slice(1)}Content not found`)
        continue
      }

      const startTime = Date.now()
      const result = composeFunction()
      const duration = Date.now() - startTime

      if (result) {
        console.log(`✅ ${composerName} composer executed successfully [${duration}ms]`)
        console.log(`   Result type: ${typeof result}`)
        if (result.content || result.envelope) {
          console.log(`   Has content: ${!!result.content || !!result.envelope}`)
        }
      } else {
        console.log(`⚠️ ${composerName} composer returned null/undefined`)
      }

    } catch (error) {
      console.error(`❌ ${composerName} composer failed:`, error.message)
      console.error(`   Stack:`, error.stack)
    }
  }

  console.log('\n🎯 Composer testing complete')
}

// Run the tests
testComposers().catch(console.error)
