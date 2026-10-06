;(function (root) {
    const sources = Object.freeze({
        'sgk-tv4-kntt-t1': Object.freeze({
            title: 'Tiếng Việt 4 tập một · Kết nối tri thức với cuộc sống',
            publisher: 'Nhà xuất bản Giáo dục Việt Nam',
            file: 'Tiếng Việt 4 tập một.pdf',
            sha256: 'feb7517458e487865c262da2ab1b58e82306a2d2d8a3771b9302c8a729e3df71',
            pageCount: 150, pdfPageOffset: 1,
            url: 'https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/tieng-viet-4-tap-mot-939811319.939811319'
        })
    });
    // Exact reviewed wording, not a heuristic classifier or a dictionary oracle.
    // Choice order and a/b labels may change; no other linguistic change is allowed.
    const snapshot = entry => JSON.stringify({
        id: entry.id, prompt: entry.prompt, passage: entry.passage || '',
        answer: entry.answer, options: [...(entry.options || [])].sort(),
        explanation: entry.explanation, introducedAt: entry.introducedAt,
        evidence: entry.evidence
    });
    function check(entry, lessonNumber) {
        if (!entry || !Number.isInteger(lessonNumber) || lessonNumber < 1 || lessonNumber > 32) return 'Ngoài phạm vi học kì I.';
        const review = root.VietnameseReviewedContent?.[entry.id];
        if (!review || review.status !== 'source-reviewed' || !['curriculum', 'wording', 'context', 'options'].every(scope => review.scopes?.includes(scope))) return 'Nội dung chưa được đối chiếu đủ phạm vi.';
        if (!Array.isArray(entry.options) || !entry.options.every(value => typeof value === 'string')) return 'Lựa chọn không hợp lệ.';
        if (review.snapshot !== snapshot(entry)) return 'Nội dung đã thay đổi; cần kiểm chứng lại từng lựa chọn và ngữ cảnh.';
        if (!sources[entry.evidence?.source] || !entry.evidence.pages?.length) return 'Thiếu nguồn chính thống hoặc trang đối chiếu.';
        const evidence = entry.evidence;
        if (!['textbook-context', 'textbook-glossary'].includes(evidence.kind) || typeof evidence.excerpt !== 'string' || evidence.excerpt.length < 10) return 'Thiếu dẫn chứng từ ngữ trong ngữ cảnh; dẫn quy tắc chưa đủ.';
        if (evidence.pages.some(page => !Number.isInteger(page) || page < 1 || page + sources[evidence.source].pdfPageOffset > sources[evidence.source].pageCount)) return 'Trang nguồn không hợp lệ.';
        if (!Number.isInteger(entry.introducedAt) || entry.introducedAt > lessonNumber) return 'Kiến thức chưa thuộc tiến độ bài học.';
        if (!entry.prompt || !entry.explanation || !entry.answer || !Array.isArray(entry.options)) return 'Thiếu nội dung kiểm chứng.';
        if (new Set(entry.options).size !== entry.options.length || entry.options.filter(value => value === entry.answer).length !== 1) return 'Lựa chọn không có đáp án duy nhất.';
        if (entry.options.some(value => typeof evidence.optionReasons?.[value] !== 'string' || evidence.optionReasons[value].length < 10)) return 'Thiếu lý do kiểm chứng từng lựa chọn.';
        return '';
    }
    root.VietnameseContentVerification = Object.freeze({ sources, snapshot, check });
})(typeof globalThis !== 'undefined' ? globalThis : this);
