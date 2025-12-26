
export type ContentSource = 'reddit' | 'newsletter';

export interface ContentItem {
  id: string;
  source: ContentSource;
  source_url: string;
  title: string;
  content: string;
  tags: string[];
  scraped_at: string;
  metadata: Record<string, any>;
  is_saved?: boolean;
}

export interface GeneratedHook {
  id: string;
  source_content_id: string;
  hook_text: string;
  hook_type: string;
  platform: string;
  created_at: string;
}

export type ViewType = 'feed' | 'saved' | 'hooks' | 'settings';

export enum HookType {
  QUESTION = 'Pregunta',
  STATISTIC = 'Estadística',
  STORY = 'Historia',
  CONTRARIAN = 'Contrarian'
}

export enum ToneType {
  PROFESSIONAL = 'Profesional',
  CASUAL = 'Casual',
  PROVOCATIVE = 'Provocador'
}

export enum Platform {
  LINKEDIN = 'LinkedIn',
  TWITTER = 'Twitter',
  INSTAGRAM = 'Instagram'
}
