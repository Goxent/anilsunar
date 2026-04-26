import React, { useState } from 'react';
import { Plus, Trash2, Copy, Check, Youtube, ExternalLink, AlertTriangle } from 'lucide-react';

// Static imports of all content JSON files
import videosJson from '../src/content/videos.json';
import postsJson from '../src/content/posts.json';
import projectsJson from '../src/content/projects.json';
import experienceJson from '../src/content/experience.json';
import coursesJson from '../src/content/courses.json';

interface AdminDashboardProps {
  onClose?: () => void;
}

type TabId = 'videos' | 'posts' | 'projects' | 'experience' | 'courses';

const TABS: { id: TabId; label: string; file: string }[] = [
  { id: 'videos',     label: 'Videos',     file: 'src/content/videos.json' },
  { id: 'posts',      label: 'Posts',       file: 'src/content/posts.json' },
  { id: 'projects',   label: 'Projects',    file: 'src/content/projects.json' },
  { id: 'experience', label: 'Experience',  file: 'src/content/experience.json' },
  { id: 'courses',    label: 'Courses',     file: 'src/content/courses.json' },
];

const INITIAL_DATA: Record<TabId, any[]> = {
  videos:     videosJson as any[],
  posts:      postsJson as any[],
  projects:   projectsJson as any[],
  experience: experienceJson as any[],
  courses:    coursesJson as any[],
};

const BLANK_ITEMS: Record<TabId, any> = {
  videos:     { id: `v${Date.now()}`, title: '', youtubeId: '', description: '', date: new Date().toISOString().split('T')[0], thumbnail: '' },
  posts:      { id: `p${Date.now()}`, title: '', excerpt: '', date: new Date().toISOString().split('T')[0], url: '', platform: 'LinkedIn' },
  projects:   { id: `pr${Date.now()}`, title: '', description: '', tags: [], status: 'Building', link: '' },
  experience: { id: `e${Date.now()}`, role: '', company: '', period: '', description: '', skills: [] },
  courses:    { id: `c${Date.now()}`, title: '', provider: '', date: '', description: '', url: '' },
};

const PLATFORMS = ['LinkedIn', 'Medium', 'Blog', 'Other'];

function CopyModal({ json, file, onClose }: { json: string; file: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 680 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Save Your Changes</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
          Copy this JSON and paste it into <code style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--gold)', padding: '2px 6px', borderRadius: 4 }}>{file}</code>, then push to GitHub.
        </p>
        <textarea
          readOnly
          value={json}
          style={{
            width: '100%', height: 320, fontFamily: 'monospace', fontSize: 12,
            background: '#050508', border: '1px solid var(--border)', borderRadius: 8,
            padding: 12, color: 'var(--text-primary)', resize: 'vertical', marginBottom: 16,
          }}
        />
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn" style={{ border: 'none' }}>Close</button>
          <button onClick={handleCopy} className="btn btn-primary">
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy to Clipboard</>}
          </button>
        </div>
      </div>
    </div>
  );
}

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

const TAB_FIELDS: Record<TabId, { key: string; label: string; type?: string; options?: string[] }[]> = {
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
  const [activeTab, setActiveTab] = useState<TabId>('videos');
  const [data, setData] = useState<Record<TabId, any[]>>(INITIAL_DATA);
  const [modal, setModal] = useState<{ json: string; file: string } | null>(null);

  const currentTab = TABS.find(t => t.id === activeTab)!;

  const handleSave = () => {
    const json = JSON.stringify(data[activeTab], null, 2);
    setModal({ json, file: currentTab.file });
  };

  const handleAdd = () => {
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {modal && <CopyModal json={modal.json} file={modal.file} onClose={() => setModal(null)} />}

      {/* Banner */}
      <div style={{
        background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.2)',
        padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 10
      }}>
        <AlertTriangle size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: 'var(--gold)' }}>
          <strong>Admin Panel</strong> — changes must be pasted into the JSON files and pushed to GitHub
        </p>
      </div>

      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Content Editor</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Edit your website content directly in the browser</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleAdd} className="btn">
            <Plus size={14} /> Add New Item
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            <Copy size={14} /> Save Changes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '16px 32px', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="btn"
            style={{
              background: activeTab === tab.id ? 'var(--gold-dim)' : 'transparent',
              color: activeTab === tab.id ? 'var(--gold)' : 'var(--text-secondary)',
              borderColor: activeTab === tab.id ? 'rgba(245,158,11,0.3)' : 'transparent',
              fontSize: 13,
            }}
          >
            {tab.id === 'videos' && <Youtube size={13} />}
            {tab.label}
            <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}>({data[tab.id].length})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 32px', maxWidth: 800 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>
          File: <code style={{ color: 'var(--gold)', background: 'rgba(245,158,11,0.08)', padding: '2px 8px', borderRadius: 4 }}>{currentTab.file}</code>
          {' '}— {data[activeTab].length} items
        </p>

        {data[activeTab].map((item, index) =>
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
              fields={TAB_FIELDS[activeTab]}
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
      </div>
    </div>
  );
};

export default AdminDashboard;
