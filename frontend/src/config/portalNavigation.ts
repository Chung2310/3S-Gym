import type { LucideIcon } from 'lucide-react';
import { BookOpen, Bot, CalendarDays, ChartNoAxesCombined, ClipboardList, Dumbbell, HeartPulse, LayoutDashboard, Map, Ruler, Salad, Search, Users } from 'lucide-react';
import type { FeatureKey, FeatureState, User, UserRole } from '../types';

export type NavigationSection = 'Tổng quan' | 'Vận hành' | 'Tri thức & trợ lý' | 'Tài khoản';
export interface NavigationItem { path: string; label: string; section: NavigationSection; icon: LucideIcon; roles: UserRole[]; feature?: FeatureKey; matchChildren?: boolean }

export const portalNavigation: NavigationItem[] = [
  { path: '/pt/dashboard', label: 'Dashboard PT', section: 'Tổng quan', icon: LayoutDashboard, roles: ['PT'], feature: 'DASHBOARD' },
  { path: '/calendar', label: 'Lịch nội bộ', section: 'Tổng quan', icon: CalendarDays, roles: ['ADMIN', 'PT'] },
  { path: '/admin', label: 'Quản lý PT', section: 'Vận hành', icon: Users, roles: ['ADMIN'], matchChildren: true },
  { path: '/pt/customers', label: 'Khách hàng', section: 'Vận hành', icon: Users, roles: ['PT'], matchChildren: true },
  { path: '/pt/inbody', label: 'InBody OCR', section: 'Vận hành', icon: Ruler, roles: ['PT'], feature: 'OCR_INBODY', matchChildren: true },
  { path: '/pt/roadmaps', label: 'Roadmap', section: 'Vận hành', icon: Map, roles: ['PT'], feature: 'ROADMAP', matchChildren: true },
  { path: '/pt/exercises', label: 'Thư viện bài tập', section: 'Vận hành', icon: Dumbbell, roles: ['PT'], feature: 'EXERCISE_LIBRARY', matchChildren: true },
  { path: '/pt/workout-plans', label: 'Giáo án', section: 'Vận hành', icon: ClipboardList, roles: ['PT'], feature: 'EXERCISE_LIBRARY', matchChildren: true },
  { path: '/pt/progress', label: 'Tiến độ', section: 'Vận hành', icon: ChartNoAxesCombined, roles: ['PT'], feature: 'PROGRESS', matchChildren: true },
  { path: '/pt/nutrition', label: 'Dinh dưỡng', section: 'Vận hành', icon: Salad, roles: ['PT'], feature: 'NUTRITION_AI', matchChildren: true },
  { path: '/pt/care', label: 'Chăm sóc', section: 'Vận hành', icon: HeartPulse, roles: ['PT'], feature: 'CARE', matchChildren: true },
  { path: '/consultation', label: 'Trợ lý dinh dưỡng', section: 'Tri thức & trợ lý', icon: Bot, roles: ['PT'] },
  { path: '/pt/assistant', label: 'PT Assistant', section: 'Tri thức & trợ lý', icon: Bot, roles: ['PT'], feature: 'PT_ASSISTANT', matchChildren: true },
  { path: '/pt/knowledge-search', label: 'Tra cứu tri thức', section: 'Tri thức & trợ lý', icon: Search, roles: ['PT'], feature: 'KNOWLEDGE_BASE', matchChildren: true },
  { path: '/admin/knowledge', label: 'Kho tri thức', section: 'Tri thức & trợ lý', icon: BookOpen, roles: ['ADMIN'], feature: 'KNOWLEDGE_BASE', matchChildren: true },
  { path: '/me', label: 'Hành trình của tôi', section: 'Tài khoản', icon: HeartPulse, roles: ['CUSTOMER'], matchChildren: true },
];

export function visibleNavigation(user: User, features: FeatureState = {}): NavigationItem[] { return portalNavigation.filter((item) => item.roles.includes(user.role) && (!item.feature || features[item.feature] === true)); }
export function itemMatchesPath(item: NavigationItem, pathname: string): boolean { return pathname === item.path || Boolean(item.matchChildren && pathname.startsWith(`${item.path}/`)); }
export function navigationForPath(pathname: string, user: User, features: FeatureState = {}): NavigationItem | undefined { return visibleNavigation(user, features).filter((item) => itemMatchesPath(item, pathname)).sort((a, b) => b.path.length - a.path.length)[0]; }
