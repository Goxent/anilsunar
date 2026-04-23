import { Facebook, Instagram, Linkedin, Youtube, Mail } from 'lucide-react';
import { SocialLink, ExperienceItem, CreativeWork, NavItem, Qualification, Project } from './types';

export const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: 'LinkedIn',
    url: 'https://www.linkedin.com/in/anil-sunar-842626229/',
    icon: Linkedin,
    color: 'hover:text-blue-400'
  },
  {
    platform: 'Instagram',
    url: 'https://www.instagram.com/goxent',
    icon: Instagram,
    color: 'hover:text-pink-500'
  },
  {
    platform: 'YouTube',
    url: 'https://www.youtube.com/@goxent',
    icon: Youtube,
    color: 'hover:text-red-500'
  },
  {
    platform: 'Email',
    url: 'mailto:Anil99senchury@gmail.com',
    icon: Mail,
    color: 'hover:text-gold-500'
  }
];

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Creative', href: '#creative' },
  { label: 'Courses', href: '#courses' },
  { label: 'Writing', href: '#writing' },
  { label: 'Contact', href: '#contact' },
];

export const EXPERIENCE_DATA: ExperienceItem[] = [
  {
    id: '1',
    role: 'Audit Manager',
    company: 'Audit Firm, Nepal',
    period: 'Present',
    description: 'Leading audit engagements across diverse industry clients. Responsible for planning, executing, and reporting on financial audits, risk assessments, and internal control reviews. Managing junior audit teams and coordinating with clients to ensure compliance with Nepal Standards on Auditing.',
    skills: ['Auditing', 'Risk Assessment', 'Financial Reporting', 'Team Management', 'Nepal Standards on Auditing']
  },
  {
    id: '2',
    role: 'Audit Associate',
    company: 'Audit Firm, Nepal',
    period: '2021 – 2023',
    description: 'Conducted financial statement audits, tax compliance work, and internal control assessments for a range of private and public sector clients.',
    skills: ['Audit Execution', 'Taxation', 'Excel', 'Compliance']
  },
  {
    id: '3',
    role: 'Accounting Intern',
    company: 'Corporate Finance',
    period: '2020 – 2021',
    description: 'Supported preparation of monthly financial reports, bank reconciliations, and management of accounts payable and receivable.',
    skills: ['Bookkeeping', 'Reconciliation', 'Reporting']
  }
];

export const QUALIFICATIONS: Qualification[] = [
  { credential: "Chartered Accountant (CA)", body: "ICAN – Institute of Chartered Accountants of Nepal", year: "2023" },
  { credential: "Bachelor of Business Studies (BBS)", body: "Tribhuvan University, Nepal", year: "2020" }
];

export const PROJECTS: Project[] = [
  {
    id: "1",
    title: "Operational Workflow Automation System",
    description: "Designed and built a full-stack web application to automate repetitive operational workflows within the firm. Reduced manual processing time significantly by digitizing and automating data entry, approval chains, and reporting pipelines.",
    tags: ["Web Application", "Automation", "Process Optimization", "Full-Stack"],
    status: "Live"
  }
];

export const CREATIVE_WORKS: CreativeWork[] = [
  {
    id: '1',
    title: 'The Ledger of Life',
    type: 'Poetry',
    excerpt: 'In columns of days, we balance our breath, \nCredits of joy against debits of death. \nA trial balance that never quite squares, \nUntil the final audit catches us unawares.',
    content: `In columns of days, we balance our breath,
Credits of joy against debits of death.
A trial balance that never quite squares,
Until the final audit catches us unawares.

We vouch for moments, ticking them true,
Tracing the transaction of me and you.
But depreciation takes its toll on the soul,
As we strive to keep the fractured whole.

Yet in the ledger, a hope remains,
Of equity built from our losses and gains.`
  },
  {
    id: '2',
    title: 'Flow State (Freestyle)',
    type: 'Rap',
    excerpt: 'Numbers on the screen, rhythm in my veins, \nCalculating losses but I’m focused on the gains. \nFrom the balance sheet to the beat in the street, \nEvery line I drop completes the receipt.',
    content: `(Verse 1)
Yo, numbers on the screen, rhythm in my veins,
Calculating losses but I’m focused on the gains.
From the balance sheet to the beat in the street,
Every line I drop completes the receipt.

(Chorus)
Audit the life, check the internal control,
Money is the medium but art is the soul.
Cash flow low? My flow is high,
Reconcile the earth with the limit of the sky.

(Outro)
Signed and sealed, no material misstatement,
My legacy written in the pavement.`
  },
  {
    id: '3',
    title: 'Silent Echoes',
    type: 'Poetry',
    excerpt: 'Words unspoken are assets unseen, \nHidden in the vaults of what could have been.',
    content: `Words unspoken are assets unseen,
Hidden in the vaults of what could have been.
Invest in the voice, let the capital grow,
For silence is a debt that we all surely owe.`
  },
  {
    id: '4',
    title: 'Goxent — YouTube Channel',
    type: 'YouTube',
    excerpt: 'A creative channel exploring the intersection of finance, technology, poetry and life. Subscribe at @goxent.',
    content: 'https://www.youtube.com/@goxent'
  }
];