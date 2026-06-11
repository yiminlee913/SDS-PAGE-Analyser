document.addEventListener('DOMContentLoaded', () => {
    // Tabs Logic
    const tabBtns = document.querySelectorAll('.tab-btn:not(.sub-tab-btn)');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    // Sub Tabs Logic
    const subTabBtns = document.querySelectorAll('.sub-tab-btn');
    const subTabContents = document.querySelectorAll('.sub-tab-content');

    subTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            subTabBtns.forEach(b => b.classList.remove('active'));
            subTabContents.forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });
            btn.classList.add('active');
            const target = document.getElementById(btn.dataset.target);
            target.classList.add('active');
            target.style.display = 'flex';
        });
    });

    // Canvas Logic Encapsulation
    class PageCanvas {
        constructor(idStr) {
            this.idStr = idStr;
            this.canvas = document.getElementById(`image-canvas-${idStr}`);
            this.ctx = this.canvas.getContext('2d');
            this.uploadInput = document.getElementById(`image-upload-${idStr}`);
            this.clearBtn = document.getElementById(`clear-lanes-btn-${idStr}`);
            this.listContainer = document.getElementById(`lanes-container-${idStr}`);
            
            this.originalImage = null;
            this.imgFile = null;
            this.scaleFactor = 1.0;
            this.lanes = [];
            
            this.isDrawing = false;
            this.startX = 0; this.startY = 0;
            this.currX = 0; this.currY = 0;
            
            this.initEvents();
        }

        initEvents() {
            this.uploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                this.imgFile = file;
                const url = URL.createObjectURL(file);
                this.originalImage = new Image();
                this.originalImage.onload = () => {
                    this.lanes = [];
                    this.resizeCanvas();
                };
                this.originalImage.src = url;
            });

            window.addEventListener('resize', () => this.resizeCanvas());

            this.canvas.addEventListener('mousedown', (e) => {
                if (!this.originalImage) return;
                const rect = this.canvas.getBoundingClientRect();
                this.startX = e.clientX - rect.left;
                this.startY = e.clientY - rect.top;
                this.isDrawing = true;
            });

            this.canvas.addEventListener('mousemove', (e) => {
                if (!this.isDrawing) return;
                const rect = this.canvas.getBoundingClientRect();
                this.currX = e.clientX - rect.left;
                this.currY = e.clientY - rect.top;
                this.redraw();
            });

            this.canvas.addEventListener('mouseup', (e) => {
                if (!this.isDrawing) return;
                this.isDrawing = false;
                
                const rect = this.canvas.getBoundingClientRect();
                this.currX = e.clientX - rect.left;
                this.currY = e.clientY - rect.top;
                
                if (Math.abs(this.currX - this.startX) < 5 || Math.abs(this.currY - this.startY) < 5) {
                    this.redraw();
                    return;
                }

                // 不再彈出對話框，自動建立一個空的 Lane，讓使用者在右側面板輸入
                let defaultName = "";
                if (this.lanes.length === 0) {
                    defaultName = "M"; // 預設第一個是 Marker
                }
                
                this.lanes.push({
                    id: Date.now() + Math.random(),
                    x1: Math.min(this.startX, this.currX),
                    y1: Math.min(this.startY, this.currY),
                    x2: Math.max(this.startX, this.currX),
                    y2: Math.max(this.startY, this.currY),
                    name: defaultName
                });
                
                this.redraw();
                this.renderList();
            });

            this.clearBtn.addEventListener('click', () => {
                this.lanes = [];
                this.redraw();
                this.renderList();
            });
        }

        renderList() {
            if (!this.listContainer) return;
            this.listContainer.innerHTML = '';
            this.lanes.forEach((lane, index) => {
                const item = document.createElement('div');
                item.className = 'lane-item';
                
                const span = document.createElement('span');
                span.textContent = `${index + 1}:`;
                span.style.fontWeight = 'bold';
                
                const input = document.createElement('input');
                input.type = 'text';
                input.value = lane.name;
                input.addEventListener('input', (e) => {
                    lane.name = e.target.value;
                    this.redraw();
                });
                
                const delBtn = document.createElement('button');
                delBtn.className = 'danger-btn';
                delBtn.textContent = '刪除';
                delBtn.addEventListener('click', () => {
                    this.lanes = this.lanes.filter(l => l.id !== lane.id);
                    this.redraw();
                    this.renderList();
                });
                
                item.appendChild(span);
                item.appendChild(input);
                item.appendChild(delBtn);
                this.listContainer.appendChild(item);
            });
        }

        resizeCanvas() {
            if (!this.originalImage) return;
            const container = this.canvas.parentElement;
            const maxWidth = container.clientWidth - 40;
            const maxHeight = container.clientHeight - 40;
            
            const imgRatio = this.originalImage.width / this.originalImage.height;
            const contRatio = maxWidth / maxHeight;
            
            let newWidth, newHeight;
            if (imgRatio > contRatio) {
                newWidth = maxWidth;
                newHeight = maxWidth / imgRatio;
            } else {
                newHeight = maxHeight;
                newWidth = maxHeight * imgRatio;
            }
            
            this.scaleFactor = newWidth / this.originalImage.width;
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
            this.redraw();
        }

        redraw() {
            if (!this.originalImage) return;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.originalImage, 0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = '#ef4444';
            this.ctx.fillStyle = '#ef4444';
            this.ctx.font = '16px Inter bold';
            
            this.lanes.forEach(lane => {
                const w = lane.x2 - lane.x1;
                const h = lane.y2 - lane.y1;
                this.ctx.strokeRect(lane.x1, lane.y1, w, h);
                this.ctx.fillText(lane.name, lane.x1, lane.y1 - 5);
            });

            if (this.isDrawing) {
                this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
                const w = this.currX - this.startX;
                const h = this.currY - this.startY;
                this.ctx.strokeRect(this.startX, this.startY, w, h);
            }
        }
    }

    const purifyCanvas = new PageCanvas('1');
    const dialysisCanvas = new PageCanvas('2');

    // Yield Table Logic
    const yieldTbody = document.getElementById('yield-tbody');
    const addRowBtn = document.getElementById('add-row-btn');
    const volInput = document.getElementById('cond-vol-l');

    function calculateRow(tr) {
        const conc = parseFloat(tr.querySelector('.y-conc').value);
        const vol = parseFloat(tr.querySelector('.y-vol').value);
        const totalSpan = tr.querySelector('.y-total');
        const yieldSpan = tr.querySelector('.y-yield');
        
        let total = NaN;
        if (!isNaN(conc) && !isNaN(vol)) {
            total = conc * vol;
            totalSpan.textContent = total.toFixed(3);
        } else {
            totalSpan.textContent = '-';
        }
        
        const purifyVol = parseFloat(volInput.value);
        if (!isNaN(total) && !isNaN(purifyVol) && purifyVol > 0) {
            const yieldVal = total / purifyVol;
            yieldSpan.textContent = yieldVal.toFixed(2);
        } else {
            yieldSpan.textContent = '-';
        }
    }

    if (volInput) {
        volInput.addEventListener('input', () => {
            document.querySelectorAll('#yield-tbody tr').forEach(calculateRow);
        });
    }

    function createRow() {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" class="y-name" placeholder="Name"></td>
            <td><input type="number" step="0.01" class="y-conc" placeholder="mg/mL"></td>
            <td><input type="number" step="0.01" class="y-vol" placeholder="mL"></td>
            <td class="y-total">-</td>
            <td class="y-yield">-</td>
            <td><button class="danger-btn del-row">刪除</button></td>
        `;
        tr.querySelector('.y-conc').addEventListener('input', () => calculateRow(tr));
        tr.querySelector('.y-vol').addEventListener('input', () => calculateRow(tr));
        tr.querySelector('.del-row').addEventListener('click', () => tr.remove());
        return tr;
    }

    yieldTbody.appendChild(createRow());
    addRowBtn.addEventListener('click', () => {
        yieldTbody.appendChild(createRow());
    });

    // Generate PPT
    const generateBtn = document.getElementById('generate-btn');
    const loading = document.getElementById('loading-indicator');

    generateBtn.addEventListener('click', async () => {
        if (!purifyCanvas.imgFile) {
            alert("請至少載入「純化 PAGE」的圖片！");
            return;
        }
        if (purifyCanvas.lanes.length === 0) {
            alert("請在「純化 PAGE」中至少框選一個 Lane！");
            return;
        }

        const conds = {
            protein: document.getElementById('cond-protein').value,
            plasmid: document.getElementById('cond-plasmid').value,
            ecoli: document.getElementById('cond-ecoli').value,
            hek: document.getElementById('cond-hek293').value,
            cho: document.getElementById('cond-cho').value,
            vol_l: document.getElementById('cond-vol-l').value,
            binding_type: document.getElementById('cond-binding-type').value,
            binding_detail: document.getElementById('cond-binding-detail').value,
            wash: document.getElementById('cond-wash').value,
            elute: document.getElementById('cond-elute').value,
            dialysis: document.getElementById('cond-dialysis').value
        };

        const yields = [];
        document.querySelectorAll('#yield-tbody tr').forEach(tr => {
            yields.push({
                name: tr.querySelector('.y-name').value,
                conc: tr.querySelector('.y-conc').value,
                vol: tr.querySelector('.y-vol').value
            });
        });

        const formData = new FormData();
        
        // Purify payload
        formData.append('image_1', purifyCanvas.imgFile);
        formData.append('lanes_1', JSON.stringify(purifyCanvas.lanes));
        formData.append('marker_name_1', document.getElementById('marker-select-1').value);
        formData.append('ignore_top_n_1', document.getElementById('ignore-top-1').value);
        formData.append('scale_factor_1', purifyCanvas.scaleFactor);

        // Dialysis payload (optional)
        if (dialysisCanvas.imgFile && dialysisCanvas.lanes.length > 0) {
            formData.append('image_2', dialysisCanvas.imgFile);
            formData.append('lanes_2', JSON.stringify(dialysisCanvas.lanes));
            formData.append('marker_name_2', document.getElementById('marker-select-2').value);
            formData.append('ignore_top_n_2', document.getElementById('ignore-top-2').value);
            formData.append('scale_factor_2', dialysisCanvas.scaleFactor);
        }

        formData.append('conditions', JSON.stringify(conds));
        formData.append('yields', JSON.stringify(yields));

        generateBtn.disabled = true;
        loading.classList.remove('hidden');

        try {
            const res = await fetch('/generate_ppt', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error("Server error");
            
            const blob = await res.blob();
            if (blob.type === "application/json") {
                const text = await blob.text();
                const err = JSON.parse(text);
                alert("錯誤: " + err.error);
            } else {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `蛋白純化報告_${conds.protein || '未命名'}.pptx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (e) {
            alert("產出失敗: " + e.message);
        } finally {
            generateBtn.disabled = false;
            loading.classList.add('hidden');
        }
    });
});
