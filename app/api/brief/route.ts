import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { fetchWikipediaContext } from '@/lib/wikipediaRAG'
import { IntelEvent, CorrelationAlert, Plot } from '@/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface BriefRequest {
  country: string
  countryCode: string
  recentEvents?: IntelEvent[]
  correlationAlerts?: CorrelationAlert[]
  workspaceContext?: { plots: Plot[] }
}

export async function POST(req: NextRequest) {
  const body: BriefRequest = await req.json()
  const { country, countryCode, recentEvents = [], correlationAlerts = [], workspaceContext } = body

  const [wikiContext, profileRes] = await Promise.all([
    fetchWikipediaContext(country),
    fetch(new URL(`/api/country/${countryCode}`, req.nextUrl.origin).toString()).then(r => r.json()).catch(() => null),
  ])

  const profile = profileRes
  const nearbyPlots = workspaceContext?.plots || []
  const criticalPlots = nearbyPlots.filter(p => p.threat_level === 'critical')

  const systemPrompt = `You are a senior intelligence analyst at Weiss & Hirsch geopolitical risk consultancy. Generate a structured intelligence brief using formal IC-style language. Be specific, cite data points, avoid hedging. Assess probabilities using the IC scale: almost certain (>95%), likely (70-95%), roughly even chance (40-60%), unlikely (5-30%), remote (<5%). Return ONLY valid JSON matching the exact schema provided.`

  const userPrompt = `Generate an intelligence brief for: ${country} (${countryCode})

COUNTRY PROFILE:
${profile ? JSON.stringify({
  riskScore: profile.riskScore,
  gdp: profile.gdp,
  gdpGrowth: profile.gdpGrowth,
  inflation: profile.inflation,
  freedomScore: profile.freedomScore,
  fragilityScore: profile.fragilityScore,
  population: profile.population,
}, null, 2) : 'Data unavailable'}

RECENT INTELLIGENCE (${recentEvents.length} events):
${recentEvents.slice(0, 10).map(e => `- [${e.severity.toUpperCase()}] ${e.title} (${e.source}, ${e.timestamp.slice(0, 10)})`).join('\n')}

ACTIVE CORRELATION ALERTS:
${correlationAlerts.slice(0, 5).map(a => `- [${a.severity.toUpperCase()}] ${a.title}: ${a.summary} (Confidence: ${a.confidence}%)`).join('\n')}

WIKIPEDIA STRUCTURAL CONTEXT:
${wikiContext.slice(0, 2000)}

${nearbyPlots.length > 0 ? `ANALYST WORKSPACE INTELLIGENCE (${nearbyPlots.length} analyst plots):
${nearbyPlots.map(p => `- [${p.threat_level.toUpperCase()}] ${p.title}: ${p.notes || p.description || 'No notes'}`).join('\n')}` : ''}

Return this exact JSON schema:
{
  "executiveSummary": "3-4 sentence strategic overview",
  "situationAssessment": "detailed paragraph on current situation",
  "keyActors": [{"name": "string", "role": "string", "assessment": "string"}],
  "riskFactors": [{"factor": "string", "severity": "critical|high|medium|low", "detail": "string"}],
  "economicExposure": "paragraph on economic risks",
  "outlook30": "30-day outlook with IC probability language",
  "outlook90": "90-day outlook with IC probability language",
  "watchItems": ["string"],
  "confidenceLevel": "HIGH|MODERATE|LOW with explanation",
  "analystNotes": "${criticalPlots.length > 0 ? 'Include analyst workspace intelligence here' : null}"
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    result._meta = {
      country,
      countryCode,
      generatedAt: new Date().toISOString(),
      sourceCount: recentEvents.length,
      wikiContext: wikiContext.length > 0,
      workspaceContext: nearbyPlots.length > 0,
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    return NextResponse.json({
      executiveSummary: `Intelligence brief generation for ${country} is currently unavailable. Please ensure OpenAI API key is configured.`,
      situationAssessment: 'System is operating in degraded mode.',
      keyActors: [],
      riskFactors: [{ factor: 'Data Unavailable', severity: 'medium', detail: 'API connection required for full assessment.' }],
      economicExposure: 'Economic data compilation in progress.',
      outlook30: 'Assessment pending.',
      outlook90: 'Assessment pending.',
      watchItems: ['Configure OpenAI API key in .env.local'],
      confidenceLevel: 'LOW — API key required',
      _error: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}
