/**
 * Predefined Focus Areas for Freemium Users
 *
 * These are the 10 core focus areas available to all freemium users.
 * Premium users can create unlimited custom focus areas via the focus_areas table.
 *
 * @see lib/services/userService.ts for CRUD operations
 */

export interface FreemiumFocusArea {
  name: string;
  description: string;
  icon?: string;
  color?: string;
}

export const FREEMIUM_FOCUS_AREAS: FreemiumFocusArea[] = [
  {
    name: 'Career',
    description: 'Work growth, professional development, and career goals',
    icon: '💼',
    color: '#3B82F6', // Blue
  },
  {
    name: 'Relationships',
    description: 'Family, friendships, romantic relationships, and social connections',
    icon: '💞',
    color: '#EC4899', // Pink
  },
  {
    name: 'Health',
    description: 'Physical fitness, nutrition, sleep, and overall wellness',
    icon: '🏥',
    color: '#10B981', // Green
  },
  {
    name: 'Finances',
    description: 'Money management, savings, investments, and financial goals',
    icon: '💰',
    color: '#F59E0B', // Amber
  },
  {
    name: 'Personal Growth',
    description: 'Learning, skill development, self-improvement, and education',
    icon: '🌱',
    color: '#8B5CF6', // Purple
  },
  {
    name: 'Mindfulness',
    description: 'Meditation, presence, calm, and mental peace',
    icon: '🧘',
    color: '#06B6D4', // Cyan
  },
  {
    name: 'Gratitude',
    description: 'Appreciation, positive perspective, and thankfulness',
    icon: '🙏',
    color: '#FBBF24', // Yellow
  },
  {
    name: 'Family',
    description: 'Family dynamics, parenting, generational issues, and kinship',
    icon: '👨‍👩‍👧‍👦',
    color: '#F97316', // Orange
  },
  {
    name: 'Self-Esteem',
    description: 'Confidence, self-worth, identity, and personal validation',
    icon: '💪',
    color: '#EF4444', // Red
  },
  {
    name: 'Work-Life Balance',
    description: 'Managing priorities, boundaries, and lifestyle harmony',
    icon: '⚖️',
    color: '#6366F1', // Indigo
  },
];

/**
 * Get a focus area by name (case-insensitive)
 */
export function getFocusAreaByName(name: string): FreemiumFocusArea | undefined {
  return FREEMIUM_FOCUS_AREAS.find(
    (area) => area.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get all focus area names
 */
export function getAllFocusAreaNames(): string[] {
  return FREEMIUM_FOCUS_AREAS.map((area) => area.name);
}

/**
 * Validate if a focus area name is in the freemium list
 */
export function isValidFreemiumFocusArea(name: string): boolean {
  return FREEMIUM_FOCUS_AREAS.some(
    (area) => area.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get random focus area(s) for freemium users
 */
export function getRandomFocusAreas(count: number = 1): FreemiumFocusArea[] {
  const shuffled = [...FREEMIUM_FOCUS_AREAS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, FREEMIUM_FOCUS_AREAS.length));
}

export const CORE_FOCUS_AREA_TAXONOMY: Array<{
  name: string
  description: string
  examplePrompt: string
}> = [
  {
    name: 'Clarity',
    description: 'For mental fog, decisions, and overload. Sorting, naming, distinguishing.',
    examplePrompt: "What’s one thing that feels unclear right now — and one thing that doesn’t?",
  },
  {
    name: 'Emotional Balance',
    description: 'For regulating feelings without fixing them. Grounding, normalising, containing.',
    examplePrompt: 'What emotion has been asking for your attention lately?',
  },
  {
    name: 'Work & Responsibility',
    description: 'For stress, pressure, boundaries, and meaning at work. Perspective and realism.',
    examplePrompt: 'What part of your day took more energy than you expected?',
  },
  {
    name: 'Relationships',
    description: 'For family, partners, friends, and social tension. Empathy and boundaries.',
    examplePrompt: 'Where did you hold back in a conversation this week?',
  },
  {
    name: 'Change & Uncertainty',
    description: 'For transitions, waiting periods, and unsettled seasons. Patience and orientation.',
    examplePrompt: 'What feels unfinished right now — and how does that sit with you?',
  },
  {
    name: 'Grounding',
    description: 'For low moods, skipped days, or instability. Present-focused and stabilising.',
    examplePrompt: 'Right now, what feels solid beneath you?',
  },
]
