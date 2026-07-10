/** XP awarded per action (Phase 4 spec). */
export const XP_REWARDS = {
  VIDEO_WATCHED: 10,
  NOTES_READ: 5,
  QUIZ_PASSED: 20,
  LIVE_CLASS_ATTENDED: 25,
  QUIZ_BATTLE_WON: 50,
  QUIZ_BATTLE_PARTICIPATED: 15,
} as const;

/** Rank tiers derived from total XP. */
export const LEVEL_TIERS = [
  { name: 'Recruit', min: 0, icon: 'shield' },
  { name: 'Cadet', min: 100, icon: 'shield-check' },
  { name: 'Senior Cadet', min: 250, icon: 'chevrons-up' },
  { name: 'Corporal', min: 500, icon: 'chevron-up' },
  { name: 'Sergeant', min: 800, icon: 'award' },
  { name: 'Lieutenant', min: 1200, icon: 'star' },
  { name: 'Captain', min: 1700, icon: 'medal' },
  { name: 'Major', min: 2300, icon: 'gem' },
  { name: 'Colonel', min: 3000, icon: 'crown' },
  { name: 'Commander', min: 4000, icon: 'swords' },
] as const;

/** Achievement definitions seeded into the DB. */
export const ACHIEVEMENT_DEFS = [
  { code: 'FIRST_MISSION', title: 'First Mission Completed', description: 'Complete your first training operation.', icon: 'flag' },
  { code: 'STREAK_7', title: '7-Day Streak', description: 'Study for 7 consecutive days.', icon: 'flame' },
  { code: 'QUIZ_MASTER', title: 'Quiz Master', description: 'Pass 10 module assessments.', icon: 'brain' },
  { code: 'PERFECT_ATTENDANCE', title: 'Perfect Attendance', description: 'Attend 5 live classes.', icon: 'video' },
  { code: 'CONSTITUTION_EXPERT', title: 'Constitution Expert', description: 'Complete a Constitution or Polity operation.', icon: 'book-open' },
  { code: 'MATHS_WARRIOR', title: 'Maths Warrior', description: 'Complete a Mathematics operation.', icon: 'calculator' },
  { code: 'DEFENCE_SCHOLAR', title: 'Defence Scholar', description: 'Complete 10 training operations.', icon: 'graduation-cap' },
] as const;
