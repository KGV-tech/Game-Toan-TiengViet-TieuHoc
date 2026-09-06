const assert = require('node:assert/strict');

global.window = global;
global.app = {};

const team = require('./src/modules/team-competition.js');

const students = Array.from({ length: 31 }, (_, index) => ({
  username: `hs${index + 1}`,
  fullname: `Học sinh ${index + 1}`,
  classlevel: '5',
  role: 'student',
  approved: true
}));
const questions = Array.from({ length: 10 }, (_, index) => ({
  q: `Câu ${index + 1}`,
  type: 'Trắc nghiệm',
  options: ['A', 'B'],
  ans: 'A'
}));
const exams = [
  { id: 'exam-common', name: 'Đề chung', classlevel: '5', subject: 'Toán', period: 'Học kỳ 1', questions },
  { id: 'exam-other', name: 'Đề riêng', classlevel: '5', subject: 'Toán', period: 'Học kỳ 1', questions: questions.map((q, i) => ({ ...q, q: `Đề riêng ${i + 1}` })) }
];

const randomTeams = team.distributeStudents(students, 4, { rng: () => 0.5 });
assert.equal(randomTeams.length, 4);
assert.deepEqual(randomTeams.map(group => group.length), [8, 8, 8, 7]);
assert.equal(new Set(randomTeams.flat().map(student => student.username)).size, 31);

const quotaTeams = team.distributeStudents(students.slice(0, 10), 3, { quotas: [2, 5, 3], rng: () => 0.2 });
assert.deepEqual(quotaTeams.map(group => group.length), [2, 5, 3]);
const targetTeams = team.buildTeams({ students: students.slice(0, 5), teamCount: 2, participantMode: 'random', quotas: [3, 2], rng: () => 0.4 });
assert.deepEqual(targetTeams.map(group => group.memberUsernames.length), [3, 2]);
assert.deepEqual(targetTeams.map(group => group.targetMemberCount), [3, 2]);

const validConfig = {
  name: 'Trận khởi động',
  classlevel: '5',
  participantMode: 'manual',
  questionMode: 'same',
  commonExamId: 'exam-common',
  timeLimitMinutes: 15,
  teams: [
    { id: 'team-1', name: 'Mặt Trời', memberUsernames: ['hs1', 'hs2'], leaderUsername: 'hs1' },
    { id: 'team-2', name: 'Mặt Trăng', memberUsernames: ['hs3'], leaderUsername: 'hs3' }
  ]
};
assert.deepEqual(team.validateConfig(validConfig, { students, exams }), { valid: true, errors: [] });
const targetMismatch = team.validateConfig({ ...validConfig, teams: validConfig.teams.map(item => ({ ...item, targetMemberCount: item.id === 'team-1' ? 3 : 1 })) }, { students, exams });
assert.ok(targetMismatch.errors.some(error => error.code === 'target_member_count_mismatch'));

const invalidLeader = team.validateConfig({
  ...validConfig,
  teams: validConfig.teams.map((item, index) => index === 0 ? { ...item, leaderUsername: 'hs3' } : item)
}, { students, exams });
assert.equal(invalidLeader.valid, false);
assert.ok(invalidLeader.errors.some(error => error.code === 'leader_not_member'));

const duplicateStudent = team.validateConfig({
  ...validConfig,
  teams: [{ ...validConfig.teams[0], memberUsernames: ['hs1', 'hs2'] }, { ...validConfig.teams[1], memberUsernames: ['hs2'], leaderUsername: 'hs2' }]
}, { students, exams });
assert.ok(duplicateStudent.errors.some(error => error.code === 'duplicate_student'));

const mismatchedExamCounts = team.validateConfig({
  ...validConfig,
  questionMode: 'different',
  teams: validConfig.teams.map((item, index) => ({ ...item, examId: index === 0 ? 'exam-common' : 'exam-other' }))
}, { students, exams: [...exams, { ...exams[1], id: 'exam-short', questions: questions.slice(0, 9) }] });
assert.equal(mismatchedExamCounts.valid, true);
const invalidDifferentCounts = team.validateConfig({
  ...validConfig,
  questionMode: 'different',
  teams: [{ ...validConfig.teams[0], examId: 'exam-common' }, { ...validConfig.teams[1], examId: 'exam-short' }]
}, { students, exams: [...exams, { id: 'exam-short', questions: questions.slice(0, 9) }] });
assert.ok(invalidDifferentCounts.errors.some(error => error.code === 'question_count_mismatch'));
const invalidScoring = team.validateConfig(validConfig, { students, exams, validateQuestionScoring: () => 'invalid' });
assert.ok(invalidScoring.errors.some(error => error.code === 'question_scoring_invalid'));

assert.equal(team.calculateTeamScore([{ points: 1 }, { points: 0.5 }, { points: 0 }], 3), 5);
assert.deepEqual(team.assignTeamScoreToMembers({ id: 'team-1', memberUsernames: ['hs1', 'hs2'] }, 8.25), [
  { teamId: 'team-1', username: 'hs1', individualScore: 8.25 },
  { teamId: 'team-1', username: 'hs2', individualScore: 8.25 }
]);
assert.equal(team.getTeamRank({ teams: [{ id: 'a', score: 8 }, { id: 'b', score: 8 }, { id: 'c', score: 5 }] }, 'c'), 3);
assert.equal(team.getTeamRank({ teams: [{ id: 'a', score: 8 }, { id: 'b', score: 8 }, { id: 'c', score: 5 }] }, 'b'), 1);

const draft = team.normalizeCompetition({ ...validConfig, id: 'match-1' });
assert.equal(draft.status, team.STATUS.DRAFT);
assert.equal(team.transitionStatus(draft, team.STATUS.PREPARED).status, team.STATUS.PREPARED);
assert.throws(() => team.transitionStatus(draft, team.STATUS.ACTIVE), /Invalid team competition transition/);
const prepared = team.transitionStatus(draft, team.STATUS.PREPARED);
const active = team.transitionStatus(prepared, team.STATUS.ACTIVE, 1700000000000);
assert.equal(active.startedAt, 1700000000000);
assert.equal(team.transitionStatus(active, team.STATUS.ENDED, 1700000060000).endedAt, 1700000060000);

assert.equal(team.lockAttempt({ status: 'active' }, 'leader_exit', 1700000000000).status, 'locked');
assert.throws(() => team.resumeAttempt({ status: 'locked' }), /locked/);
assert.equal(team.shouldInvalidateAttemptOnReentry({ status: 'active' }, 'reload', true), true);
assert.equal(team.shouldInvalidateAttemptOnReentry({ status: 'active' }, 'navigate', false), true);
assert.equal(team.shouldInvalidateAttemptOnReentry({ status: 'active' }, 'navigate', true), false);

console.log('team competition contract tests passed');
