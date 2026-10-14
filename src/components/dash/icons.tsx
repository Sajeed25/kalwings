import { AlertTriangle, BadgeCheck, BarChart3, Bookmark, Briefcase, Building2, CalendarCheck, ClipboardList, CreditCard, FileText, Flag, GraduationCap, Inbox, KanbanSquare, MessagesSquare, ScrollText, Search, ShieldCheck, Sparkles, Trophy, UserRound, Users } from "lucide-react";
import type { IconKey } from "@/lib/modules";

const MAP: Record<IconKey, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  briefcase: Briefcase, trophy: Trophy, school: GraduationCap, bookmark: Bookmark, clipboard: ClipboardList, user: UserRound, sparkles: Sparkles, users: Users, chat: MessagesSquare,
  building: Building2, search: Search, chart: BarChart3, board: KanbanSquare, calendar: CalendarCheck, shield: ShieldCheck, badge: BadgeCheck, card: CreditCard, flag: Flag, inbox: Inbox, log: ScrollText, alert: AlertTriangle, file: FileText,
};
export function ModuleIcon({ name, className }: { name: IconKey; className?: string }) {
  const I = MAP[name];
  return <I className={className} aria-hidden />;
}
