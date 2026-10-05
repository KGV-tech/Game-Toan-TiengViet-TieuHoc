;(function (root) {
    const limit = 512;
    const memory = new Map();
    const empty = () => ({ parts: [], words: [], contexts: [] });
    const ownerKey = owner => `tv4-parameters-v1:${owner?.id || owner?.username || 'guest'}`;
    function load(owner) {
        const key = ownerKey(owner);
        if (memory.has(key)) return structuredClone(memory.get(key));
        try {
            const value = JSON.parse(root.localStorage?.getItem(key) || 'null');
            if (value && ['parts', 'words', 'contexts'].every(field => Array.isArray(value[field]) && value[field].length <= limit && value[field].every(item => typeof item === 'string'))) return value;
        } catch { /* Disabled storage or a damaged history never prevents practice. */ }
        return structuredClone(memory.get(key) || empty());
    }
    const append = (list, values) => { for (const value of values) { const old = list.indexOf(value); if (old >= 0) list.splice(old, 1); list.push(value); } list.splice(0, Math.max(0, list.length - limit)); };
    function record(state, question) {
        for (const part of question.subquestions || []) {
            if (!part.generation || !part.semanticKey) continue;
            append(state.parts, [part.semanticKey]); append(state.words, part.targets); append(state.contexts, [part.evidence.excerpt]);
        }
    }
    function remember(question, owner) {
        if (!question.subquestions?.every(part => part.generation) || root.Grade4VietnameseTemplates.validateQuestion(question)) return;
        const key = ownerKey(owner), state = load(owner); record(state, question); memory.set(key, structuredClone(state));
        try { root.localStorage?.setItem(key, JSON.stringify(state)); } catch { /* Keep the same history in memory for this session. */ }
    }
    function createRound(templates, count, history = empty(), random = Math.random) {
        const state = structuredClone(history), bySkill = new Map();
        for (const template of templates) {
            const previous = bySkill.get(template.generator_key);
            if (!previous || Number(template.lesson.match(/b(\d+)$/)?.[1]) > Number(previous.lesson.match(/b(\d+)$/)?.[1])) bySkill.set(template.generator_key, template);
        }
        const pools = [...bySkill.values()];
        const result = [], chosen = new Set();
        for (let turn = 0; turn < count && pools.length; turn++) {
            let question = null;
            for (let offset = 0; offset < pools.length && !question; offset++) {
                const template = pools[(turn + offset) % pools.length];
                try { question = root.Grade4VietnameseTemplates.generateForHistory(template.generator_key, template.config, state, chosen, random); }
                catch { /* A skill without enough reviewed parameters stays unavailable. */ }
            }
            if (!question) break;
            chosen.add(root.VietnameseParameterEngine.pairKey(question.subquestions)); result.push(question); record(state, question);
        }
        return result;
    }
    root.VietnameseParameterHistory = Object.freeze({ empty, load, record, remember, createRound });
})(typeof globalThis !== 'undefined' ? globalThis : this);
