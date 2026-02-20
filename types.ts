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
  type: 'Poetry' | 'Rap';
  excerpt: string;
  content?: string;
  link?: string;
}

export interface NavItem {
  label: string;
  href: string;
}