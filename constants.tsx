import { Facebook, Instagram, Linkedin, Youtube, Mail } from 'lucide-react';
import { SocialLink, ExperienceItem, CreativeWork, NavItem } from './types';

export const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: 'Instagram',
    url: 'https://instagram.com',
    icon: Instagram,
    color: 'hover:text-pink-500'
  },
  {
    platform: 'Facebook',
    url: 'https://facebook.com',
    icon: Facebook,
    color: 'hover:text-blue-500'
  },
  {
    platform: 'LinkedIn',
    url: 'https://linkedin.com',
    icon: Linkedin,
    color: 'hover:text-blue-400'
  },
  {
    platform: 'YouTube',
    url: 'https://youtube.com',
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
  { label: 'Creative', href: '#creative' },
  { label: 'AI Interact', href: '#ai-interact' },
  { label: 'Contact', href: '#contact' },
];

export const EXPERIENCE_DATA: ExperienceItem[] = [
  {
    id: '1',
    role: 'Audit Associate',
    company: 'Leading Audit Firm',
    period: '2021 - Present',
    description: 'Managed comprehensive financial audits for diverse clientele. Specialized in risk assessment, internal controls, and regulatory compliance. Led teams in analyzing financial statements to ensure accuracy and adherence to standards.',
    skills: ['Auditing', 'Financial Analysis', 'Taxation', 'Team Leadership']
  },
  {
    id: '2',
    role: 'Accounting Intern',
    company: 'Corporate Finance Dept',
    period: '2020 - 2021',
    description: 'Assisted in preparation of monthly financial reports, bank reconciliations, and managing accounts payable/receivable. Streamlined documentation processes for faster retrieval.',
    skills: ['Bookkeeping', 'Excel', 'Reconciliation', 'Reporting']
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
  }
];