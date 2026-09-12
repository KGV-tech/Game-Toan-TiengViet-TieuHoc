/*
 * Presentation-only template content.  This deliberately lives outside the
 * generator config: a teacher can change the wording without changing the
 * mathematics, answers, or Supabase schema.
 */
(function (root) {
    const escapeHtml = value => String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    const defaultPresentation = generator => generator === 'number.compose_from_places'
        ? {
            version: 1,
            common: 'Hãy viết số vào ô trống, biết số đó gồm:',
            parts: [
                { type: 'variable', key: 'place_values' },
                { type: 'text', value: '. Số đó là: ' },
                { type: 'cell', key: 'answer' }
            ]
        }
        : { version: 1, common: '', parts: [{ type: 'variable', key: 'generated' }] };

    const normalize = (value, generator) => {
        const fallback = defaultPresentation(generator);
        const source = value && typeof value === 'object' ? value : fallback;
        const parts = Array.isArray(source.parts) && source.parts.length
            ? source.parts.map(block => ({
                type: ['text', 'variable', 'cell'].includes(block?.type) ? block.type : 'text',
                key: String(block?.key || (block?.type === 'variable' ? 'generated' : 'answer')),
                value: String(block?.value || '')
            }))
            : fallback.parts;
        return { version: 1, common: String(source.common || ''), parts };
    };

    const renderParts = (parts, variables) => parts.map(block => {
        if (block.type === 'text') return escapeHtml(block.value);
        if (block.type === 'cell') return '___';
        return escapeHtml(variables[block.key] || '');
    }).join('');

    const apply = (generated, generator, presentation) => {
        const normalized = normalize(presentation, generator);
        if (generator !== 'number.compose_from_places') {
            const common = escapeHtml(normalized.common).replace(/\r?\n/g, '<br>');
            const content = normalized.parts.map(block => {
                if (block.type === 'text') return escapeHtml(block.value);
                if (block.type === 'cell') return '___';
                return block.key === 'generated' ? String(generated.q || '') : '';
            }).join('');
            const q = [common, content].filter(Boolean).join('<br>');
            return {
                ...generated,
                q: q || generated.q,
                templateVariables: { ...(generated.templateVariables || {}), question: q || generated.q }
            };
        }
        const rows = Array.isArray(generated.subquestions) ? generated.subquestions : [];
        if (rows.length !== 4) return generated;
        const common = escapeHtml(normalized.common).replace(/\r?\n/g, '<br>');
        const presentedRows = rows.map(item => ({
            ...item,
            display: renderParts(normalized.parts, {
                place_values: item.description,
                generated: item.description
            })
        }));
        const renderedRows = presentedRows.map(item => `${escapeHtml(item.label)}) ${item.display}`);
        const q = [common, ...renderedRows].filter(Boolean).join('<br>');
        return {
            ...generated,
            q,
            subquestions: presentedRows,
            templateVariables: { ...(generated.templateVariables || {}), question: q }
        };
    };

    root.TemplateContentBuilder = { defaultPresentation, normalize, apply };
}(typeof globalThis !== 'undefined' ? globalThis : this));
