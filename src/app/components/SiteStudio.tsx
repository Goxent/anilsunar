import React, { useState, useEffect } from 'react'
import { 
  Layout, 
  Eye, 
  EyeOff, 
  MoveUp, 
  MoveDown, 
  Save, 
  Edit3, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Type,
  Image as ImageIcon,
  MousePointer2
} from 'lucide-react'
import { db } from '../lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useToast } from '../AppShell'

const DEFAULT_SECTIONS = [
  { id: 'hero',       label: 'Hero Section',    visible: true },
  { id: 'about',      label: 'About Me',        visible: true },
  { id: 'experience', label: 'Experience',      visible: true },
  { id: 'projects',   label: 'Projects',        visible: true },
  { id: 'creative',   label: 'Creative Space',  visible: true },
  { id: 'courses',    label: 'Courses',         visible: true },
  { id: 'posts',      label: 'Writing & Posts', visible: true }
]

export default function SiteStudio() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sections, setSections] = useState(DEFAULT_SECTIONS)
  const [siteSettings, setSiteSettings] = useState<any>({
    hero: { title: '', subtitle: '' },
    contact: { email: '', address: '' }
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'landing_page'))
      if (snap.exists()) {
        const data = snap.data()
        if (data.sections) setSections(data.sections)
        if (data.hero) setSiteSettings(prev => ({ ...prev, hero: data.hero }))
        if (data.contact) setSiteSettings(prev => ({ ...prev, contact: data.contact }))
      }
    } catch (err) {
      console.error("Failed to fetch site config", err)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'landing_page'), {
        sections,
        ...siteSettings,
        updatedAt: new Date().toISOString()
      }, { merge: true })
      showToast("Site configuration updated live!", "success")
    } catch (err: any) {
      showToast(err.message, "error")
    } finally {
      setSaving(false)
    }
  }

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newSections.length) return
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]]
    setSections(newSections)
  }

  const toggleVisibility = (id: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div>
    </div>
  )

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-1">Site Studio</h1>
          <p className="text-2 text-sm mt-1">Visually arrange and customize your main portfolio website.</p>
        </div>
        <div className="flex gap-3">
          <a 
            href="https://anilsunar.com.np" 
            target="_blank" 
            className="btn flex items-center gap-2"
          >
            <ExternalLink size={16} /> View Site
          </a>
          <button 
            onClick={saveConfig}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
          >
            {saving ? <Layout size={16} className="animate-pulse" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Publish Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
        
        {/* SECTION ARRANGEMENT */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Layout size={18} className="text-gold" />
            <span className="text-xs font-bold text-3 uppercase tracking-widest">Page Structure</span>
          </div>
          
          <div className="flex flex-col gap-2">
            {sections.map((section, index) => (
              <div 
                key={section.id}
                className={`card-base p-4 flex items-center justify-between transition-all ${!section.visible ? 'opacity-50 grayscale' : 'border-gold-border/20'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-bg-2 rounded text-3 disabled:opacity-0"
                    >
                      <MoveUp size={14} />
                    </button>
                    <button 
                      onClick={() => moveSection(index, 'down')}
                      disabled={index === sections.length - 1}
                      className="p-1 hover:bg-bg-2 rounded text-3 disabled:opacity-0"
                    >
                      <MoveDown size={14} />
                    </button>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-1">{section.label}</span>
                    <span className="text-[10px] text-3 font-mono">#{section.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleVisibility(section.id)}
                    className={`p-2 rounded-full transition-all ${section.visible ? 'bg-gold-dim text-gold' : 'bg-bg-2 text-3'}`}
                    title={section.visible ? "Visible" : "Hidden"}
                  >
                    {section.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CONTENT CUSTOMIZATION */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 mb-2">
            <Edit3 size={18} className="text-blue" />
            <span className="text-xs font-bold text-3 uppercase tracking-widest">Global Content</span>
          </div>

          <div className="card-base p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Type size={14} className="text-gold" />
                <span className="text-[11px] font-bold text-2 uppercase">Hero Headline</span>
              </div>
              <input 
                type="text" 
                value={siteSettings.hero.title}
                onChange={(e) => setSiteSettings({ ...siteSettings, hero: { ...siteSettings.hero, title: e.target.value } })}
                placeholder="e.g. CA Professional & Artist"
                className="bg-bg-2 border border-border rounded-lg p-3 text-sm text-1 focus:border-gold outline-none"
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Edit3 size={14} className="text-gold" />
                <span className="text-[11px] font-bold text-2 uppercase">Hero Subtitle</span>
              </div>
              <textarea 
                rows={3}
                value={siteSettings.hero.subtitle}
                onChange={(e) => setSiteSettings({ ...siteSettings, hero: { ...siteSettings.hero, subtitle: e.target.value } })}
                placeholder="Brief introduction..."
                className="bg-bg-2 border border-border rounded-lg p-3 text-sm text-1 focus:border-gold outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-3 uppercase">Contact Email</span>
                <input 
                  type="text" 
                  value={siteSettings.contact.email}
                  onChange={(e) => setSiteSettings({ ...siteSettings, contact: { ...siteSettings.contact, email: e.target.value } })}
                  className="bg-bg-2 border border-border rounded-lg p-2 text-xs text-1"
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-3 uppercase">Location</span>
                <input 
                  type="text" 
                  value={siteSettings.contact.address}
                  onChange={(e) => setSiteSettings({ ...siteSettings, contact: { ...siteSettings.contact, address: e.target.value } })}
                  className="bg-bg-2 border border-border rounded-lg p-2 text-xs text-1"
                />
              </div>
            </div>
          </div>

          {/* PREVIEW TOOLTIP */}
          <div className="bg-blue-dim border border-blue-border p-4 rounded-xl flex items-start gap-4">
            <MousePointer2 size={20} className="text-blue shrink-0 mt-1" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-blue">Pro Tip</span>
              <p className="text-[11px] text-2 leading-relaxed">
                Changes saved here will reflect instantly on <strong>anilsunar.com.np</strong> without needing to redeploy. Use this to highlight specific projects or update your availability.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
