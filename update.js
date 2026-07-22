const fs = require('fs');
let code = fs.readFileSync('src/main.js', 'utf8');

const replStr = `const htmlString = this.state.historyDetails.map((d, i) => {
                let ansHtml = '';
                if (d.type === 'Đối chiếu trùng khớp' && d.selected) {
                    const selPairs = d.selected.split(', ');
                    const corPairs = d.correct ? d.correct.split(', ') : [];
                    ansHtml = selPairs.map(sp => {
                        const isPairCorrect = corPairs.includes(sp);
                        return \\\`<span style="color:\\\${isPairCorrect ? '#4ade80' : '#f87171'}">\\\${isPairCorrect ? '✅' : '❌'} \\\${app.data.sanitizeHTML(sp)}</span>\\\`;
                    }).join('<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
                } else {
                    ansHtml = \\\`<span style="color:\\\${d.isCorrect ? '#4ade80' : '#f87171'}">\\\${d.isCorrect ? '✅' : '❌'} \\\${app.data.sanitizeHTML(d.selected || 'Bỏ trống')}</span>\\\`;
                }
                return \\\`
        <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.2);">
          <b>\\\${i + 1}.</b> \\\${app.data.sanitizeHTML(d.q)} <br>
          Bạn chọn: \\\${ansHtml} <br>
          \\\${!d.isCorrect ? \\\`<span style="color:#4ade80">Đáp án: \\\${app.data.sanitizeHTML(d.correct)}</span>\\\` : ''}
        </div>
      \\\`;
            }).join('');`;

let lines = code.split('\n');
let startIdx = lines.findIndex(l => l.includes("const htmlString = this.state.historyDetails.map("));
if (startIdx !== -1) {
    let endIdx = startIdx;
    while (!lines[endIdx].includes(").join('');") && endIdx < startIdx + 20) endIdx++;
    if (lines[endIdx].includes(").join('');")) {
        let prefix = "            ";
        lines.splice(startIdx, endIdx - startIdx + 1, prefix + replStr.split('\n').join('\n' + prefix));
        fs.writeFileSync('src/main.js', lines.join('\n'), 'utf8');
        console.log('Success regex replacement line based');
    }
}
