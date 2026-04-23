import { LucideIcon } from 'lucide-react';

export interface SocialLink {
  platform: string;
  url: string;
  icon: LucideIcon;
  color: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
  skills: string[];
}

export interface CreativeWork {
  id: string;
  title: string;
  type: 'Poetry' | 'Rap' | 'YouTube';
  excerpt: string;
  content?: string;
  link?: string;
}

export interface Qualification {
  credential: string;
  body: string;
  year: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: string;
}

export interface NavItem {
  label: string;
  href: string;
}