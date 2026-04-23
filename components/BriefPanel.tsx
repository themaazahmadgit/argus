'use client'
import { useState } from 'react'
import { useMapStore } from '@/stores/mapStore'
import { X, Download, Copy, CheckCircle } from 'lucide-react'
import { SEVERITY_COLORS } from '@/lib/constants'
import { format } from 'date-fns'

const STEPS = [
  'Collecting live event data...',
  'Loading historical context...',
  'Fetching economic indicators...',
  'Analyzing correlation patterns...',
  'Checking analyst workspace...',
  'Generating intelligence assessment...',
  'Formatting brief...',
]

interface BriefData {
  executiveSummary: string
  situationAssessment: string
  keyActors: { name: string; role: string; assessment: string }[]
  riskFactors: { factor: string; severity: string; detail: string }[]
  economicExposure: string
  outlook30: string
  outlook90: string
  watchItems: string[]
  confidenceLevel: string
  analystNotes?: string
  _meta?: { sourceCount: number; wikiContext: boolean }
}

export default function BriefPanel() {
  const { selectedCountry, selectedCountryCode, events, alerts, togglePanel } = useMapStore()
  const [brief, setBrief] = useState<BriefData | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [copied, setCopied] = useState(false)

  const generateBrief = async () => {
    if (!selectedCountryCode) return
    setLoading(true)
    setBrief(null)

    for (let i = 0; i < STEPS.length; i++) {
      setCurrentStep(i)
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300))
    }

    try {
      const countryEvents = events.filter(e =>
        e.countryCode === selectedCountryCode ||
        e.country.toLowerCase().includes((selectedCountry || '').toLowerCase())
      )
      const countryAlerts = alerts.filter(a => a.countries.includes(selectedCountry || ''))

      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: selectedCountry,
          countryCode: selectedCountryCode,
          recentEvents: countryEvents.slice(0, 15),
          correlationAlerts: countryAlerts,
        }),
      })
      const data = await res.json()
      setBrief(data)
    } catch {
      setBrief({
        executiveSummary: 'Brief generation failed. Please check API configuration.',
        situationAssessment: '',
        keyActors: [],
        riskFactors: [],
        economicExposure: '',
        outlook30: '',
        outlook90: '',
        watchItems: ['Configure API keys in .env.local'],
        confidenceLevel: 'LOW',
      })
    }
    setLoading(false)
  }

  const copyToClipboard = () => {
    if (!brief) return
    const text = [
      `INTELLIGENCE BRIEF — ${selectedCountry}`,
      `Generated: ${format(new Date(), 'PPP')}`,
      '',
      'EXECUTIVE SUMMARY',
      brief.executiveSummary,
      '',
      'SITUATION ASSESSMENT',
      brief.situationAssessment,
      '',
      '30-DAY OUTLOOK',
      brief.outlook30,
      '',
      '90-DAY OUTLOOK',
      brief.outlook90,
      '',
      'WATCH ITEMS',
      ...(brief.watchItems || []).map(w => `• ${w}`),
    ].join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPDF = async () => {
    if (!brief) return
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    let y = 20

    const addText = (text: string, size = 10, bold = false) => {
      doc.setFontSize(size)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      const lines = doc.splitTextToSize(text, 170)
      doc.text(lines, 20, y)
      y += lines.length * (size * 0.4) + 4
    }

    addText(`INTELLIGENCE BRIEF — ${selectedCountry?.toUpperCase()}`, 18, true)
    addText(`Weiss & Hirsch | ${format(new Date(), 'MMMM d, yyyy')}`, 9)
    y += 8
    addText('EXECUTIVE SUMMARY', 11, true)
    addText(brief.executiveSummary)
    y += 4
    addText('SITUATION ASSESSMENT', 11, true)
    addText(brief.situationAssessment)
    y += 4
    if (brief.riskFactors?.length) {
      addText('RISK FACTORS', 11, true)
      brief.riskFactors.forEach(rf => {
        addText(`[${rf.severity.toUpperCase()}] ${rf.factor}: ${rf.detail}`, 9)
      })
      y += 4
    }
    addText('30-DAY OUTLOOK', 11, true)
    addText(brief.outlook30)
    y += 4
    addText('90-DAY OUTLOOK', 11, true)
    addText(brief.outlook90)
    y += 4
    if (brief.watchItems?.length) {
      addText('WATCH ITEMS', 11, true)
      brief.watchItems.forEach(w => addText(`• ${w}`, 9))
    }

    doc.save(`ARGUS-Brief-${selectedCountry}-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 800, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Intelligence Brief</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>{selectedCountry}</div>
            {brief && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Generated {format(new Date(), 'PPpp')} · Weiss & Hirsch</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {brief && (
              <>
                <button onClick={copyToClipboard} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#F8F9FA', border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                  {copied ? <CheckCircle size={13} color="#16A34A" /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={downloadPDF} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#1D4ED8', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  <Download size={13} /> PDF
                </button>
              </>
            )}
            <button onClick={() => togglePanel('brief')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {/* Generate button if no brief */}
          {!brief && !loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 14, color: '#475569', marginBottom: 20 }}>
                Generate a comprehensive intelligence brief for <strong>{selectedCountry}</strong> using live event data, economic indicators, and AI analysis.
              </div>
              <button
                onClick={generateBrief}
                style={{ padding: '12px 28px', background: '#1D4ED8', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
              >
                Generate Intelligence Brief
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ padding: '40px 0' }}>
              {STEPS.map((step, i) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', opacity: i <= currentStep ? 1 : 0.3, transition: 'opacity 200ms' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: i < currentStep ? '#16A34A' : i === currentStep ? '#1D4ED8' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {i < currentStep ? <span style={{ color: 'white', fontSize: 11 }}>✓</span> : i === currentStep ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', display: 'block' }} /> : null}
                  </div>
                  <span style={{ fontSize: 13, color: i === currentStep ? '#0F172A' : '#475569' }}>{step}</span>
                </div>
              ))}
            </div>
          )}

          {/* Brief Content */}
          {brief && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <BriefSection title="Executive Summary">
                <p style={{ fontSize: 13, lineHeight: 1.7, color: '#0F172A', margin: 0 }}>{brief.executiveSummary}</p>
              </BriefSection>

              <BriefSection title="Situation Assessment">
                <p style={{ fontSize: 13, lineHeight: 1.7, color: '#0F172A', margin: 0 }}>{brief.situationAssessment}</p>
              </BriefSection>

              {brief.keyActors?.length > 0 && (
                <BriefSection title="Key Actors">
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                          {['Actor', 'Role', 'Assessment'].map(h => (
                            <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {brief.keyActors.map((actor, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #F1F3F5' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0F172A' }}>{actor.name}</td>
                            <td style={{ padding: '8px 10px', color: '#475569' }}>{actor.role}</td>
                            <td style={{ padding: '8px 10px', color: '#475569' }}>{actor.assessment}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </BriefSection>
              )}

              {brief.riskFactors?.length > 0 && (
                <BriefSection title="Risk Factors">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {brief.riskFactors.map((rf, i) => (
                      <div key={i} style={{ padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, borderLeft: `3px solid ${SEVERITY_COLORS[rf.severity as keyof typeof SEVERITY_COLORS] || '#94A3B8'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{rf.factor}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: SEVERITY_COLORS[rf.severity as keyof typeof SEVERITY_COLORS] || '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{rf.severity}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.5 }}>{rf.detail}</p>
                      </div>
                    ))}
                  </div>
                </BriefSection>
              )}

              <BriefSection title="Economic Exposure">
                <p style={{ fontSize: 13, lineHeight: 1.7, color: '#0F172A', margin: 0 }}>{brief.economicExposure}</p>
              </BriefSection>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <BriefSection title="30-Day Outlook">
                  <p style={{ fontSize: 12, lineHeight: 1.6, color: '#0F172A', margin: 0 }}>{brief.outlook30}</p>
                </BriefSection>
                <BriefSection title="90-Day Outlook">
                  <p style={{ fontSize: 12, lineHeight: 1.6, color: '#0F172A', margin: 0 }}>{brief.outlook90}</p>
                </BriefSection>
              </div>

              {brief.watchItems?.length > 0 && (
                <BriefSection title="Watch Items">
                  <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {brief.watchItems.map((w, i) => (
                      <li key={i} style={{ fontSize: 12, color: '#0F172A', lineHeight: 1.5 }}>{w}</li>
                    ))}
                  </ul>
                </BriefSection>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #E2E8F0', fontSize: 11, color: '#94A3B8' }}>
                <span>Confidence Level: <strong style={{ color: '#0F172A' }}>{brief.confidenceLevel}</strong></span>
                <span>Informed by {brief._meta?.sourceCount || 0} intelligence sources{brief._meta?.wikiContext ? ' + Wikipedia context' : ''}</span>
              </div>

              {brief.analystNotes && (
                <BriefSection title="Analyst Workspace Intelligence">
                  <p style={{ fontSize: 12, lineHeight: 1.6, color: '#0F172A', margin: 0, fontStyle: 'italic' }}>{brief.analystNotes}</p>
                </BriefSection>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BriefSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}
