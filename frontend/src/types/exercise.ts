import type { TrackingType } from './exerciseTracking';

export interface Exercise {
  [key: string]: unknown;
  _id: string;
  name: string;
  muscleGroup: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  defaultTrackingType?: TrackingType;
  equipment?: string[];
  technique?: string;
  videos?: Array<{ title: string; url: string; source: 'UPLOAD' | 'LINK' }>;
  scope: 'GLOBAL' | 'PRIVATE';
  canManage: boolean;
}
