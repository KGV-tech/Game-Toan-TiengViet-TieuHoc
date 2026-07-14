const fs = require('fs');
let mainJs = fs.readFileSync('d:/NTT/AI/Web/Game lop5/src/main.js', 'utf8');

const target = `      // Drag drop and sequence will be handled similarly to multiple choice for simplicity or expanded later.
      // ... (other types omitted for brevity, will implement fully if needed, but using standard buttons for now to save space, or fallback to MC).`;

const replacement = `      } else if (type === 'drag_drop') {
        const container = document.createElement('div');
        container.className = 'drag-container';
        
        const dropZonesDiv = document.createElement('div');
        dropZonesDiv.style.display = 'flex';
        dropZonesDiv.style.gap = '20px';
        dropZonesDiv.style.justifyContent = 'center';
        
        let ansArr = Array.isArray(q.ans) ? q.ans : [q.ans];
        ansArr.forEach((ans, i) => {
          let dz = document.createElement('div');
          dz.className = 'drop-zone';
          dz.style.flex = '1';
          dz.textContent = 'Kéo thả vào đây';
          dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('active'); };
          dz.ondragleave = () => dz.classList.remove('active');
          dz.ondrop = (e) => {
            e.preventDefault();
            dz.classList.remove('active');
            if (this.state.isChecked) return;
            const data = e.dataTransfer.getData('text/plain');
            dz.textContent = data;
            dz.dataset.val = data;
            this.state.selectedAnswer = { value: 'dropped' }; // just mark as changed
            document.getElementById('game-next-btn').disabled = false;
          };
          dropZonesDiv.appendChild(dz);
        });
        
        const itemsDiv = document.createElement('div');
        itemsDiv.className = 'drag-items';
        q.options.forEach(opt => {
          let item = document.createElement('div');
          item.className = 'drag-item';
          item.textContent = opt;
          item.draggable = true;
          item.ondragstart = (e) => { e.dataTransfer.setData('text/plain', opt); };
          itemsDiv.appendChild(item);
        });
        
        container.appendChild(dropZonesDiv);
        container.appendChild(itemsDiv);
        content.appendChild(container);
`;

const checkTarget = `      if (type === 'fill_blank') {
        const inputs = Array.from(document.querySelectorAll('.fill-input')).map(i => i.value.trim());
        const ansArr = Array.isArray(q.ans) ? q.ans : [q.ans];
        let isCorrect = true;
        inputs.forEach((val, i) => {
          if (val.toLowerCase() !== (ansArr[i] || '').toLowerCase()) isCorrect = false;
        });
        this.state.selectedAnswer = { value: inputs.join(', '), isCorrect };
      }`;

const checkReplacement = `      if (type === 'fill_blank') {
        const inputs = Array.from(document.querySelectorAll('.fill-input')).map(i => i.value.trim());
        const ansArr = Array.isArray(q.ans) ? q.ans : [q.ans];
        let isCorrect = true;
        inputs.forEach((val, i) => {
          if (val.toLowerCase() !== (ansArr[i] || '').toLowerCase()) { isCorrect = false; document.querySelectorAll('.fill-input')[i].classList.add('wrong'); }
          else { document.querySelectorAll('.fill-input')[i].classList.add('correct'); }
        });
        this.state.selectedAnswer = { value: inputs.join(', '), isCorrect };
      } else if (type === 'drag_drop') {
        const zones = Array.from(document.querySelectorAll('.drop-zone')).map(z => z.dataset.val || '');
        const ansArr = Array.isArray(q.ans) ? q.ans : [q.ans];
        let isCorrect = true;
        zones.forEach((val, i) => {
          if (val !== ansArr[i]) { isCorrect = false; document.querySelectorAll('.drop-zone')[i].classList.add('wrong'); }
          else { document.querySelectorAll('.drop-zone')[i].classList.add('correct'); }
        });
        this.state.selectedAnswer = { value: zones.join(', '), isCorrect };
      }`;

mainJs = mainJs.replace(target, replacement);
mainJs = mainJs.replace(checkTarget, checkReplacement);

fs.writeFileSync('d:/NTT/AI/Web/Game lop5/src/main.js', mainJs, 'utf8');
console.log("Drag-Drop appended!");
