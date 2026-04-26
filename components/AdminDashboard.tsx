import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, Check, Youtube, ExternalLink, AlertTriangle, Settings, UploadCloud, Github, Loader2 } from 'lucide-react';

import videosJson from '../src/content/videos.json';
import postsJson from '../src/content/posts.json';
import projectsJson from '../src/content/projects.json';
import experienceJson from '../src/content/experience.json';
import coursesJson from '../src/content/courses.json';
import settingsJson from '../src/content/settings.json';

interface AdminDashboardProps {
  onClose?: () => void;
}

type TabId = 'videos' | 'posts' | 'projects' | 'experience' | 'courses' | 'settings';

const TABS: { id: TabId; label: string; file: string }[] = [
  { id: 'videos',     label: 'Videos',     file: 'src/content/videos.json' },
  { id: 'posts',      label: 'Posts',       file: 'src/content/posts.json' },
  { id: 'projects',   label: 'Projects',    file: 'src/content/projects.json' },
  { id: 'experience', label: 'Experience',  file: 'src/content/experience.json' },
  { id: 'courses',    label: 'Courses',     file: 'src/content/courses.json' },
  { id: 'settings',   label: 'Site Settings',file: 'src/content/settings.json' },
];

const INITIAL_DATA: Record<TabId, any> = {
  videos:     videosJson,
  posts:      postsJson,
  projects:   projectsJson,
  experience: experienceJson,
  courses:    coursesJson,
  settings:   settingsJson,
};

const BLANK_ITEMS: Record<TabId, any> = {
  videos:     { id: `v${Date.now()}`, title: '', youtubeId: '', description: '', date: new Date().toISOString().split('T')[0], thumbnail: '' },
  posts:      { id: `p${Date.now()}`, title: '', excerpt: '', date: new Date().toISOString().split('T')[0], url: '', platform: 'LinkedIn' },
  projects:   { id: `pr${Date.now()}`, title: '', description: '', tags: [], status: 'Building', link: '' },
  experience: { id: `e${Date.now()}`, role: '', company: '', period: '', description: '', skills: [] },
  courses:    { id: `c${Date.now()}`, title: '', provider: '', date: '', description: '', url: '' },
  settings:   {},
};

const PLATFORMS = ['LinkedIn', 'Medium', 'Blog', 'Other'];

function FieldInput({ label, value, onChange, type = 'text', options }: {
  label: string; value: any; onChange: (v: any) => void; type?: string; options?: string[]
}) {
  const baseStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)',
    color: 'var(--text-primary)', fontSize: 13,
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
        {label}
      </label>
      {options ? (
        <select value={value || ''} onChange={e => onChange(e.target.value)} style={baseStyle}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={3} style={{ ...baseStyle, resize: 'vertical' }} />
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} style={baseStyle} />
      )}
    </div>
  );
}

function VideoCard({ item, onChange, onDelete }: { item: any; onChange: (updated: any) => void; onDelete: () => void }) {
  return (
    <div className="card" style={{ borderLeft: '3px solid var(--gold)', marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <img
          src={`https://img.youtube.com/vi/${item.youtubeId || 'default'}/mqdefault.jpg`}
          alt="thumbnail"
          style={{ width: 120, height: 68, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: '#111' }}
          onError={e => (e.currentTarget.src = 'https://img.youtube.com/vi/default/mqdefault.jpg')}
        />
        <div style={{ flex: 1 }}>
          <FieldInput label="Title" value={item.title} onChange={v => onChange({ ...item, title: v })} />
          <FieldInput label="YouTube ID" value={item.youtubeId} onChange={v => onChange({ ...item, youtubeId: v, thumbnail: `https://img.youtube.com/vi/${v}/maxresdefault.jpg` })} />
        </div>
      </div>
      <FieldInput label="Description" value={item.description} type="textarea" onChange={v => onChange({ ...item, description: v })} />
      <FieldInput label="Date" value={item.date} type="date" onChange={v => onChange({ ...item, date: v })} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {item.youtubeId && (
          <a href={`https://youtube.com/watch?v=${item.youtubeId}`} target="_blank" rel="noopener noreferrer" className="btn" style={{ fontSize: 12 }}>
            <ExternalLink size={12} /> View
          </a>
        )}
        <button onClick={() => { if (confirm('Delete this video?')) onDelete(); }} className="btn" style={{ color: 'var(--red)', fontSize: 12 }}>
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
}

function GenericCard({ item, fields, onChange, onDelete }: {
  item: any; fields: { key: string; label: string; type?: string; options?: string[] }[];
  onChange: (updated: any) => void; onDelete: () => void;
}) {
  return (
    <div className="card" style={{ borderLeft: '3px solid rgba(245,158,11,0.4)', marginBottom: 16 }}>
      {fields.map(f => (
        <FieldInput
          key={f.key} label={f.label}
          value={Array.isArray(item[f.key]) ? item[f.key].join(', ') : item[f.key]}
          type={f.type} options={f.options}
          onChange={v => onChange({ ...item, [f.key]: (f.type === 'tags' || Array.isArray(item[f.key])) ? v.split(',').map((s: string) => s.trim()) : v })}
        />
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => { if (confirm('Delete this item?')) onDelete(); }} className="btn" style={{ color: 'var(--red)', fontSize: 12 }}>
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
}

const TAB_FIELDS: Record<Exclude<TabId, 'settings'>, { key: string; label: string; type?: string; options?: string[] }[]> = {
  videos: [],
  posts: [
    { key: 'title', label: 'Title' },
    { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'url', label: 'URL' },
    { key: 'platform', label: 'Platform', options: PLATFORMS },
  ],
  projects: [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'tags', label: 'Tags (comma-separated)' },
    { key: 'status', label: 'Status', options: ['Building', 'Live', 'Archived'] },
    { key: 'link', label: 'Link' },
  ],
  experience: [
    { key: 'role', label: 'Role' },
    { key: 'company', label: 'Company' },
    { key: 'period', label: 'Period' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'skills', label: 'Skills (comma-separated)' },
  ],
  courses: [
    { key: 'title', label: 'Title' },
    { key: 'provider', label: 'Provider' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'url', label: 'URL' },
  ],
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabId>('settings');
  const [data, setData] = useState<Record<TabId, any>>(INITIAL_DATA);
  const [githubToken, setGithubToken] = useState(localStorage.getItem('goxent_github_token') || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const currentTab = TABS.find(t => t.id === activeTab)!;

  useEffect(() => {
    localStorage.setItem('goxent_github_token', githubToken);
  }, [githubToken]);

  const handleSaveToGithub = async () => {
    if (!githubToken) {
      setSaveStatus({ type: 'error', msg: 'GitHub Token is required to save live to website.' });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const content = JSON.stringify(data[activeTab], null, 2);
      const encodedContent = btoa(unescape(encodeURIComponent(content)));
      
      const repoPath = `Goxent/anilsunar`;
      const filePath = currentTab.file;

      // 1. Get current file SHA
      let sha = '';
      const getRes = await fetch(`https://api.github.com/repos/${repoPath}/contents/${filePath}`, {
        headers: { Authorization: `token ${githubToken}` }
      });
      if (getRes.ok) {
        const getJson = await getRes.json();
        sha = getJson.sha;
      }

      // 2. Put new file
      const putRes = await fetch(`https://api.github.com/repos/${repoPath}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          Authorization: `token ${githubToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Update ${filePath} via CMS`,
          content: encodedContent,
          sha: sha || undefined
        })
      });

      if (!putRes.ok) {
        const err = await putRes.json();
        throw new Error(err.message || 'Failed to push to GitHub');
      }

      setSaveStatus({ type: 'success', msg: 'Successfully saved to GitHub! Website will update in ~30 seconds.' });
    } catch (err: any) {
      setSaveStatus({ type: 'error', msg: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = () => {
    if (activeTab === 'settings') return;
    const blank = { ...BLANK_ITEMS[activeTab], id: `${activeTab[0]}${Date.now()}` };
    setData(prev => ({ ...prev, [activeTab]: [blank, ...prev[activeTab]] }));
  };

  const handleChange = (index: number, updated: any) => {
    setData(prev => {
      const arr = [...prev[activeTab]];
      arr[index] = updated;
      return { ...prev, [activeTab]: arr };
    });
  };

  const handleDelete = (index: number) => {
    setData(prev => {
      const arr = [...prev[activeTab]];
      arr.splice(index, 1);
      return { ...prev, [activeTab]: arr };
    });
  };

  const handleSettingsChange = (section: string, key: string, val: string) => {
    setData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [section]: {
          ...prev.settings[section],
          [key]: val
        }
      }
    }));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', paddingBottom: 64 }}>
      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800 }}>Live CMS</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Directly update your main website content via the GitHub API. No coding required.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 300 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
            <Github size={16} />
            <input 
              type="password" 
              placeholder="GitHub Personal Access Token" 
              value={githubToken} 
              onChange={e => setGithubToken(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 6, background: '#111', border: '1px solid var(--border)', color: '#fff', fontSize: 12 }}
            />
          </div>
          <button onClick={handleSaveToGithub} disabled={isSaving || !githubToken} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            {isSaving ? 'Pushing to GitHub...' : 'Publish Changes Live'}
          </button>
        </div>
      </div>

      {saveStatus && (
        <div style={{ padding: '12px 32px', background: saveStatus.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderBottom: `1px solid ${saveStatus.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, color: saveStatus.type === 'success' ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {saveStatus.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          <span style={{ fontSize: 13, fontWeight: 500 }}>{saveStatus.msg}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '16px 32px', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSaveStatus(null); }}
            className="btn"
            style={{
              background: activeTab === tab.id ? 'var(--gold-dim)' : 'transparent',
              color: activeTab === tab.id ? 'var(--gold)' : 'var(--text-secondary)',
              borderColor: activeTab === tab.id ? 'rgba(245,158,11,0.3)' : 'transparent',
              fontSize: 13,
              whiteSpace: 'nowrap'
            }}
          >
            {tab.id === 'videos' ? <Youtube size={13} /> : tab.id === 'settings' ? <Settings size={13} /> : null}
            {tab.label}
            {tab.id !== 'settings' && <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}>({data[tab.id].length})</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 32px', maxWidth: 800 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Editing File: <code style={{ color: 'var(--gold)', background: 'rgba(245,158,11,0.08)', padding: '2px 8px', borderRadius: 4 }}>{currentTab.file}</code>
          </p>
          {activeTab !== 'settings' && (
            <button onClick={handleAdd} className="btn" style={{ padding: '4px 10px', fontSize: 12 }}>
              <Plus size={14} /> Add New
            </button>
          )}
        </div>

        {activeTab === 'settings' ? (
          <div className="space-y-6">
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--gold)' }}>Hero Section</h3>
              <FieldInput label="Title" value={data.settings.hero?.title} onChange={v => handleSettingsChange('hero', 'title', v)} />
              <FieldInput label="Subtitle" value={data.settings.hero?.subtitle} type="textarea" onChange={v => handleSettingsChange('hero', 'subtitle', v)} />
              <FieldInput label="Availability Status" value={data.settings.hero?.availability} onChange={v => handleSettingsChange('hero', 'availability', v)} />
            </div>
            
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--gold)' }}>Contact Information</h3>
              <FieldInput label="Email" value={data.settings.contact?.email} onChange={v => handleSettingsChange('contact', 'email', v)} />
              <FieldInput label="Phone" value={data.settings.contact?.phone} onChange={v => handleSettingsChange('contact', 'phone', v)} />
              <FieldInput label="Address" value={data.settings.contact?.address} onChange={v => handleSettingsChange('contact', 'address', v)} />
            </div>

            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--gold)' }}>Social Links</h3>
              <FieldInput label="LinkedIn" value={data.settings.social?.linkedin} onChange={v => handleSettingsChange('social', 'linkedin', v)} />
              <FieldInput label="YouTube" value={data.settings.social?.youtube} onChange={v => handleSettingsChange('social', 'youtube', v)} />
              <FieldInput label="Twitter" value={data.settings.social?.twitter} onChange={v => handleSettingsChange('social', 'twitter', v)} />
              <FieldInput label="GitHub" value={data.settings.social?.github} onChange={v => handleSettingsChange('social', 'github', v)} />
            </div>
          </div>
        ) : (
          <>
            {data[activeTab].map((item: any, index: number) =>
              activeTab === 'videos' ? (
                <VideoCard
                  key={item.id || index}
                  item={item}
                  onChange={updated => handleChange(index, updated)}
                  onDelete={() => handleDelete(index)}
                />
              ) : (
                <GenericCard
                  key={item.id || index}
                  item={item}
                  fields={TAB_FIELDS[activeTab as Exclude<TabId, 'settings'>]}
                  onChange={updated => handleChange(index, updated)}
                  onDelete={() => handleDelete(index)}
                />
              )
            )}

            {data[activeTab].length === 0 && (
              <div style={{ textAlign: 'center', padding: 64, opacity: 0.4 }}>
                <p style={{ marginBottom: 16 }}>No items yet.</p>
                <button onClick={handleAdd} className="btn btn-primary"><Plus size={14} /> Add First Item</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
