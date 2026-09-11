function createStudentFixture(overrides = {}) {
  return {
    id: 'demo-student',
    username: 'minh-hoa',
    fullname: 'Học sinh Minh họa',
    role: 'student',
    approved: true,
    classlevel: '5',
    class_name: '5/1',
    gender: 'male',
    avatar_key: 'boy-short',
    totalscore: 1250,
    stars: 7,
    history: [{ title: 'Luyện tập Phân số', topic: 'Phân số', difficulty: 'Vừa', questionCount: 10, score: 9, date: '2026-08-08' }],
    ...overrides
  };
}

function createAdminFixture(overrides = {}) {
  return {
    id: 'demo-admin',
    username: 'demo-admin',
    fullname: 'Giáo viên Demo',
    role: 'admin',
    approved: true,
    classlevel: '5',
    ...overrides
  };
}

function createQuestionFixture(overrides = {}) {
  return {
    id: 'question-1',
    classlevel: 'Lớp 5',
    subject: 'Toán',
    semester: 'Học kỳ 1',
    topic: 'Phân số',
    type: 'Trắc nghiệm',
    q: 'Phân số nào lớn hơn?',
    options: ['1/2', '1/3', '2/3', '3/4'],
    ans: '3/4',
    explanation: 'So sánh hai phân số theo mẫu số chung.',
    ...overrides
  };
}

function createExamFixture(question = createQuestionFixture(), overrides = {}) {
  return {
    id: 'exam-1',
    name: 'Kiểm tra Toán tuần 1',
    classlevel: 'Lớp 5',
    subject: 'Toán',
    period: 'Học Kỳ 1',
    questions: [{ ...question }],
    ...overrides
  };
}

function createQuestFixture(overrides = {}) {
  return {
    id: 'quest-1',
    title: 'Hoàn thành 5 câu Toán',
    target_subject: 'math',
    target_score: 7,
    target_count: 5,
    reward_stars: 2,
    assign_type: 'all',
    assign_target: '',
    target_classlevel: '5',
    start_at: null,
    end_at: null,
    is_active: true,
    curriculum: { classlevel: 'Lớp 5', semester: 'Học kỳ 1', topic: 'Phân số' },
    ...overrides
  };
}

function createTemplateFixture(overrides = {}) {
  return {
    id: 'template-1',
    name: 'Số lớn nhất trong bốn số',
    classlevel: 'Lớp 5',
    subject: 'Toán',
    semester: 'Học kỳ 1',
    topic: 'Phân số',
    question_type: 'Trắc nghiệm',
    generator_key: 'number.largest_of_four',
    prompt_template: 'Chọn số lớn nhất.',
    config: {},
    is_active: true,
    ...overrides
  };
}

function createAuditAdminDataset() {
  const question = createQuestionFixture();
  return {
    currentUser: createAdminFixture(),
    users: [
      createStudentFixture({ id: 'student-1', username: 'minh-hoa', fullname: 'Học sinh Minh họa' }),
      createStudentFixture({
        id: 'student-2', username: 'cho-duyet', fullname: 'Hồ sơ chờ duyệt', classlevel: '4', class_name: '4/2',
        approved: false, gender: 'female', totalscore: 0, stars: 0, history: []
      })
    ],
    libraryQuestions: [question],
    exams: [createExamFixture(question)],
    quests: [createQuestFixture()],
    questionTemplates: [createTemplateFixture()]
  };
}

module.exports = {
  createAdminFixture,
  createAuditAdminDataset,
  createExamFixture,
  createQuestionFixture,
  createQuestFixture,
  createStudentFixture,
  createTemplateFixture
};
