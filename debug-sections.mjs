// Simple debug script to check section configuration
import fs from 'fs'

console.log('=== DEBUG: Section Configuration Analysis ===')

// Read the page composition service to check landing config
const serviceFile = fs.readFileSync('./lib/composition/services/page-composition-service.ts', 'utf8')

// Extract landing configuration
const landingMatch = serviceFile.match(/landing:\s*{\s*sections:\s*\[([\s\S]*?)\]/)
if (landingMatch) {
  const sectionsText = landingMatch[1]
  const sectionMatches = sectionsText.matchAll(/{\s*id:\s*'([^']+)'/g)
  const sections = Array.from(sectionMatches).map(match => match[1])

  console.log('📋 Landing page configured sections:')
  sections.forEach((section, index) => {
    console.log(`${index + 1}. ${section}`)
  })
  console.log(`\n📊 Total configured sections: ${sections.length}`)
} else {
  console.log('❌ Could not find landing configuration')
}

// Check which sections are mapped in route-based-lazy-loading
const lazyFile = fs.readFileSync('./lib/composition/performance/route-based-lazy-loading.tsx', 'utf8')
const mapMatch = lazyFile.match(/const sectionComponentMap.*= {\s*([\s\S]*?)}/)
if (mapMatch) {
  const mapText = mapMatch[1]
  const mappedSections = mapText.matchAll(/'([^']+)':/g)
  const sections = Array.from(mappedSections).map(match => match[1])

  console.log('\n🗺️ Sections mapped in componentMap:')
  sections.forEach((section, index) => {
    console.log(`${index + 1}. ${section}`)
  })
  console.log(`\n📊 Total mapped sections: ${sections.length}`)
} else {
  console.log('\n❌ Could not find sectionComponentMap')
}

// Check ContentMapper cases
const mapperFile = fs.readFileSync('./lib/composition/services/content-mapper.ts', 'utf8')
const switchMatch = mapperFile.match(/switch \(sectionId\) {\s*([\s\S]*?)\s*default:/)
if (switchMatch) {
  const casesText = switchMatch[1]
  const caseMatches = casesText.matchAll(/case '([^']+)':/g)
  const cases = Array.from(caseMatches).map(match => match[1])

  console.log('\n📝 ContentMapper cases:')
  cases.forEach((section, index) => {
    console.log(`${index + 1}. ${section}`)
  })
  console.log(`\n📊 Total ContentMapper cases: ${cases.length}`)
} else {
  console.log('\n❌ Could not find ContentMapper switch')
}

console.log('\n=== ANALYSIS COMPLETE ===')
