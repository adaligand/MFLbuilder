/* =========================
   PREVIEW & OPTIONS MENU
========================= */
const MULTI_GAP_ACTIVITY_IDS = ['listen-trad', 'listen-dictation', 'delayed-dictation', 'delayed-copying'];
const BEAT_ROBOT_ACTIVITY_ID = 'beat-robot';
const ROBOT_SPEED_ACTIVITY_ID = BEAT_ROBOT_ACTIVITY_ID;

function getBeatRobotModeOptionsHTML(selectedMode = 'vowels') {
    const normalized = ['vowels', 'consonants'].includes(String(selectedMode).toLowerCase())
        ? String(selectedMode).toLowerCase()
        : 'vowels';
    const options = [
        { val: 'vowels', label: 'Vowels' },
        { val: 'consonants', label: 'Consonants' }
    ];
    return options
        .map(o => `<option value="${o.val}" ${o.val === normalized ? 'selected' : ''}>${o.label}</option>`)
        .join('');
}

function getRobotSpeedOptionsHTML(selectedMode = 'vowels') {
    return getBeatRobotModeOptionsHTML(selectedMode);
}

function onBeatRobotModeChange(selectEl) {
    const chk = document.getElementById('chk-beat-robot');
    if (chk && !chk.checked) {
        chk.checked = true;
        renderPerActivitySentenceBoxes();
        return;
    }
    const label = selectEl?.options?.[selectEl.selectedIndex]?.text || 'Vowels';
    const badge = document.getElementById('beat-robot-card-mode-badge');
    if (badge) {
        badge.innerText = `(${label} removed)`;
    }
    updateAssignmentTimeEstimate();
}

function onRobotSpeedChange(selectEl) {
    onBeatRobotModeChange(selectEl);
}

const AUDIO_ACTIVITY_IDS = [
    'listen-trad',
    'listen-dictation',
    'delayed-dictation',
    'listen-missing',
    'listen-faulty',
    'listen-jumbled'
];

function getActivityGapOptionsHTML(selectedLevel = '1') {
    const normalized = ['1', '25', '50', '75', '100'].includes(String(selectedLevel))
        ? String(selectedLevel)
        : '1';
    const options = [
        { val: '1', label: '1 word' },
        { val: '25', label: '25% of words' },
        { val: '50', label: '50% of words' },
        { val: '75', label: '75% of words' },
        { val: '100', label: '100% of words' }
    ];
    return options
        .map(o => `<option value="${o.val}" ${o.val === normalized ? 'selected' : ''}>${o.label}</option>`)
        .join('');
}

function getDelayedCopyingGapOptionsHTML(selectedLevel = '1') {
    return getActivityGapOptionsHTML(selectedLevel);
}

function onActivityGapLevelChange(arg1, arg2) {
    const actId = (typeof arg1 === 'string') ? arg1 : arg2;
    const selectEl = (typeof arg1 === 'string') ? arg2 : arg1;

    const chk = document.getElementById(`chk-${actId}`);
    if (chk && !chk.checked) {
        chk.checked = true;
        renderPerActivitySentenceBoxes();
        return;
    }
    const label = selectEl?.options?.[selectEl.selectedIndex]?.text || '1 word';
    const badge = document.getElementById(`${actId}-card-gap-badge`);
    if (badge) {
        badge.innerText = `(${label} removed)`;
    }
    if (actId === 'delayed-copying') {
        const legacyBadge = document.getElementById('dc-card-gap-badge');
        if (legacyBadge) {
            legacyBadge.innerText = `(${label} removed)`;
        }
    }
    updateAssignmentTimeEstimate();
}

function onDelayedCopyingGapLevelChange(selectEl) {
    onActivityGapLevelChange('delayed-copying', selectEl);
}

function resolveActivityGapLevelFromArg(actId, gapLevelsOrSingle = '1') {
    if (gapLevelsOrSingle && typeof gapLevelsOrSingle === 'object') {
        return String(gapLevelsOrSingle[actId] || '1');
    }
    return actId === 'delayed-copying' ? String(gapLevelsOrSingle || '1') : '1';
}

function buildActivitySelectorRowHTML(a, gapLevelsOrSingle = '1', extraRowStyle = 'flex: 0 0 auto !important; height: auto !important; min-height: 0 !important; padding: 6px 6px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 6px;') {
    const isMultiGap = MULTI_GAP_ACTIVITY_IDS.includes(a.id);
    const isBeatRobot = (a.id === BEAT_ROBOT_ACTIVITY_ID);
    const selectedLevel = resolveActivityGapLevelFromArg(a.id, gapLevelsOrSingle);
    const selectedRobotMode = (gapLevelsOrSingle && typeof gapLevelsOrSingle === 'object' && gapLevelsOrSingle['beat-robot'])
        ? String(gapLevelsOrSingle['beat-robot'])
        : 'vowels';

    let dropdownHTML = '';
    if (isMultiGap) {
        dropdownHTML = `<select id="${a.id}-gap-select"
                onclick="event.stopPropagation()"
                onchange="event.stopPropagation(); onActivityGapLevelChange('${a.id}', this)"
                title="Choose how many words are removed in ${a.label}"
                style="margin-left:auto; flex-shrink:0; max-width:112px; padding:2px 5px; border-radius:6px; border:1px solid #cbd5e1; font-size:11px; font-weight:600; color:#1e293b; background:#fff; cursor:pointer; pointer-events:auto !important;">
                ${getActivityGapOptionsHTML(selectedLevel)}
           </select>`;
    } else if (isBeatRobot) {
        dropdownHTML = `<select id="beat-robot-mode-select"
                onclick="event.stopPropagation()"
                onchange="event.stopPropagation(); onBeatRobotModeChange(this)"
                title="Choose whether vowels or consonants are removed in ${a.label}"
                style="margin-left:auto; flex-shrink:0; max-width:112px; padding:2px 5px; border-radius:6px; border:1px solid #cbd5e1; font-size:11px; font-weight:600; color:#1e293b; background:#fff; cursor:pointer; pointer-events:auto !important;">
                ${getBeatRobotModeOptionsHTML(selectedRobotMode)}
           </select>`;
    }

    return `
        <div class="activity-row" onclick="if(event.target === this){ const cb = this.querySelector('input[type=checkbox]'); if(cb){ cb.checked = !cb.checked; renderPerActivitySentenceBoxes(); } }" style="${extraRowStyle} cursor:pointer; pointer-events:auto !important;">
            <input type="checkbox" value="${a.id}" id="chk-${a.id}" style="width:16px !important; height:16px !important; min-width:16px !important; margin:0 !important; flex-shrink:0 !important; cursor:pointer !important; pointer-events:auto !important; position:relative !important; z-index:2 !important; accent-color:#2563eb;" onchange="renderPerActivitySentenceBoxes()">
            <label for="chk-${a.id}" style="cursor:pointer !important; pointer-events:auto !important; font-weight:500; font-size: 13px; line-height: 1.25; white-space: nowrap; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; margin:0;">${a.label}</label>
            ${dropdownHTML}
        </div>
    `;
}

function buildActivityCategoryGroupHTML(category, title, icon, innerRowsHTML, isOpen = false) {
    return `
        <div class="activity-category-group" data-category="${category}" style="display: block !important; flex: 0 0 auto !important; height: auto !important; min-height: 0 !important; max-height: none !important; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #ffffff; margin: 0 !important;">
            <button type="button"
                id="btn-toggle-${category}-activities"
                onclick="toggleActivityCategory('${category}')"
                style="flex: 0 0 auto !important; width: 100% !important; height: auto !important; min-height: 0 !important; display: flex !important; align-items: center; justify-content: space-between; padding: 9px 10px !important; margin: 0 !important; background: #f1f5f9 !important; border: none !important; border-bottom: ${isOpen ? '1px solid #e2e8f0' : 'none'} !important; border-radius: 0 !important; cursor: pointer; font-weight: 700; font-size: 13px; color: #1e293b !important; text-align: left; box-shadow: none !important;">
                <span style="display: flex; align-items: center; gap: 6px;">
                    <span>${icon}</span>
                    <span>${title}</span>
                </span>
                <span style="display: flex; align-items: center; gap: 6px;">
                    <span id="badge-count-${category}" style="display: none; background: #2563eb; color: #ffffff; font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 999px;">0</span>
                    <span id="chevron-${category}" style="font-size: 11px; color: #475569;">${isOpen ? '▼' : '▶'}</span>
                </span>
            </button>
            <div id="group-${category}-activities" ${isOpen ? '' : 'hidden'} style="flex: 0 0 auto !important; height: ${isOpen ? 'auto' : '0px'} !important; min-height: 0 !important; padding: ${isOpen ? '4px 6px' : '0px'} !important; display: ${isOpen ? 'flex' : 'none'} !important; flex-direction: column; gap: 2px;">
                ${innerRowsHTML}
            </div>
        </div>
    `;
}

function applyActivityListLayoutOverrides() {
    const container = document.getElementById('activity-list');
    if (!container) return;

    container.style.setProperty('display', 'flex', 'important');
    container.style.setProperty('flex-direction', 'column', 'important');
    container.style.setProperty('justify-content', 'flex-start', 'important');
    container.style.setProperty('align-items', 'stretch', 'important');
    container.style.setProperty('gap', '8px', 'important');

    container.querySelectorAll('.activity-category-group').forEach(group => {
        group.style.setProperty('display', 'block', 'important');
        group.style.setProperty('flex', '0 0 auto', 'important');
        group.style.setProperty('height', 'auto', 'important');
        group.style.setProperty('min-height', '0', 'important');
        group.style.setProperty('max-height', 'none', 'important');
        group.style.setProperty('margin', '0', 'important');
    });

    container.querySelectorAll('.activity-row').forEach(row => {
        row.style.setProperty('pointer-events', 'auto', 'important');
        const cb = row.querySelector('input[type="checkbox"]');
        if (cb) {
            cb.style.setProperty('width', '16px', 'important');
            cb.style.setProperty('height', '16px', 'important');
            cb.style.setProperty('min-width', '16px', 'important');
            cb.style.setProperty('margin', '0', 'important');
            cb.style.setProperty('flex-shrink', '0', 'important');
            cb.style.setProperty('cursor', 'pointer', 'important');
            cb.style.setProperty('pointer-events', 'auto', 'important');
            cb.style.setProperty('position', 'relative', 'important');
            cb.style.setProperty('z-index', '2', 'important');
        }
        const lbl = row.querySelector('label');
        if (lbl) {
            lbl.style.whiteSpace = 'nowrap';
            lbl.style.fontSize = '13px';
            lbl.style.setProperty('cursor', 'pointer', 'important');
            lbl.style.setProperty('pointer-events', 'auto', 'important');
        }
        const sel = row.querySelector('select');
        if (sel) {
            sel.style.flexShrink = '0';
            sel.style.maxWidth = '112px';
            sel.style.padding = '2px 5px';
            sel.style.fontSize = '11px';
            sel.style.setProperty('pointer-events', 'auto', 'important');
        }
    });
}

function setActivityCategoryOpenState(category, shouldOpen) {
    const listEl = document.getElementById(`group-${category}-activities`);
    const btnEl = document.getElementById(`btn-toggle-${category}-activities`);
    const chevronEl = document.getElementById(`chevron-${category}`);
    if (!listEl) return;

    if (shouldOpen) {
        listEl.hidden = false;
        listEl.style.setProperty('display', 'flex', 'important');
        listEl.style.setProperty('flex-direction', 'column', 'important');
        listEl.style.setProperty('height', 'auto', 'important');
        listEl.style.setProperty('min-height', '0', 'important');
        listEl.style.setProperty('padding', '4px 6px', 'important');
    } else {
        listEl.hidden = true;
        listEl.style.setProperty('display', 'none', 'important');
        listEl.style.setProperty('height', '0px', 'important');
        listEl.style.setProperty('min-height', '0', 'important');
        listEl.style.setProperty('padding', '0px', 'important');
    }

    if (btnEl) {
        btnEl.style.setProperty('border-bottom', shouldOpen ? '1px solid #e2e8f0' : 'none', 'important');
    }
    if (chevronEl) {
        chevronEl.textContent = shouldOpen ? '▼' : '▶';
    }
}

function toggleActivityCategory(category, forceOpen = null) {
    const listEl = document.getElementById(`group-${category}-activities`);
    if (!listEl) return;

    const isCurrentlyOpen = !listEl.hidden && window.getComputedStyle(listEl).display !== 'none';
    const shouldOpen = forceOpen !== null ? forceOpen : !isCurrentlyOpen;

    // Exclusive accordion: unfolding one category automatically collapses the other
    if (shouldOpen) {
        const otherCategory = category === 'text' ? 'audio' : 'text';
        setActivityCategoryOpenState(otherCategory, false);
    }

    setActivityCategoryOpenState(category, shouldOpen);
    applyActivityListLayoutOverrides();
}

function updateActivityCategoryCounts(autoExpandChecked = false) {
    let expandedOne = false;
    ['text', 'audio'].forEach(category => {
        const listEl = document.getElementById(`group-${category}-activities`);
        const badgeEl = document.getElementById(`badge-count-${category}`);
        if (!listEl || !badgeEl) return;

        const checkedCount = listEl.querySelectorAll('input[type="checkbox"]:checked').length;
        if (checkedCount > 0) {
            badgeEl.textContent = String(checkedCount);
            badgeEl.style.display = 'inline-block';
            if (autoExpandChecked && !expandedOne) {
                toggleActivityCategory(category, true);
                expandedOne = true;
            }
        } else {
            badgeEl.style.display = 'none';
        }
    });
}

function pruneEmptyAncestorBoxes(startEl, stopBoundaryEl) {
    let curr = startEl;
    while (curr && curr !== stopBoundaryEl && curr !== document.body) {
        const parent = curr.parentElement;
        const hasInteractive = curr.querySelectorAll('button, input, select, textarea').length > 0;
        const hasText = (curr.textContent || '').trim().length > 0;
        if (!hasInteractive && !hasText) {
            curr.remove();
            curr = parent;
        } else {
            break;
        }
    }
}

function hideSentenceTableCountControl() {
    const tableCountSelect = document.getElementById('table-sentence-count');
    if (!tableCountSelect) return;

    const menu = document.getElementById('activity-menu') || document.body;
    const rowWrapper = tableCountSelect.parentElement;
    if (rowWrapper && !rowWrapper.querySelector('#sentence-count')) {
        const parent = rowWrapper.parentElement;
        rowWrapper.remove();
        pruneEmptyAncestorBoxes(parent, menu);
    } else {
        tableCountSelect.remove();
        const lbl = document.querySelector('label[for="table-sentence-count"]');
        if (lbl) {
            const lblParent = lbl.parentElement;
            lbl.remove();
            pruneEmptyAncestorBoxes(lblParent, menu);
        }
    }
}

/* =========================
   ACTIVITY MENU COLUMN WIDTHS, HEADER CONTROLS & LEARNER TIME ESTIMATE
========================= */
function removeStraySentenceCountFromCol3(col3) {
    if (!col3) return;

    col3.querySelectorAll('label[for="sentence-count"], label[for="table-sentence-count"], #table-sentence-count').forEach(el => {
        const parent = el.parentElement;
        el.remove();
        pruneEmptyAncestorBoxes(parent, col3);
    });

    Array.from(col3.querySelectorAll('label, span, div, p')).forEach(el => {
        if (el.children.length === 0 && /^(Exercise\s+)?Sentence(\s+Table)?\s+Count\s*:?$/i.test((el.textContent || '').trim())) {
            const parent = el.parentElement;
            el.remove();
            pruneEmptyAncestorBoxes(parent, col3);
        }
    });

    Array.from(col3.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && /^(Exercise\s+)?Sentence(\s+Table)?\s+Count\s*:?$/i.test((node.textContent || '').trim())) {
            node.remove();
        }
    });

    // Remove any remaining empty white card/box wrappers in Column 3 (excluding the Classroom fields drawer)
    const assignFields = document.getElementById('classroom-assign-fields');
    Array.from(col3.querySelectorAll('div, p, label, span')).reverse().forEach(el => {
        if (assignFields && (el === assignFields || assignFields.contains(el))) return;
        const hasInteractive = el.querySelectorAll('button, input, select, textarea').length > 0;
        const hasText = (el.textContent || '').trim().length > 0;
        if (!hasInteractive && !hasText) {
            el.remove();
        }
    });
}

function arrangeActivityMenuLayout() {
    const menu = document.getElementById('activity-menu');
    const activityList = document.getElementById('activity-list');
    const sentencesContainer = document.getElementById('per-activity-sentences-container');
    const sentenceCountSelect = document.getElementById('sentence-count');

    if (!menu || !activityList || !sentencesContainer) return;

    if (sentenceCountSelect && !sentenceCountSelect.dataset.countListenerBound) {
        sentenceCountSelect.addEventListener('change', () => {
            renderPerActivitySentenceBoxes();
        });
        sentenceCountSelect.dataset.countListenerBound = 'true';
    }

    // Locate the 3-column wrapper inside #activity-menu
    let col1 = activityList.parentElement;
    while (col1 && col1.parentElement && !col1.parentElement.contains(sentencesContainer)) {
        col1 = col1.parentElement;
    }

    const columnsWrapper = col1 ? col1.parentElement : null;
    if (columnsWrapper && columnsWrapper.children.length >= 3) {
        columnsWrapper.style.setProperty('box-sizing', 'border-box', 'important');
        columnsWrapper.style.setProperty('width', '100%', 'important');
        columnsWrapper.style.setProperty('max-width', '100%', 'important');
        columnsWrapper.style.setProperty('overflow', 'hidden', 'important');

        const cols = Array.from(columnsWrapper.children);
        const col2 = cols.find(el => el.contains(sentencesContainer));
        const col3 = cols.find(el => el !== col1 && el !== col2);

        const wrapperDisplay = window.getComputedStyle(columnsWrapper).display;
        if (wrapperDisplay === 'grid') {
            columnsWrapper.style.setProperty('grid-template-columns', '310px minmax(0, 1fr) 210px', 'important');
        } else {
            columnsWrapper.style.setProperty('display', 'flex', 'important');
            columnsWrapper.style.setProperty('align-items', 'stretch', 'important');
        }

        if (col1) {
            col1.style.setProperty('box-sizing', 'border-box', 'important');
            col1.style.setProperty('flex', '0 0 310px', 'important');
            col1.style.setProperty('width', '310px', 'important');
            col1.style.setProperty('min-width', '310px', 'important');
            col1.style.setProperty('max-width', '310px', 'important');
        }
        if (col2) {
            col2.style.setProperty('box-sizing', 'border-box', 'important');
            col2.style.setProperty('flex', '1 1 auto', 'important');
            col2.style.setProperty('min-width', '0', 'important');
            col2.style.setProperty('overflow-x', 'hidden', 'important');
        }
        if (col3) {
            col3.style.setProperty('box-sizing', 'border-box', 'important');
            col3.style.setProperty('flex', '0 0 210px', 'important');
            col3.style.setProperty('width', '210px', 'important');
            col3.style.setProperty('min-width', '205px', 'important');
            col3.style.setProperty('max-width', '215px', 'important');
            col3.style.setProperty('overflow-x', 'hidden', 'important');

            col3.querySelectorAll('select, input').forEach(el => {
                el.style.setProperty('max-width', '100%', 'important');
                el.style.setProperty('box-sizing', 'border-box', 'important');
            });

            col3.querySelectorAll('button').forEach(btn => {
                if (btn.closest('#gc-student-selector-wrapper')) return;
                btn.style.setProperty('width', '100%', 'important');
                btn.style.setProperty('max-width', '100%', 'important');
                btn.style.setProperty('box-sizing', 'border-box', 'important');
                btn.style.setProperty('height', 'auto', 'important');
                btn.style.setProperty('min-height', '44px', 'important');
                btn.style.setProperty('padding', '10px 10px', 'important');
                btn.style.setProperty('line-height', '1.35', 'important');
                btn.style.setProperty('white-space', 'normal', 'important');
                btn.style.setProperty('display', 'flex', 'important');
                btn.style.setProperty('align-items', 'center', 'important');
                btn.style.setProperty('justify-content', 'center', 'important');
                btn.style.setProperty('text-align', 'center', 'important');
            });
        }

        // Move "Exercise Sentence Count:" + add Estimated Time badge next to "2. Customize Exercise Sentences"
        if (col2) {
            let headerBar = document.getElementById('customize-sentences-header-bar');
            if (!headerBar) {
                const headingBlock = Array.from(col2.children).find(el =>
                    el !== sentencesContainer && /Customize Exercise Sentences/i.test(el.textContent || '')
                );

                if (headingBlock) {
                    // Separate the heading title from any subtitle paragraph inside headingBlock
                    let titleEl = headingBlock;
                    let subtitleEl = null;

                    if (headingBlock.children.length > 0) {
                        const foundTitle = Array.from(headingBlock.children).find(ch =>
                            /Customize Exercise Sentences/i.test(ch.textContent || '')
                        );
                        if (foundTitle) {
                            titleEl = foundTitle;
                            subtitleEl = Array.from(headingBlock.children).find(ch => ch !== foundTitle) || null;
                        }
                    }

                    headerBar = document.createElement('div');
                    headerBar.id = 'customize-sentences-header-bar';
                    headerBar.style.cssText = 'display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; width: 100%;';

                    titleEl.style.margin = '0';
                    titleEl.style.whiteSpace = 'nowrap';

                    headingBlock.parentNode.insertBefore(headerBar, headingBlock);
                    headerBar.appendChild(titleEl);

                    if (subtitleEl) {
                        subtitleEl.style.margin = '0 0 8px 0';
                        subtitleEl.style.display = 'block';
                        subtitleEl.style.whiteSpace = 'normal';
                        headingBlock.parentNode.insertBefore(subtitleEl, headingBlock);
                    }

                    if (headingBlock !== titleEl && headingBlock.children.length === 0) {
                        headingBlock.remove();
                    }

                    const controlsRight = document.createElement('div');
                    controlsRight.id = 'customize-header-controls';
                    controlsRight.style.cssText = 'display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-left: auto;';
                    headerBar.appendChild(controlsRight);

                    if (sentenceCountSelect) {
                        const oldWrapper = sentenceCountSelect.parentElement;
                        const countPill = document.createElement('label');
                        countPill.id = 'sentence-count-inline-wrapper';
                        countPill.setAttribute('for', 'sentence-count');
                        countPill.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 3px 8px; font-size: 12px; font-weight: 600; color: #334155; margin: 0; cursor: pointer;';

                        const textSpan = document.createElement('span');
                        textSpan.textContent = 'Exercise Sentence Count:';

                        sentenceCountSelect.style.cssText = 'padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; font-weight: 700; color: #0f172a; background: #ffffff; cursor: pointer; margin: 0; width: auto;';

                        countPill.appendChild(textSpan);
                        countPill.appendChild(sentenceCountSelect);
                        controlsRight.appendChild(countPill);

                        pruneEmptyAncestorBoxes(oldWrapper, col3 || columnsWrapper);
                    }

                    const estBadge = document.createElement('span');
                    estBadge.id = 'assignment-estimated-time';
                    estBadge.style.cssText = 'display: inline-flex; align-items: center; gap: 4px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; white-space: nowrap;';
                    estBadge.textContent = '⏱️ Est. time: 0 mins';
                    controlsRight.appendChild(estBadge);
                }
            }
        }

        // Remove any leftover "Exercise Sentence Count:" label/wrapper or empty white box from Column 3
        removeStraySentenceCountFromCol3(col3);
    }
}

/**
 * Estimates completion time in seconds for a single item from the perspective
 * of a foreign-language learner (word-by-word decoding, audio replays, accent/grammar
 * recall, mistake feedback, and self-correction retries).
 */
function estimateSingleSentenceSeconds(actId, sentenceObj) {
    const targetText = (sentenceObj?.t || '').replace(/\*/g, '').trim();
    const engText = (sentenceObj?.tr || '').replace(/\*/g, '').trim();
    const refText = targetText || engText;

    const words = refText ? refText.split(/\s+/).filter(Boolean).length : 6;
    const chars = refText.replace(/\s+/g, '').length || (words * 5);

    // Learner decoding time to read a foreign sentence word-by-word (~0.95s/word)
    const l2ReadSec = 2.5 + (words * 0.95);
    // Single audio playback duration (~0.5s/word + player latency)
    const singleAudioPlaySec = 1.4 + (words * 0.5);

    const getGapStats = (id) => {
        const lvl = document.getElementById(`${id}-gap-select`)?.value || '1';
        if (lvl === '1') return { count: 1, pct: Math.min(100, Math.round(100 / Math.max(1, words))) };
        const pct = parseInt(lvl, 10) || 25;
        return { count: Math.max(1, Math.round(words * (pct / 100))), pct };
    };

    switch (actId) {
        case 'match':
            // Scanning & comparing similar L2 sentences against shuffled English distractors
            return 7.0 + (words * 1.1);

        case 'faulty':
            // Reading L2 + comparing word-for-word against tricky English distractor + typing fix
            return l2ReadSec + 7.5 + (words * 0.8);

        case 'listen-faulty':
            // Typically 2.5 listens to catch the subtle mismatch + typing corrected English
            return (singleAudioPlaySec * 2.5) + 7.5 + (words * 0.7);

        case 'listen-missing':
            // 2.5 listens + reading gapped L2 + recalling/spelling omitted L2 word(s) + error check
            return (singleAudioPlaySec * 2.5) + l2ReadSec + 7.5;

        case 'nospaces':
            // Segmenting unspaced L2 string, identifying apostrophes/accents, typing & fixing typos
            return 6.0 + (words * 2.8);

        case 'jumbled':
            // Reconstructing L2 word order/syntax + typing/ordering + fixing order mistakes
            return 7.0 + (words * 3.0);

        case 'listen-jumbled':
            // 2.5 listens + arranging scrambled L2 chunks + verifying word order
            return (singleAudioPlaySec * 2.5) + 6.5 + (words * 2.4);

        case 'gap-en':
            // Reading/translating L2 sentence for context + recalling & typing missing English word
            return l2ReadSec + 6.5;

        case 'gap-t':
            // Reading English + L2 context + recalling L2 spelling/accents/agreement + fixing typos
            return l2ReadSec + 9.5;

        case 'vowels':
        case 'cons':
            // Reconstructing every word from partial letter skeleton + recalling accents/endings
            return 7.0 + (chars * 0.65);

        case 'beat-robot': {
            const mode = document.getElementById('beat-robot-mode-select')?.value || 'vowels';
            const ratio = mode === 'consonants' ? 0.58 : 0.42;
            const approxMissingLetters = Math.max(2, Math.round(chars * ratio));
            return 4.5 + (approxMissingLetters * 1.5);
        }

        case 'listen-trad': {
            const { count, pct } = getGapStats(actId);
            // More missing English words = more replays & longer translation recall
            const replays = pct >= 75 ? 3.2 : (pct >= 25 ? 2.6 : 2.0);
            return (singleAudioPlaySec * replays) + 5.0 + (count * 2.9);
        }

        case 'listen-dictation': {
            const { count, pct } = getGapStats(actId);
            // Foreign-language dictation requires multiple listens + phonetic-to-spelling recall + accent fixes
            const replays = pct >= 75 ? 3.5 : (pct >= 25 ? 2.8 : 2.2);
            return (singleAudioPlaySec * replays) + 5.5 + (count * 4.4);
        }

        case 'delayed-dictation': {
            const { count, pct } = getGapStats(actId);
            // Includes built-in 3s hold timer + multiple listens + holding in L2 working memory + spelling/retries
            const replays = pct >= 75 ? 3.2 : (pct >= 25 ? 2.5 : 2.0);
            return (singleAudioPlaySec * replays) + 3.0 + 6.0 + (count * 4.6);
        }

        case 'delayed-copying': {
            const { count } = getGapStats(actId);
            // Includes fixed 10s study/memorise countdown + typing L2 from short-term memory + fixing mistakes
            return 10.0 + 4.5 + (count * 4.4);
        }

        case 'trans-en':
            // Decoding full L2 sentence + writing natural English + checking meaning
            return l2ReadSec + 4.5 + (words * 2.1);

        case 'trans-target':
            // Hardest productive task: recalling L2 vocab, syntax, conjugations, agreements, accents + retries
            return 7.5 + (words * 4.4);

        default:
            return 8.0 + (words * 3.0);
    }
}

function updateAssignmentTimeEstimate() {
    const estBadge = document.getElementById('assignment-estimated-time');
    if (!estBadge) return;

    const checkedBoxes = Array.from(document.querySelectorAll('#activity-list input[type="checkbox"]:checked'))
        .filter(cb => cb.value !== 'study');

    if (checkedBoxes.length === 0) {
        estBadge.textContent = '⏱️ Est. time: 0 mins';
        estBadge.title = 'Select activities to calculate estimated student completion time.';
        return;
    }

    const domMap = getCurrentSentencesMapFromDOM();
    const rawLimit = parseInt(document.getElementById('sentence-count')?.value, 10);
    const limit = (!isNaN(rawLimit) && rawLimit > 0) ? rawLimit : 10;
    const fallbackSentences = getAssembledSentences();

    let totalSeconds = 0;
    let totalItems = 0;
    let totalWords = 0;
    const perActivitySummary = [];

    checkedBoxes.forEach(cb => {
        const actId = cb.value;
        const actLabel = document.querySelector(`label[for="${cb.id}"]`)?.innerText?.trim() || actId;

        let sents = (domMap[actId] && domMap[actId].length > 0)
            ? domMap[actId]
            : ((window.editingSavedSentencesMap && window.editingSavedSentencesMap[actId] && window.editingSavedSentencesMap[actId].length > 0)
                ? window.editingSavedSentencesMap[actId]
                : fallbackSentences.slice(0, limit));

        if (!sents || sents.length === 0) {
            sents = Array.from({ length: limit }, () => ({ t: 'sample sentence of six words', tr: '' }));
        }

        // +15s per activity block for reading exercise instructions & switching task mode
        let actSeconds = 15;
        sents.forEach(s => {
            actSeconds += estimateSingleSentenceSeconds(actId, s);
            const wCount = ((s?.t || s?.tr || '').replace(/\*/g, '').trim().split(/\s+/).filter(Boolean).length) || 6;
            totalWords += wCount;
            totalItems += 1;
        });

        totalSeconds += actSeconds;
        perActivitySummary.push(`• ${actLabel}: ~${Math.max(1, Math.round(actSeconds / 60))} min`);
    });

    const lowMins = Math.max(1, Math.round((totalSeconds * 0.9) / 60));
    const highMins = Math.max(lowMins, Math.round((totalSeconds * 1.15) / 60));
    const avgWords = totalItems > 0 ? (totalWords / totalItems).toFixed(1) : '0';

    if (lowMins === highMins) {
        estBadge.textContent = lowMins === 1
            ? '⏱️ Est. time: ~1 min'
            : `⏱️ Est. time: ~${lowMins} mins`;
    } else {
        estBadge.textContent = `⏱️ Est. time: ~${lowMins}–${highMins} mins`;
    }

    estBadge.title = [
        `Realistic L2 learner estimate (${checkedBoxes.length} activit${checkedBoxes.length === 1 ? 'y' : 'ies'}, ${limit} sentences/exercise, avg. ${avgWords} words/sentence — includes audio replays & error retries):`,
        ...perActivitySummary
    ].join('\n');
}

function ensureGroupedActivityList() {
    hideSentenceTableCountControl();
    arrangeActivityMenuLayout();

    const container = document.getElementById('activity-list');
    if (!container) return;

    // Remove any legacy Sentence Table checkbox row if present
    const legacyStudyRow = container.querySelector('#chk-study')?.closest('.activity-row');
    if (legacyStudyRow) legacyStudyRow.remove();

    if (document.getElementById('group-text-activities') && document.getElementById('group-audio-activities')) {
        applyActivityListLayoutOverrides();
        return;
    }

    const existingRows = Array.from(container.querySelectorAll('.activity-row'));
    if (existingRows.length === 0) return;

    container.innerHTML =
        buildActivityCategoryGroupHTML('text', 'Text Activities', '📝', '', true) +
        buildActivityCategoryGroupHTML('audio', 'Audio Activities', '🎧', '', false);

    const textGroup = document.getElementById('group-text-activities');
    const audioGroup = document.getElementById('group-audio-activities');

    existingRows.forEach(row => {
        row.style.setProperty('flex', '0 0 auto', 'important');
        row.style.setProperty('height', 'auto', 'important');
        row.style.setProperty('min-height', '0', 'important');
        const cb = row.querySelector('input[type="checkbox"]');
        const actId = cb ? cb.value : '';
        if (actId === 'study') return;
        if (AUDIO_ACTIVITY_IDS.includes(actId)) {
            audioGroup.appendChild(row);
        } else {
            textGroup.appendChild(row);
        }
    });

    setActivityCategoryOpenState('text', true);
    setActivityCategoryOpenState('audio', false);
    applyActivityListLayoutOverrides();
}

/* =========================
   SENTENCE LIST PREVIEW (WITH AMOUNT DROPDOWN, COPY & DOWNLOAD)
========================= */
window.previewAllSentences = [];
window.previewDisplayedSentences = [];
window.previewRenderSessionId = 0;

function renderPreviewSentencesBatch(sentences) {
    const modal = document.getElementById('preview-modal');
    const content = document.getElementById('preview-content');
    if (!content) return;

    window.previewDisplayedSentences = sentences;
    const sessionId = ++window.previewRenderSessionId;

    if (!sentences || sentences.length === 0) {
        content.innerHTML = "No content yet.";
        return;
    }

    const renderChunk = (start, end) => {
        let html = '';
        for (let i = start; i < end; i++) {
            const s = sentences[i];
            html += `<div class="preview-sentence">${i + 1}. <b>${s.t}</b> <span class="tr-text">(${s.tr})</span></div>`;
        }
        return html;
    };

    const FIRST_BATCH = 300;
    const firstEnd = Math.min(sentences.length, FIRST_BATCH);
    content.innerHTML = renderChunk(0, firstEnd);

    let cursor = firstEnd;
    function appendNextBatch() {
        if (sessionId !== window.previewRenderSessionId || cursor >= sentences.length || (modal && modal.style.display === 'none')) return;
        const nextEnd = Math.min(sentences.length, cursor + 500);
        content.insertAdjacentHTML('beforeend', renderChunk(cursor, nextEnd));
        cursor = nextEnd;
        if (cursor < sentences.length) {
            requestAnimationFrame(appendNextBatch);
        }
    }

    if (cursor < sentences.length) {
        requestAnimationFrame(appendNextBatch);
    }
}

function updatePreviewSentenceList() {
    const all = window.previewAllSentences || [];
    const countSelect = document.getElementById('preview-sentence-count');
    const counterEl = document.getElementById('preview-sentence-counter');
    const val = countSelect ? countSelect.value : 'all';

    let subset = all;
    if (val !== 'all') {
        const limit = parseInt(val, 10);
        if (!isNaN(limit) && limit > 0 && limit < all.length) {
            subset = typeof getBalancedSelection === 'function'
                ? getBalancedSelection(all, limit)
                : all.slice(0, limit);
        }
    }

    if (counterEl) {
        if (all.length === 0) {
            counterEl.textContent = '(0 sentences)';
        } else if (subset.length < all.length) {
            counterEl.textContent = `(${subset.length} of ${all.length} sentences)`;
        } else {
            counterEl.textContent = all.length === 1 ? '(1 sentence)' : `(${all.length} sentences)`;
        }
    }

    renderPreviewSentencesBatch(subset);
}

function copyPreviewSentences(btnEl) {
    const list = window.previewDisplayedSentences || [];
    if (list.length === 0) {
        alert("No sentences to copy.");
        return;
    }

    // Tab-separated values (Target \t English) paste cleanly into 2 columns in Excel / Google Sheets
    const tsv = list
        .map(s => `${(s.t || '').replace(/[\t\r\n]+/g, ' ').trim()}\t${(s.tr || '').replace(/[\t\r\n]+/g, ' ').trim()}`)
        .join('\n');

    const showCopiedState = () => {
        if (!btnEl) return;
        const origHTML = btnEl.getAttribute('data-orig-html') || btnEl.innerHTML;
        btnEl.setAttribute('data-orig-html', origHTML);
        btnEl.innerHTML = '✅ Copied!';
        btnEl.style.background = '#dcfce7';
        btnEl.style.borderColor = '#86efac';
        btnEl.style.color = '#166534';
        clearTimeout(btnEl._copyTimer);
        btnEl._copyTimer = setTimeout(() => {
            btnEl.innerHTML = origHTML;
            btnEl.style.background = '#f1f5f9';
            btnEl.style.borderColor = '#cbd5e1';
            btnEl.style.color = '#1e293b';
        }, 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(tsv).then(showCopiedState).catch(() => {
            fallbackCopyText(tsv);
            showCopiedState();
        });
    } else {
        fallbackCopyText(tsv);
        showCopiedState();
    }
}

function fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
}

function downloadPreviewSentenceTable() {
    const list = window.previewDisplayedSentences || [];
    if (list.length === 0) {
        alert("No sentences to download.");
        return;
    }

    const docTitle = document.getElementById('builder-title')?.value || "Sentence Builder";
    const docLang = (typeof meta !== 'undefined' && meta.lang) || document.getElementById('meta-lang')?.value || "Target Language";
    const docYear = (typeof meta !== 'undefined' && meta.year) || document.getElementById('meta-year')?.value || "";

    const escapeHtml = str => String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const rowsHtml = list.map(s =>
        '<tr>' +
            '<td style="padding:2pt 6pt; mso-para-margin:0pt;"><b>' + escapeHtml(s.t) + '</b></td>' +
            '<td class="blue" style="padding:2pt 6pt; mso-para-margin:0pt;">' + escapeHtml(s.tr) + '</td>' +
        '</tr>'
    ).join('');

    const subInfo = docYear ? `${escapeHtml(docLang)} | ${escapeHtml(docYear)}` : escapeHtml(docLang);

    const contentHtml =
        '<div class="header-block">' +
            '<div class="doc-main-title">' + escapeHtml(docTitle).toUpperCase() + ' <span class="doc-sub-info">' + subInfo + '</span></div>' +
        '</div>' +
        '<table class="sentence-grid-table">' +
            '<tr><th>' + escapeHtml(docLang) + '</th><th>English Translation</th></tr>' +
            rowsHtml +
        '</table>';

    const fullDoc =
        '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
        '<head>' +
        '<meta charset="utf-8">' +
        '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->' +
        '<style>' +
            '@page { size: A4 portrait; margin: 2cm; } ' +
            'body { font-family: "Segoe UI", Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.3; } ' +
            '.header-block { margin-bottom: 12pt; } ' +
            '.doc-main-title { font-size: 15pt; font-weight: bold; text-transform: uppercase; color: #0f172a; } ' +
            '.doc-sub-info { font-size: 10pt; font-weight: normal; text-transform: none; color: #64748b; margin-left: 8px; } ' +
            '.sentence-grid-table { width: 100%; border-collapse: collapse; margin-top: 4pt; } ' +
            '.sentence-grid-table th { border: 1px solid #cbd5e1; padding: 4pt 6pt; font-size: 10pt; background-color: #f1f5f9; text-align: left; font-weight: bold; } ' +
            '.sentence-grid-table td { border: 1px solid #cbd5e1; padding: 2pt 6pt; font-size: 10pt; line-height: 1.15; } ' +
            '.blue { color: #2980b9; font-style: italic; } ' +
        '</style>' +
        '</head>' +
        '<body>' + contentHtml + '</body>' +
        '</html>';

    const blob = new Blob(['\ufeff', fullDoc], { type: 'application/msword' });
    if (typeof saveAs === 'function') {
        saveAs(blob, `${docTitle}_Sentence_Table.doc`);
    } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${docTitle}_Sentence_Table.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

function openPreview() {
    const modal = document.getElementById('preview-modal');
    const overlay = document.getElementById('overlay');
    const content = document.getElementById('preview-content');
    const titleEl = modal ? modal.querySelector('h3') : null;

    if (titleEl) {
        titleEl.style.display = 'flex';
        titleEl.style.flexWrap = 'wrap';
        titleEl.style.alignItems = 'center';
        titleEl.style.gap = '8px';
        titleEl.style.paddingRight = '32px';
        titleEl.innerHTML = `
            <span>Sentence List Preview</span>
            <span id="preview-sentence-counter" style="font-size: 13px; font-weight: 600; color: #64748b;"></span>
            <span onclick="event.stopPropagation()" style="display: inline-flex; align-items: center; gap: 6px; margin-left: 4px; flex-wrap: wrap;">
                <label style="display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #334155; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 3px 8px; margin: 0;">
                    <span>Sentences:</span>
                    <select id="preview-sentence-count" onchange="updatePreviewSentenceList()" style="border: none; background: transparent; font-size: 12px; font-weight: 700; color: #1e293b; cursor: pointer; outline: none; padding: 0;">
                        <option value="all" selected>All</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                        <option value="25">25</option>
                        <option value="30">30</option>
                        <option value="40">40</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                </label>
                <button type="button" onclick="copyPreviewSentences(this)" title="Copy sentences (tab-separated for Excel)" style="padding: 4px 10px; font-size: 12px; font-weight: 600; background: #f1f5f9; color: #1e293b; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; margin: 0; line-height: 1.3;">
                    📋 Copy
                </button>
                <button type="button" onclick="downloadPreviewSentenceTable()" title="Download Sentence Table (Word)" style="padding: 4px 10px; font-size: 12px; font-weight: 600; background: #2563eb; color: #ffffff; border: 1px solid #2563eb; border-radius: 6px; cursor: pointer; margin: 0; line-height: 1.3;">
                    ⬇️ Download
                </button>
            </span>
        `;
    }
    if (content) {
        content.innerHTML = '<div class="preview-sentence" style="color:#64748b;">⏳ Generating sentence list...</div>';
    }
    if (overlay) overlay.style.display = 'block';
    if (modal) modal.style.display = 'block';

    requestAnimationFrame(() => {
        setTimeout(() => {
            window.previewAllSentences = getAssembledSentences() || [];
            updatePreviewSentenceList();
        }, 0);
    });
}

function openActivityMenu() {
    editingAssignmentId = null;
    window.editingSavedSentencesMap = {};
    window.duplicatingAssignmentLang = null;

    if (typeof resetCourseStudentSelector === 'function') {
        resetCourseStudentSelector();
    }

    hideSentenceTableCountControl();
    arrangeActivityMenuLayout();

    // Bind current editor state to assignment options modal
    activeAssignmentBuilderId = currentDocId || null;
    activeAssignmentGrid = JSON.parse(JSON.stringify(grid));
    activeAssignmentDisabledRoutes = Array.isArray(disabledRoutes) ? [...disabledRoutes] : [];
    activeAssignmentExcludedCombos = JSON.parse(JSON.stringify(excludedCombos || []));
    activeAssignmentRequiredCombos = JSON.parse(JSON.stringify(requiredCombos || []));
    activeAssignmentExcludedPairs = JSON.parse(JSON.stringify(excludedPairs || []));
    activeAssignmentTransformationsText = document.getElementById('transformations-input')?.value || transformationsText || "";

    const btn = document.getElementById('gc-publish-btn');
    if (btn) btn.innerText = "📢 Publish Assignment Now";
    
    const dueInput = document.getElementById('gc-due-date');
    const schedInput = document.getElementById('gc-schedule-date');
    if (dueInput) dueInput.value = "";
    if (schedInput) schedInput.value = "";

    const currentLang = meta.lang || document.getElementById('meta-lang')?.value || "Target Language";
    const list = [
        {id:'match', label:'Match up'}, 
        {id:'nospaces', label:'No Spaces'}, 
        {id:'jumbled', label:'Unjumble'}, 
        {id:'gap-en', label:'Gap Fill (English)'}, 
        {id:'gap-t', label:`Gap Fill (${currentLang})`}, 
        {id:'vowels', label:'Missing Vowels'}, 
        {id:'cons', label:'Missing Consonants'}, 
        {id:'beat-robot', label:'🤖 Beat the Robot'},
        {id:'faulty', label:'Faulty Translation'}, 
        {id:'trans-en', label:'Translate (English)'}, 
        {id:'trans-target', label:`Translate (${currentLang})`},
        {id:'listen-trad', label:'🎧 Translation'},
        {id:'listen-dictation', label:'🎧 Dictation'},
        {id:'delayed-dictation', label:'🎧 Delayed Dictation'},
        {id:'delayed-copying', label:'Delayed Copying'},
        {id:'listen-missing', label:'🎧 Missing Detail'},
        {id:'listen-faulty', label:'🎧 Faulty Translation'},
        {id:'listen-jumbled', label:'🎧 Unjumble'}
    ];

    const defaultGapLevels = {
        'listen-trad': '1',
        'listen-dictation': '1',
        'delayed-dictation': '1',
        'delayed-copying': '1',
        'beat-robot': 'vowels'
    };

    const textActivities = list.filter(a => !AUDIO_ACTIVITY_IDS.includes(a.id));
    const audioActivities = list.filter(a => AUDIO_ACTIVITY_IDS.includes(a.id));

    const textRowsHTML = textActivities.map(a => buildActivitySelectorRowHTML(a, defaultGapLevels)).join('');
    const audioRowsHTML = audioActivities.map(a => buildActivitySelectorRowHTML(a, defaultGapLevels)).join('');

    document.getElementById('activity-list').innerHTML =
        buildActivityCategoryGroupHTML('text', 'Text Activities', '📝', textRowsHTML, true) +
        buildActivityCategoryGroupHTML('audio', 'Audio Activities', '🎧', audioRowsHTML, false);

    setActivityCategoryOpenState('text', true);
    setActivityCategoryOpenState('audio', false);
    applyActivityListLayoutOverrides();
    
    renderPerActivitySentenceBoxes();
    document.getElementById('activity-menu').style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';
}

/* =========================
   SENTENCE ASSEMBLY & TRANSFORMATIONS
========================= */
function compileTransformRules(rulesText) {
    const compiled = [];
    if (!rulesText) return compiled;

    // Escape regex special characters and match both straight (') and curly (’) apostrophes
    const escapeFlex = s => s
        .replace(/[-[\]{}()*+?^$|#\s\\.]/g, '\\$&')
        .replace(/['’]/g, "['’]");

    const addBounds = (raw, pat) => {
        if (/^[\w\u00C0-\u024F]/.test(raw)) pat = '(?<![a-zA-Z0-9\u00C0-\u024F])' + pat;
        if (/[\w\u00C0-\u024F]$/.test(raw)) pat = pat + '(?![a-zA-Z0-9\u00C0-\u024F])';
        return pat;
    };

    for (let line of rulesText.split('\n')) {
        const rawLine = line.replace(/[\r\n]/g, '');
        if (!rawLine.trim() || !rawLine.includes('=')) continue;

        const eqIdx = rawLine.indexOf('=');
        let find = rawLine.substring(0, eqIdx);
        let replace = rawLine.substring(eqIdx + 1);

        if (find.endsWith(' ') && replace.startsWith(' ')) {
            find = find.slice(0, -1).trim();
            replace = replace.slice(1);
        } else {
            find = find.trim();
        }
        if (!find) continue;

        // 1. Trigger rule: word1$word2=replacement
        if (find.includes('$')) {
            const subParts = find.split('$').map(s => s.trim());
            if (subParts.length === 2 && subParts[0] && subParts[1]) {
                const [w1, w2] = subParts;
                const p1 = addBounds(w1, escapeFlex(w1));
                const p2 = addBounds(w2, escapeFlex(w2));
                compiled.push({
                    type: 'trigger',
                    regex: new RegExp(`(${p1}.*?)${p2}`, 'gi'),
                    replace
                });
            }
        }
        // 2. Discontinuous rule: word1+word3=replacement
        else if (find.includes('+')) {
            const subParts = find.split('+').map(s => s.trim());
            if (subParts.length === 2 && subParts[0] && subParts[1]) {
                const [w1, w3] = subParts;
                const p1 = addBounds(w1, escapeFlex(w1));
                const p3 = addBounds(w3, escapeFlex(w3));
                compiled.push({
                    type: 'split',
                    regex: new RegExp(`${p1}\\s+(.+?)\\s+${p3}`, 'gi'),
                    replace: `${replace} $1`
                });
            }
        }
        // 3. Standard replace / delete rule: word1=word2
        else {
            compiled.push({
                type: 'std',
                regex: new RegExp(addBounds(find, escapeFlex(find)), 'gi'),
                replace
            });
        }
    }
    return compiled;
}

function compileExclusionRegexes(rulesText) {
    const compiled = [];
    if (!rulesText) return compiled;

    const escapeReg = s => s.replace(/[-[\]{}()*+?^$|#\s\\]/g, '\\$&');
    for (let line of rulesText.split('\n')) {
        line = line.trim();
        if (!line || line.includes('=') || !line.includes('*')) continue;
        const tokens = line.split('*').map(t => t.trim()).filter(Boolean);
        if (tokens.length >= 2) {
            compiled.push(new RegExp(tokens.map(escapeReg).join('.*?'), 'i'));
        }
    }
    return compiled;
}

function applyCompiledTransformations(text, compiledRules) {
    if (!text || !compiledRules || compiledRules.length === 0) return text;
    for (let i = 0; i < compiledRules.length; i++) {
        const rule = compiledRules[i];
        if (rule.type === 'trigger') {
            let prev, guard = 0;
            do {
                prev = text;
                text = text.replace(rule.regex, (match, prefix) => prefix + rule.replace);
            } while (text !== prev && ++guard < 20);
        } else {
            text = text.replace(rule.regex, rule.replace);
        }
    }
    return text.replace(/\s+/g, ' ').trim();
}

function applyTransformations(text, rulesText) {
    if (!text || !rulesText) return text;
    return applyCompiledTransformations(text, compileTransformRules(rulesText));
}

function shouldExcludeSentence(text, rulesText) {
    if (!text || !rulesText) return false;
    const regexes = compileExclusionRegexes(rulesText);
    return regexes.some(rx => rx.test(text));
}

function getAssembledSentences(customGridContext = null) {
    let ctx = customGridContext;
    if (!ctx && activeAssignmentGrid) {
        ctx = {
            grid: activeAssignmentGrid,
            disabledRoutes: activeAssignmentDisabledRoutes || [],
            excludedCombos: activeAssignmentExcludedCombos || [],
            requiredCombos: activeAssignmentRequiredCombos || [],
            excludedPairs: activeAssignmentExcludedPairs || [],
            transformationsText: activeAssignmentTransformationsText || ""
        };
    }

    let targetGrid = (ctx && ctx.grid) ? ctx.grid : grid;
    if (!targetGrid || !targetGrid.length || !targetGrid[0]) return [];

    let targetRules = (ctx && ctx.transformationsText !== undefined)
        ? ctx.transformationsText
        : (activeAssignmentTransformationsText !== null ? activeAssignmentTransformationsText : (document.getElementById('transformations-input')?.value || transformationsText || ""));

    const compiledRules = compileTransformRules(targetRules);
    const exclusionRegexes = compileExclusionRegexes(targetRules);
    const memo = new Map();

    let allSentences = [];
    for (let r = 0; r < targetGrid.length; r++) {
        if (!targetGrid[r][0].hidden) {
            let cell = targetGrid[r][0];
            let rSpan = cell.rS || 1;
            for (let subR = r; subR < r + rSpan; subR++) {
                let paths = findPaths(r, 0, subR, ctx, memo).filter(p => isPathValid(p.parts, ctx, true));
                paths.forEach(p => { p.originRow = subR; });
                allSentences = allSentences.concat(paths);
            }
        }
    }

    const unique = [];
    const seen = new Set();
    for (let i = 0; i < allSentences.length; i++) {
        const s = allSentences[i];
        if (exclusionRegexes.some(rx => rx.test(s.t) || rx.test(s.tr))) continue;

        const cleanT = cleanSentenceSpacing(applyCompiledTransformations(s.t, compiledRules));
        const cleanTr = cleanSentenceSpacing(applyCompiledTransformations(s.tr, compiledRules));

        if (cleanT && !seen.has(cleanT)) {
            unique.push({
                t: cleanT,
                tr: cleanTr,
                parts: s.parts,
                details: s.details,
                originRow: s.originRow
            });
            seen.add(cleanT);
        }
    }
    return unique;
}

/* =========================
   PATH VALIDATION ENGINE
========================= */
function isPathValid(partsMeta, ctx = null, isCompletePath = true) {
    if (!partsMeta || partsMeta.length === 0) return true;

    const dRoutes = (ctx && ctx.disabledRoutes !== undefined) ? ctx.disabledRoutes : (activeAssignmentDisabledRoutes !== null ? activeAssignmentDisabledRoutes : disabledRoutes);
    const exCombos = (ctx && ctx.excludedCombos !== undefined) ? ctx.excludedCombos : (activeAssignmentExcludedCombos !== null ? activeAssignmentExcludedCombos : excludedCombos);
    const exPairs = (ctx && ctx.excludedPairs !== undefined) ? ctx.excludedPairs : (activeAssignmentExcludedPairs !== null ? activeAssignmentExcludedPairs : excludedPairs);
    const reqCombos = (ctx && ctx.requiredCombos !== undefined) ? ctx.requiredCombos : (activeAssignmentRequiredCombos !== null ? activeAssignmentRequiredCombos : requiredCombos);

    // Excluded combos & pairs can safely prune partial paths early
    if (exCombos && exCombos.length > 0) {
        for (let combo of exCombos) {
            const cells = combo.cells || combo;
            if (Array.isArray(cells) && cells.length >= 2) {
                if (cells.every(c => partsMeta.some(p => p.r === c.r && p.c === c.c))) return false;
            }
        }
    }

    if (exPairs && exPairs.length > 0) {
        for (let pair of exPairs) {
            if (partsMeta.some(p => p.r === pair.a.r && p.c === pair.a.c) && partsMeta.some(p => p.r === pair.b.r && p.c === pair.b.c)) return false;
        }
    }

    // Disabled routes and required combos depend on the full assembled path from column 0 to end
    if (isCompletePath) {
        const contentParts = partsMeta.filter(p => !p.isBridge);
        const routeKey = contentParts.map(p => `${p.r + 1}.${p.c + 1}`).join('+');
        if (dRoutes && dRoutes.includes(routeKey)) return false;

        if (reqCombos && reqCombos.length > 0) {
            for (let combo of reqCombos) {
                const cellA = combo.cellA || combo.a;
                const cellB = combo.cellB || combo.b;
                if (cellA && cellB) {
                    if (partsMeta.some(p => p.r === cellA.r && p.c === cellA.c) && !partsMeta.some(p => p.r === cellB.r && p.c === cellB.c)) return false;
                }
            }
        }
    }

    return true;
}

/* =========================================================
   PATH ENGINE WITH MEMOIZATION & BRIDGE/EMPTY COLUMN TRAVERSAL
   ========================================================= */
function cleanSentenceSpacing(str) {
    if (!str) return "";
    return str
        .replace(/\s+([.,!?:;])/g, '$1')                    // Removes space before punctuation ("père ." -> "père.")
        .replace(/([a-zA-ZÀ-ÿ\u00C0-\u024F]')\s+/g, '$1')   // Removes space after apostrophes ("d' un" -> "d'un")
        .replace(/\s+/g, ' ')                               // Collapses multiple spaces
        .trim();
}

function findPaths(r, c, activeRow = null, customCtx = null, memo = null) {
    const targetGrid = (customCtx && customCtx.grid) ? customCtx.grid : (activeAssignmentGrid || grid);
    const cacheKey = `${r}_${c}`;
    if (memo && memo.has(cacheKey)) {
        return memo.get(cacheKey);
    }

    let cell = getCellAt(r, c, targetGrid);
    if (!cell) return [];

    let cellRowSpan = (cell.rS || cell.rowSpan || 1);
    let cellColSpan = (cell.cS || cell.colSpan || 1);
    let nextCol = c + cellColSpan;

    const isCellEmpty = (cObj) => !cObj || !cObj.items || cObj.items.length === 0 || cObj.items.every(it => !it.t || it.t.trim() === "");
    const isBridgeCell = (cObj) => cObj && (cObj.compact || cObj.isBridge || isCellEmpty(cObj));

    const isCurrBridge = isBridgeCell(cell);
    let currentOptions = isCurrBridge ? [] : (cell.items || [])
        .filter(it => it.t && it.t.trim() !== "" && it.t.trim().toLowerCase() !== "bridge")
        .map(it => ({
            t: it.t.trim(),
            tr: it.tr ? it.tr.trim() : "",
            parts: [{ t: it.t, tr: it.tr || "", r: r, c: c }],
            details: [{ tWord: it.t, eWord: it.tr || "", r: r, c: c }]
        }));

    if (nextCol >= targetGrid[0].length) {
        const leafRes = currentOptions.filter(path => isPathValid(path.parts, customCtx, false));
        if (memo) memo.set(cacheKey, leafRes);
        return leafRes;
    }

    let combinedSubPaths = [];
    let visitedTargetRoots = new Set();

    for (let rowOffset = 0; rowOffset < cellRowSpan; rowOffset++) {
        let evalRow = r + rowOffset;
        if (evalRow >= targetGrid.length) break;

        let targetCell = getCellAt(evalRow, nextCol, targetGrid);
        if (!targetCell) continue;

        let targetRootRow = evalRow;
        for (let testR = evalRow; testR >= 0; testR--) {
            if (targetGrid[testR] && targetGrid[testR][nextCol] && !targetGrid[testR][nextCol].hidden) {
                targetRootRow = testR;
                break;
            }
        }

        let targetKey = `${targetRootRow}_${nextCol}`;
        if (visitedTargetRoots.has(targetKey)) continue;
        visitedTargetRoots.add(targetKey);

        combinedSubPaths = combinedSubPaths.concat(findPaths(targetRootRow, nextCol, evalRow, customCtx, memo));
    }

    let result;
    if (isCurrBridge) {
        result = combinedSubPaths.map(sp => ({
            t: sp.t, tr: sp.tr,
            parts: [{ r: r, c: c, isBridge: true }, ...sp.parts],
            details: sp.details || []
        }));
    } else if (currentOptions.length === 0) {
        result = combinedSubPaths.filter(p => isPathValid(p.parts, customCtx, false));
    } else if (combinedSubPaths.length === 0) {
        result = currentOptions.filter(p => isPathValid(p.parts, customCtx, false));
    } else {
        result = [];
        for (let i = 0; i < currentOptions.length; i++) {
            const curr = currentOptions[i];
            for (let j = 0; j < combinedSubPaths.length; j++) {
                const sub = combinedSubPaths[j];
                const combinedParts = [...curr.parts, ...sub.parts];
                if (isPathValid(combinedParts, customCtx, false)) {
                    result.push({
                        t: curr.t + " " + sub.t,
                        tr: curr.tr ? (sub.tr ? curr.tr + " " + sub.tr : curr.tr) : sub.tr,
                        parts: combinedParts,
                        details: [...(curr.details || []), ...(sub.details || [])]
                    });
                }
            }
        }
    }

    if (memo) memo.set(cacheKey, result);
    return result;
}

/* =========================
   ROUTES & CELL COMBOS MODAL LOGIC
========================= */
function openRoutesModal() {
    const pickerStatus = document.getElementById('combo-picker-status');
    if (pickerStatus) pickerStatus.style.display = 'none';

    const transInput = document.getElementById('transformations-input');
    if (transInput) {
        transInput.value = transformationsText || "";
    }

    const routesList = document.getElementById('routes-list-container');
    if (routesList) {
        routesList.innerHTML = `<p style="color:#64748b; text-align:center; padding:24px; margin:0;">⏳ Loading routes...</p>`;
    }

    document.getElementById('routes-modal').style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';

    requestAnimationFrame(() => {
        setTimeout(() => {
            renderRoutesPreviewGrid();
            switchRoutesTab('routes');
        }, 0);
    });
}

function switchRoutesTab(tab) {
    const btnRoutes = document.getElementById('tab-btn-routes');
    const btnCombos = document.getElementById('tab-btn-combos');
    const btnTransforms = document.getElementById('tab-btn-transforms');
    const contentRoutes = document.getElementById('tab-content-routes');
    const contentCombos = document.getElementById('tab-content-combos');
    const contentTransforms = document.getElementById('tab-content-transforms');

    [btnRoutes, btnCombos, btnTransforms].forEach(b => {
        if (b) { b.style.background = '#e2e8f0'; b.style.color = '#475569'; }
    });
    [contentRoutes, contentCombos, contentTransforms].forEach(c => {
        if (c) c.style.display = 'none';
    });

    if (tab === 'routes') {
        if (btnRoutes) { btnRoutes.style.background = '#8b5cf6'; btnRoutes.style.color = 'white'; }
        if (contentRoutes) contentRoutes.style.display = 'flex';
        renderRoutesList();
    } else if (tab === 'combos') {
        if (btnCombos) { btnCombos.style.background = '#8b5cf6'; btnCombos.style.color = 'white'; }
        if (contentCombos) contentCombos.style.display = 'flex';
        renderCombosLists();
    } else if (tab === 'transforms') {
        if (btnTransforms) { btnTransforms.style.background = '#8b5cf6'; btnTransforms.style.color = 'white'; }
        if (contentTransforms) contentTransforms.style.display = 'flex';
    }
}

/* =========================================================
   ROUTES PREVIEW GRID RENDERER
   CSS Grid Spanning + Full Vocab Display + Bridge Identification
   ========================================================= */
function renderRoutesPreviewGrid() {
    const container = document.getElementById('routes-mini-grid');
    if (!container) return;
    container.innerHTML = '';

    const cols = grid[0].length;
    const rows = grid.length;

    // Helper: Check if cell has no text content
    const isCellEmpty = (cell) => {
        if (!cell || !cell.items || cell.items.length === 0) return true;
        return cell.items.every(it => !it.t || it.t.trim() === "");
    };

    // Helper: Check if column is a 100% bridge/empty column
    const isColumnBridge = (colIdx) => {
        if (colIdx >= cols) return false;
        for (let rIdx = 0; rIdx < rows; rIdx++) {
            const cell = getCellAt(rIdx, colIdx);
            if (!isCellEmpty(cell)) return false;
        }
        return true;
    };

    // Build dynamic column tracks:
    // Pure bridge columns shrink to minimal width (minmax(42px, max-content))
    // Columns with text shrink to match the content in that column (minmax(max-content, 1fr))
    const colTrackSizes = [];
    for (let cIdx = 0; cIdx < cols; cIdx++) {
        if (isColumnBridge(cIdx)) {
            colTrackSizes.push('minmax(42px, max-content)');
        } else {
            colTrackSizes.push('minmax(max-content, 1fr)');
        }
    }

    container.style.display = 'grid';
    container.style.gridTemplateColumns = colTrackSizes.join(' ');
    container.style.gridTemplateRows = `repeat(${rows}, auto)`;
    container.style.gap = '6px';

    for (let r = 0; r < rows; r++) {
        for (let cIdx = 0; cIdx < cols; cIdx++) {
            const cell = grid[r][cIdx];
            if (cell.hidden) continue;

            const rSpan = cell.rS || 1;
            const cSpan = cell.cS || 1;
            const emptyCell = isCellEmpty(cell);
            const fullColBridge = isColumnBridge(cIdx);

            const validItems = (cell.items || []).filter(it => it.t && it.t.trim() !== "");
            
            let textContent = '';
            if (validItems.length > 0) {
                textContent = validItems.map(it => `
                    <div style="font-weight:600; color:#1e293b; padding:2px 0; border-bottom:1px solid #f1f5f9;">
                        ${it.t.trim()} ${it.tr ? `<span style="color:#2563eb; font-weight:normal; font-style:italic;">(${it.tr.trim()})</span>` : ''}
                    </div>
                `).join('');
            } else if (emptyCell || fullColBridge) {
                textContent = '<div style="color:#15803d; font-weight:bold; font-size:10px; text-align:center; padding:4px 0;">🌉</div>';
            }

            const cellEl = document.createElement('div');
            cellEl.className = 'mini-preview-cell';
            if (emptyCell || fullColBridge) {
                cellEl.classList.add('bridge-cell');
            }
            cellEl.id = `mini-cell-${r}-${cIdx}`;
            
            cellEl.style.gridRow = `${r + 1} / span ${rSpan}`;
            cellEl.style.gridColumn = `${cIdx + 1} / span ${cSpan}`;

            cellEl.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span class="cell-coord-badge">${r + 1}.${cIdx + 1}${rSpan > 1 || cSpan > 1 ? ` (${rSpan}x${cSpan})` : ''}</span>
                </div>
                <div style="font-size:11px; line-height:1.3; width:100%;">
                    ${textContent}
                </div>
            `;

            cellEl.onclick = () => {
                if (typeof comboPickerMode !== 'undefined' && comboPickerMode) {
                    toggleComboCellSelection(r, cIdx);
                }
            };

            container.appendChild(cellEl);
        }
    }
}

function highlightRouteCells(parts, highlight) {
    document.querySelectorAll('.mini-preview-cell').forEach(el => el.classList.remove('highlighted-route'));
    if (!highlight || !parts) return;

    parts.forEach(p => {
        const el = document.getElementById(`mini-cell-${p.r}-${p.c}`);
        if (el) el.classList.add('highlighted-route');
    });
}

function getAllRawRoutes() {
    if (!grid || !grid.length || !grid[0]) return [];

    // Collapse each cell to at most 1 sample item so route enumeration traverses cells, not every vocab line
    const cellRepresentativeGrid = grid.map(row =>
        row.map(cell => {
            if (!cell) return cell;
            const firstValid = (cell.items || []).find(it => it.t && it.t.trim() !== "" && it.t.trim().toLowerCase() !== "bridge");
            return {
                ...cell,
                items: firstValid ? [firstValid] : []
            };
        })
    );

    const routeCtx = {
        grid: cellRepresentativeGrid,
        disabledRoutes: [],
        excludedCombos: excludedCombos || [],
        requiredCombos: requiredCombos || [],
        excludedPairs: excludedPairs || [],
        transformationsText: ""
    };

    const allPaths = getAssembledSentences(routeCtx);
    const routesMap = new Map();

    allPaths.forEach(p => {
        const contentParts = p.parts.filter(pt => !pt.isBridge);
        const key = contentParts.map(pt => `${pt.r + 1}.${pt.c + 1}`).join('+');
        const label = contentParts.map(pt => `${pt.r + 1}.${pt.c + 1}`).join(' + ');
        if (!routesMap.has(key)) {
            routesMap.set(key, { key, label, parts: p.parts, sampleText: p.t });
        }
    });

    return Array.from(routesMap.values());
}

function renderRoutesList() {
    const container = document.getElementById('routes-list-container');
    const routes = getAllRawRoutes();

    if (routes.length === 0) {
        container.innerHTML = '<div style="color:#64748b; font-style:italic;">No valid routes generated yet. Fill cells in the Sentence Builder table.</div>';
        return;
    }

    container.innerHTML = routes.map((r, idx) => {
        const isChecked = !disabledRoutes.includes(r.key);
        return `
            <div class="route-item" 
                onmouseenter="highlightRouteCells([${r.parts.map(p => `{r:${p.r},c:${p.c}}`).join(',')}], true)"
                onmouseleave="highlightRouteCells(null, false)"
                style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; border-bottom:1px solid #f1f5f9; font-size:13px;">
                <div>
                    <input type="checkbox" id="chk-route-${idx}" ${isChecked ? 'checked' : ''} onchange="toggleRouteDisabled('${r.key}', this.checked)">
                    <label for="chk-route-${idx}" style="cursor:pointer; font-weight:600; margin-left:6px; color:${isChecked ? '#10b981' : '#ef4444'};">
                        ${idx + 1}) ${r.label}
                    </label>
                    <span style="color:#64748b; margin-left:10px; font-style:italic;">(${r.sampleText})</span>
                </div>
            </div>
        `;
    }).join('');
}

function toggleRouteDisabled(key, isViable) {
    if (isViable) {
        disabledRoutes = disabledRoutes.filter(k => k !== key);
    } else {
        if (!disabledRoutes.includes(key)) disabledRoutes.push(key);
    }
    renderRoutesList();
}

function selectAllRoutes(enableAll) {
    if (enableAll) {
        disabledRoutes = [];
    } else {
        disabledRoutes = getAllRawRoutes().map(r => r.key);
    }
    renderRoutesList();
}

function renderCombosLists() {
    const exList = document.getElementById('excluded-combos-list');
    const reqList = document.getElementById('required-combos-list');

    // Render Excluded Combos
    if (!excludedCombos || excludedCombos.length === 0) {
        exList.innerHTML = '<div style="color:#64748b; font-size:12px; font-style:italic;">No excluded combinations defined.</div>';
    } else {
        exList.innerHTML = excludedCombos.map((c, i) => {
            const cells = c.cells || c;
            const text = cells.map(pt => `${pt.r + 1}.${pt.c + 1}`).join(' + ');
            const partsJson = JSON.stringify(cells.map(pt => ({ r: pt.r, c: pt.c })));
            
            return `
                <div class="combo-item"
                    onmouseenter='highlightRouteCells(${partsJson}, true)'
                    onmouseleave='highlightRouteCells(null, false)'
                    style="display:flex; justify-content:space-between; align-items:center; background:white; padding:6px 10px; border-radius:4px; border:1px solid #fca5a5; margin-bottom:4px; font-size:12px; cursor:pointer; transition:background 0.15s ease;">
                    <span><b style="color:#dc2626;">Excluded:</b> ${text}</span>
                    <button onclick="event.stopPropagation(); deleteCombo('excluded', ${i}); highlightRouteCells(null, false);" style="border:none; background:transparent; cursor:pointer; color:#ef4444; font-weight:bold; padding:2px 6px;">✕</button>
                </div>
            `;
        }).join('');
    }

    // Render Required Combos
    if (!requiredCombos || requiredCombos.length === 0) {
        reqList.innerHTML = '<div style="color:#64748b; font-size:12px; font-style:italic;">No required combinations defined.</div>';
    } else {
        reqList.innerHTML = requiredCombos.map((c, i) => {
            const labelA = `${c.cellA.r + 1}.${c.cellA.c + 1}`;
            const labelB = `${c.cellB.r + 1}.${c.cellB.c + 1}`;
            const partsJson = JSON.stringify([{ r: c.cellA.r, c: c.cellA.c }, { r: c.cellB.r, c: c.cellB.c }]);
            
            return `
                <div class="combo-item"
                    onmouseenter='highlightRouteCells(${partsJson}, true)'
                    onmouseleave='highlightRouteCells(null, false)'
                    style="display:flex; justify-content:space-between; align-items:center; background:white; padding:6px 10px; border-radius:4px; border:1px solid #86efac; margin-bottom:4px; font-size:12px; cursor:pointer; transition:background 0.15s ease;">
                    <span><b style="color:#16a34a;">Required:</b> Cell ${labelA} ➔ Cell ${labelB}</span>
                    <button onclick="event.stopPropagation(); deleteCombo('required', ${i}); highlightRouteCells(null, false);" style="border:none; background:transparent; cursor:pointer; color:#ef4444; font-weight:bold; padding:2px 6px;">✕</button>
                </div>
            `;
        }).join('');
    }
}

function startComboPicker(mode) {
    comboPickerMode = mode;
    currentComboSelection = [];
    document.querySelectorAll('.mini-preview-cell').forEach(el => el.classList.remove('picker-selected'));

    const statusBanner = document.getElementById('combo-picker-status');
    const prompt = document.getElementById('combo-picker-prompt');
    statusBanner.style.display = 'block';

    if (mode === 'excluded') {
        prompt.innerText = "🚫 Click 2 or more cells in the preview table to EXCLUDE their combination:";
    } else {
        prompt.innerText = "⚠️ Click Cell 1 (if used), then click Cell 2 (must be used in route):";
    }
}

function toggleComboCellSelection(r, c) {
    const idx = currentComboSelection.findIndex(p => p.r === r && p.c === c);
    const cellEl = document.getElementById(`mini-cell-${r}-${c}`);

    if (idx > -1) {
        currentComboSelection.splice(idx, 1);
        if (cellEl) cellEl.classList.remove('picker-selected');
    } else {
        if (comboPickerMode === 'required' && currentComboSelection.length >= 2) {
            alert("Required combinations require exactly 2 cells (Cell 1 ➔ Cell 2).");
            return;
        }
        currentComboSelection.push({ r, c });
        if (cellEl) cellEl.classList.add('picker-selected');
    }
}

function saveCurrentCombo() {
    if (currentComboSelection.length < 2) {
        alert("Please select at least 2 cells to form a combination.");
        return;
    }

    if (comboPickerMode === 'excluded') {
        excludedCombos.push({ cells: [...currentComboSelection] });
    } else if (comboPickerMode === 'required') {
        requiredCombos.push({ cellA: currentComboSelection[0], cellB: currentComboSelection[1] });
    }

    cancelComboPicker();
    renderCombosLists();
}

function cancelComboPicker() {
    comboPickerMode = null;
    currentComboSelection = [];
    document.getElementById('combo-picker-status').style.display = 'none';
    document.querySelectorAll('.mini-preview-cell').forEach(el => el.classList.remove('picker-selected'));
}

function deleteCombo(type, index) {
    if (type === 'excluded') {
        excludedCombos.splice(index, 1);
    } else {
        requiredCombos.splice(index, 1);
    }
    // Clear legacy pair outlines when combo list is modified
    if (!excludedCombos || excludedCombos.length === 0) {
        excludedPairs = [];
    }
    renderCombosLists();
}

function saveRoutesAndCombos() {
    // Sync legacy pair list with active excluded combos
    if (!excludedCombos || excludedCombos.length === 0) {
        excludedPairs = [];
    }
    const transInput = document.getElementById('transformations-input');
    if (transInput) {
        transformationsText = transInput.value;
    }
    saveToCloud(true);
    closeModals();
    render();
}

function getCellAt(r, c, customGrid = null) {
    const targetGrid = customGrid || activeAssignmentGrid || grid;
    if (!targetGrid || r < 0 || r >= targetGrid.length || !targetGrid[0] || c < 0 || c >= targetGrid[0].length) return null;
    let cell = targetGrid[r][c];
    if (!cell) return null;
    if (!cell.hidden) return cell;

    for (let i = r; i >= 0; i--) {
        for (let j = c; j >= 0; j--) {
            let root = targetGrid[i] ? targetGrid[i][j] : null;
            if (root && !root.hidden && (i + (root.rS || 1) > r) && (j + (root.cS || 1) > c)) {
                return root;
            }
        }
    }
    return cell;
}

/* =========================
   CELL-SPECIFIC FAULTY TRANSLATION DISTRACTOR LOGIC
========================= */
function isEligibleForFaulty(sentence) {
    if (!sentence || !sentence.parts || sentence.parts.length === 0) return false;
    const targetGrid = activeAssignmentGrid || grid;
    return sentence.parts.some(p => {
        const cell = getCellAt(p.r, p.c, targetGrid);
        if (!cell || !cell.items) return false;
        return cell.items.filter(it => it.tr && it.tr.trim() !== "").length > 1;
    });
}

function generateFaultySentenceObj(sentence) {
    if (!sentence || !sentence.parts || sentence.parts.length === 0) return null;
    const targetGrid = activeAssignmentGrid || grid;
    const rules = activeAssignmentTransformationsText !== null ? activeAssignmentTransformationsText : (document.getElementById('transformations-input')?.value || transformationsText || "");

    const eligiblePartIndices = [];
    sentence.parts.forEach((p, idx) => {
        if (p.isBridge) return;
        const cell = getCellAt(p.r, p.c, targetGrid);
        if (cell && cell.items && cell.items.filter(it => (it.t && it.t.trim()) || (it.tr && it.tr.trim())).length > 1) {
            eligiblePartIndices.push(idx);
        }
    });

    if (eligiblePartIndices.length === 0) return null;
    const chosenIdx = eligiblePartIndices[Math.floor(Math.random() * eligiblePartIndices.length)];
    const chosenPart = sentence.parts[chosenIdx];
    const cell = getCellAt(chosenPart.r, chosenPart.c, targetGrid);

    const origTr = (chosenPart.tr || "").trim().toLowerCase();
    const origT = (chosenPart.t || "").trim().toLowerCase();
    const alternatives = (cell.items || []).filter(it => {
        const tr = (it.tr || "").trim().toLowerCase();
        const t = (it.t || "").trim().toLowerCase();
        return (tr && tr !== origTr) || (t && t !== origT);
    });

    if (alternatives.length === 0) return null;
    const faultyItem = alternatives[Math.floor(Math.random() * alternatives.length)];

    const faultyParts = sentence.parts.map((p, idx) => idx === chosenIdx ? { ...p, t: faultyItem.t || p.t, tr: faultyItem.tr || "" } : p);
    const rawFaultyTr = faultyParts.filter(p => !p.isBridge && p.tr && p.tr.trim() !== "").map(p => p.tr.trim()).join(" ");

    let faultyTr = cleanSentenceSpacing(applyTransformations(rawFaultyTr, rules));
    if (!faultyTr || faultyTr.toLowerCase() === (sentence.tr || "").toLowerCase()) {
        faultyTr = `${sentence.tr} (${(faultyItem.tr || faultyItem.t || "").trim()})`;
    }
    return { faultyTr: faultyTr };
}

function getOrGenerateFaultyTr(sentence) {
    if (!sentence) return "";
    if (sentence.faultyTr && sentence.faultyTr.trim() !== "") {
        return sentence.faultyTr.trim();
    }
    const faultyObj = generateFaultySentenceObj(sentence);
    if (faultyObj && faultyObj.faultyTr) {
        return faultyObj.faultyTr;
    }
    return sentence.tr || "";
}

/* =========================
   PER-EXERCISE COLLAPSIBLE SENTENCE BOXES
========================= */
function getCurrentSentencesMapFromDOM() {
    const map = {};
    const container = document.getElementById('per-activity-sentences-container');
    if (!container) return map;

    const cards = container.querySelectorAll('.act-card-body');
    cards.forEach(bodyEl => {
        const actId = bodyEl.getAttribute('data-activity-id');
        if (!actId) return;

        const sents = [];
        const rows = bodyEl.querySelectorAll('.act-sentence-row');
        rows.forEach(row => {
            const tInput = row.querySelector('.edit-t');
            const trInput = row.querySelector('.edit-tr');
            const faultyTrInput = row.querySelector('.edit-faulty-tr');
            if (tInput) {
                const t = tInput.value.trim();
                const tr = trInput ? trInput.value.trim() : "";
                const faultyTr = faultyTrInput ? faultyTrInput.value.trim() : "";
                if (t || tr) {
                    const itemObj = { t, tr };
                    if ((actId === 'faulty' || actId === 'listen-faulty') && faultyTr) {
                        itemObj.faultyTr = faultyTr;
                    }
                    sents.push(itemObj);
                }
            }
        });
        map[actId] = sents;
    });
    return map;
}

function refreshActivitySentences(actId, e) {
    if (e) e.stopPropagation();

    const currentMap = getCurrentSentencesMapFromDOM();
    const previousSents = currentMap[actId] || window.editingSavedSentencesMap?.[actId] || [];
    const previousTexts = new Set(
        previousSents.map(s => (s.t || '').replace(/\*/g, '').trim()).filter(Boolean)
    );

    const rawLimit = parseInt(document.getElementById('sentence-count')?.value, 10);
    const limit = (!isNaN(rawLimit) && rawLimit > 0) ? rawLimit : 10;
    const allSentences = getAssembledSentences();

    let availablePool = [...allSentences];
    if (actId === 'faulty' || actId === 'listen-faulty') {
        availablePool = availablePool.filter(isEligibleForFaulty);
    }

    // Prefer sentences not currently shown for this activity so Refresh produces a fresh set
    const freshPool = availablePool.filter(
        s => !previousTexts.has((s.t || '').replace(/\*/g, '').trim())
    );

    let nextSents = [];
    if (freshPool.length >= limit) {
        nextSents = getBalancedSelection(freshPool, limit);
    } else if (freshPool.length > 0) {
        const freshBatch = getBalancedSelection(freshPool, freshPool.length);
        const usedInBatch = new Set(freshBatch.map(s => (s.t || '').trim()));
        const remainderPool = availablePool.filter(s => !usedInBatch.has((s.t || '').trim()));
        nextSents = freshBatch.concat(getBalancedSelection(remainderPool, limit - freshBatch.length));
    } else {
        nextSents = getBalancedSelection(availablePool, limit);
    }

    const updatedMap = {
        ...(window.editingSavedSentencesMap || {}),
        ...currentMap,
        [actId]: nextSents
    };

    window.editingSavedSentencesMap = updatedMap;
    renderPerActivitySentenceBoxes(updatedMap, true);

    const body = document.getElementById(`act-body-${actId}`);
    const arrow = document.getElementById(`arrow-${actId}`);
    if (body) {
        body.style.display = 'block';
        if (arrow) arrow.innerText = '▼';
    }
}

function renderPerActivitySentenceBoxes(overrideSentencesMap = null, preserveCategoryState = false) {
    ensureGroupedActivityList();
    updateActivityCategoryCounts(Boolean(overrideSentencesMap) && !preserveCategoryState);

    const container = document.getElementById('per-activity-sentences-container');
    if (container && !container.dataset.timeEstimateBound) {
        container.addEventListener('input', () => updateAssignmentTimeEstimate());
        container.dataset.timeEstimateBound = 'true';
    }

    // Preserve currently expanded exercise cards across re-renders
    const expandedActivityIds = new Set();
    if (container) {
        container.querySelectorAll('.act-card-body').forEach(bodyEl => {
            const id = bodyEl.getAttribute('data-activity-id');
            if (id && bodyEl.style.display !== 'none') {
                expandedActivityIds.add(id);
            }
        });
    }

    const checkedBoxes = Array.from(document.querySelectorAll('#activity-list input[type="checkbox"]:checked'));

    if (checkedBoxes.length === 0) {
        container.innerHTML = '<div style="color:#64748b; font-style:italic; padding:10px;">Select at least one activity above to customize its sentences.</div>';
        updateAssignmentTimeEstimate();
        return;
    }

    if (!window.editingSavedSentencesMap || typeof window.editingSavedSentencesMap !== 'object') {
        window.editingSavedSentencesMap = {};
    }

    const isExplicitOverride = Boolean(overrideSentencesMap);
    if (isExplicitOverride) {
        window.editingSavedSentencesMap = { ...overrideSentencesMap };
    } else {
        const domMap = getCurrentSentencesMapFromDOM();
        if (Object.keys(domMap).length > 0) {
            window.editingSavedSentencesMap = {
                ...window.editingSavedSentencesMap,
                ...domMap
            };
        }
    }

    const savedMap = window.editingSavedSentencesMap;
    const rawLimit = parseInt(document.getElementById('sentence-count')?.value, 10);
    const limit = (!isNaN(rawLimit) && rawLimit > 0) ? rawLimit : 10;
    const allSentences = getAssembledSentences();

    let html = '';
    const usedSentenceTexts = new Set();

    checkedBoxes.forEach((cb) => {
        const actId = cb.value;
        if (actId === 'study') return;

        const actLabel = document.querySelector(`label[for="${cb.id}"]`)?.innerText || actId;
        let availablePool = [...allSentences];
        if (actId === 'faulty' || actId === 'listen-faulty') {
            availablePool = availablePool.filter(isEligibleForFaulty);
        }

        let actSents = [];

        if (savedMap[actId] && savedMap[actId].length > 0) {
            if (isExplicitOverride) {
                actSents = [...savedMap[actId]];
            } else if (savedMap[actId].length > limit) {
                // Trim down to match the updated Exercise Sentence Count
                actSents = savedMap[actId].slice(0, limit);
            } else if (savedMap[actId].length < limit) {
                // Keep existing sentences and top up to match the updated Exercise Sentence Count
                actSents = [...savedMap[actId]];
                const existingTexts = new Set(actSents.map(s => (s.t || '').trim()));
                const remainingNeeded = limit - actSents.length;

                const unusedPool = availablePool.filter(s =>
                    !existingTexts.has((s.t || '').trim()) &&
                    !usedSentenceTexts.has((s.t || '').trim())
                );

                if (unusedPool.length >= remainingNeeded) {
                    actSents = actSents.concat(getBalancedSelection(unusedPool, remainingNeeded));
                } else {
                    const firstBatch = getBalancedSelection(unusedPool, unusedPool.length);
                    actSents = actSents.concat(firstBatch);
                    firstBatch.forEach(s => existingTexts.add((s.t || '').trim()));

                    const stillNeeded = limit - actSents.length;
                    const fallbackPool = availablePool.filter(s => !existingTexts.has((s.t || '').trim()));
                    actSents = actSents.concat(getBalancedSelection(fallbackPool, stillNeeded));
                }
            } else {
                actSents = [...savedMap[actId]];
            }
        } else {
            let unusedPool = availablePool.filter(s => !usedSentenceTexts.has((s.t || '').trim()));

            if (unusedPool.length >= limit) {
                actSents = getBalancedSelection(unusedPool, limit);
            } else {
                actSents = getBalancedSelection(unusedPool, unusedPool.length);
                const remainingNeeded = limit - actSents.length;
                const fallbackPool = availablePool.filter(s => !actSents.some(already => (already.t || '').trim() === (s.t || '').trim()));
                actSents = actSents.concat(getBalancedSelection(fallbackPool, remainingNeeded));
            }
        }

        window.editingSavedSentencesMap[actId] = actSents;
        actSents.forEach(s => { if (s && s.t) usedSentenceTexts.add(s.t.trim()); });
        const usedGapWords = new Set();

        if ((actId === 'faulty' || actId === 'listen-faulty') && actSents.length === 0) {
            html += `
                <div class="act-sentence-card" id="act-card-${actId}">
                    <div class="act-card-header" style="background:#fee2e2;">
                        <span>⚠️ ${actLabel} (0 Eligible Sentences)</span>
                    </div>
                    <div class="act-card-body" style="display:block; color:#b91c1c;">
                        None of your grid cells contain alternative translations. Add multiple target/translation rows into grid cells to enable Faulty Translation options.
                    </div>
                </div>`;
            return;
        }

        let gapBadgeHTML = '';
        if (MULTI_GAP_ACTIVITY_IDS.includes(actId)) {
            const gapSelect = document.getElementById(`${actId}-gap-select`);
            const gapLabel = gapSelect ? (gapSelect.options[gapSelect.selectedIndex]?.text || '1 word') : '1 word';
            const badgeId = actId === 'delayed-copying' ? 'dc-card-gap-badge' : `${actId}-card-gap-badge`;
            gapBadgeHTML = `<span id="${badgeId}" style="font-size:12px; font-weight:600; color:#7c3aed; background:#ede9fe; padding:2px 8px; border-radius:10px;">(${gapLabel} removed)</span>`;
        }
        if (actId === 'beat-robot') {
            const modeSelect = document.getElementById('beat-robot-mode-select');
            const modeLabel = modeSelect ? (modeSelect.options[modeSelect.selectedIndex]?.text || 'Vowels') : 'Vowels';
            gapBadgeHTML = `<span id="beat-robot-card-mode-badge" style="font-size:12px; font-weight:600; color:#7c3aed; background:#ede9fe; padding:2px 8px; border-radius:10px;">(${modeLabel} removed)</span>`;
        }
        const isExpanded = expandedActivityIds.has(actId);

        html += `
            <div class="act-sentence-card" id="act-card-${actId}">
                <div class="act-card-header" onclick="toggleActivityCollapse('${actId}')">
                    <span style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                        ✏️ ${actLabel} (${actSents.length} Sentences)
                        ${gapBadgeHTML}
                        <button type="button" 
                            style="padding: 2px 8px; font-size: 12px; margin: 0; background: white; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; font-weight:600; color:#334155;" 
                            onclick="refreshActivitySentences('${actId}', event)" 
                            title="Refresh sentences for this activity">
                            🔄 Refresh
                        </button>
                    </span>
                    <span id="arrow-${actId}" style="font-size:14px; font-weight:bold;">${isExpanded ? '▼' : '▶'}</span>
                </div>
                <div id="act-body-${actId}" class="act-card-body" data-activity-id="${actId}" style="display:${isExpanded ? 'block' : 'none'};">
                    ${actSents.map((s, idx) => {
                       
                        if (actId === 'faulty' || actId === 'listen-faulty') {
                            const faultyVal = getOrGenerateFaultyTr(s);
                            return `
                                <div class="act-sentence-row" style="display:flex; gap:8px; margin-bottom:6px; align-items:center;">
                                    <span style="font-size:12px; font-weight:bold; color:#64748b; width:20px;">${idx + 1}.</span>
                                    <input type="text" class="edit-t" value="${(s.t||'').replace(/"/g, '&quot;')}" placeholder="Correct Target" style="flex:1; padding:5px; border:1px solid #cbd5e1; border-radius:4px; font-weight:600;">
                                    <input type="text" class="edit-faulty-tr" value="${faultyVal.replace(/"/g, '&quot;')}" placeholder="Faulty English Sentence" style="flex:1; padding:5px; border:1px solid #fca5a5; background:#fef2f2; color:#b91c1c; border-radius:4px; font-weight:600;">
                                    <input type="text" class="edit-tr" value="${(s.tr||'').replace(/"/g, '&quot;')}" placeholder="Correct English Translation (Markscheme)" style="flex:1; padding:5px; border:1px solid #a7f3d0; background:#f0fdf4; color:#065f46; border-radius:4px; font-weight:600;">
                                </div>`;
                        } else if (actId === 'gap-en' || actId === 'gap-t') {
                            const isTarget = (actId === 'gap-t');
                            const fullSentence = isTarget ? (s.t||'') : (s.tr||'');
                            const markedSentence = extractGapWord(fullSentence).fullMatch ? fullSentence : addAsteriskToGapWord(fullSentence, usedGapWords);

                            return `
                                <div class="act-sentence-row" style="display:flex; gap:8px; margin-bottom:6px; align-items:center;">
                                    <span style="font-size:12px; font-weight:bold; color:#64748b; width:20px;">${idx + 1}.</span>
                                    ${isTarget 
                                        ? `<input type="text" class="edit-t" value="${markedSentence.replace(/"/g, '&quot;')}" style="flex:1; padding:5px; border:1px solid #cbd5e1; border-radius:4px; font-weight:bold;" placeholder="Target (with *gap*)">
                                           <input type="text" class="edit-tr" value="${(s.tr||'').replace(/"/g, '&quot;')}" style="flex:1; padding:5px; border:1px solid #cbd5e1; border-radius:4px;" placeholder="English Prompt">`
                                        : `<input type="text" class="edit-t" value="${(s.t||'').replace(/"/g, '&quot;')}" style="flex:1; padding:5px; border:1px solid #cbd5e1; border-radius:4px;" placeholder="Target Prompt">
                                           <input type="text" class="edit-tr" value="${markedSentence.replace(/"/g, '&quot;')}" style="flex:1; padding:5px; border:1px solid #cbd5e1; border-radius:4px; font-weight:bold;" placeholder="English (with *gap*)">`
                                    }
                                </div>`;
                        } else {
                            return `
                                <div class="act-sentence-row" style="display:flex; gap:8px; margin-bottom:6px; align-items:center;">
                                    <span style="font-size:12px; font-weight:bold; color:#64748b; width:20px;">${idx + 1}.</span>
                                    <input type="text" class="edit-t" value="${(s.t||'').replace(/"/g, '&quot;')}" style="flex:1; padding:5px; border:1px solid #cbd5e1; border-radius:4px;" placeholder="Target Sentence">
                                    <input type="text" class="edit-tr" value="${(s.tr||'').replace(/"/g, '&quot;')}" style="flex:1; padding:5px; border:1px solid #cbd5e1; border-radius:4px;" placeholder="English Translation">
                                </div>`;
                        }
                    }).join('')}
                </div>
            </div>`;
    });

    container.innerHTML = html;
    updateAssignmentTimeEstimate();
}

function addAsteriskToGapWord(sentenceStr, usedGapWords) {
    if (!sentenceStr || extractGapWord(sentenceStr).fullMatch) return sentenceStr;

    const tokens = sentenceStr.split(' ');
    const candidates = [];

    tokens.forEach((tok, idx) => {
        const clean = tok.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').trim();
        if (clean.length >= 2 && !usedGapWords.has(clean.toLowerCase())) {
            candidates.push({ idx, clean, cleanLower: clean.toLowerCase(), orig: tok });
        }
    });

    let chosen = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
    if (!chosen) {
        tokens.forEach((tok, idx) => {
            const clean = tok.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').trim();
            if (clean.length >= 2) chosen = { idx, clean, cleanLower: clean.toLowerCase(), orig: tok };
        });
    }

    if (chosen) {
        usedGapWords.add(chosen.cleanLower);
        tokens[chosen.idx] = chosen.orig.replace(chosen.clean, `*${chosen.clean}*`);
    }

    return tokens.join(' ');
}

function toggleActivityCollapse(actId) {
    const body = document.getElementById(`act-body-${actId}`);
    const arrow = document.getElementById(`arrow-${actId}`);
    if (!body) return;

    if (body.style.display === 'none') {
        body.style.display = 'block';
        if (arrow) arrow.innerText = '▼';
    } else {
        body.style.display = 'none';
        if (arrow) arrow.innerText = '▶';
    }
}

/* =========================
   WORKSHEET GENERATOR
========================= */
function generateWorksheet() {
    var activityOrder = ['match', 'nospaces', 'jumbled', 'gap-en', 'gap-t', 'vowels', 'cons', 'faulty', 'trans-en', 'trans-target'];
    
    var docTitle = document.getElementById('builder-title')?.value || "Sentence Builder";
    var docLang = meta.lang || document.getElementById('meta-lang')?.value || "Target Language";
    var docYear = meta.year || document.getElementById('meta-year')?.value || "Year 9";

    var activityInstructions = {
        'match': 'Match each ' + docLang + ' sentence (1–10) with its correct English translation (A–J).',
        'nospaces': 'Rewrite the sentences adding correct spaces between the words.',
        'jumbled': 'Reorder the words to form correct ' + docLang + ' sentences.',
        'gap-en': 'Fill in the missing English words in the translations.',
        'gap-t': 'Fill in the missing ' + docLang + ' words in each sentence.',
        'vowels': 'Fill in the missing vowels to complete the sentences.',
        'cons': 'Fill in the missing consonants to complete the sentences.',
        'faulty': 'Find and correct the mistake in each English translation.',
        'trans-en': 'Translate the following ' + docLang + ' sentences into English.',
        'trans-target': 'Translate the following English sentences into ' + docLang + '.'
    };

    // Filter out digital-only listening & delayed activities from print
    var selected = activityOrder.filter(function(id) {
        var el = document.getElementById('chk-' + id);
        return el && el.checked && !['listen-trad', 'listen-dictation', 'delayed-dictation', 'delayed-copying', 'listen-missing', 'listen-faulty', 'listen-jumbled'].includes(id);
    });
    
    if (selected.length === 0) return alert("Select at least one printable activity!");

    var allSentences = getAssembledSentences();
    if (allSentences.length === 0) return alert("No sentences found!");

    var contentHtml = 
        '<div class="header-block">' +
            '<div class="doc-main-title">' + docTitle.toUpperCase() + ' <span class="doc-sub-info">' + docLang + ' | ' + docYear + '</span></div>' +
            '<table class="student-info-table">' +
                '<tr>' +
                    '<td><b>Name:</b> ___________________________</td>' +
                    '<td><b>Class:</b> ____________</td>' +
                    '<td><b>Date:</b> ____________</td>' +
                '</tr>' +
            '</table>' +
        '</div>';

    var answerKeyHtml = "<br clear='all' style='page-break-before:always' /><div class='answer-key-section'><table class='exercise-title-table'><tr><td><div class='ex-title'>Answer Key</div></td></tr></table>";
    var exerciseCounter = 1;

    selected.forEach(function(type) {
        var labelEl = document.querySelector('label[for="chk-' + type + '"]');
        var rawLabel = labelEl ? labelEl.innerText : type;
        var cleanLabel = rawLabel.replace(/\bTL\b/g, docLang).replace(/Target Language/gi, docLang);

        var boxTitle = "Exercise " + exerciseCounter + ": " + cleanLabel;
        exerciseCounter++;

        var textInstruction = activityInstructions[type] || "";
        var instructionMarkup = textInstruction ? ('<div class="ex-instruction">' + textInstruction + '</div>') : '';

        var activityHtml = 
            '<div class="activity-container">' +
                '<table class="exercise-title-table">' +
                    '<tr>' +
                        '<td>' +
                            '<div class="ex-title">' + boxTitle + '</div>' +
                            instructionMarkup +
                        '</td>' +
                    '</tr>' +
                '</table>';

        var currentSents = [];
        var bodyEl = document.getElementById('act-body-' + type);
        if (bodyEl) {
            var rows = bodyEl.querySelectorAll('.act-sentence-row');
            var targets = rows.length > 0 ? rows : bodyEl.children;
            Array.from(targets).forEach(function(row) {
                var tInput = row.querySelector('.edit-t');
                var trInput = row.querySelector('.edit-tr');
                var faultyTrInput = row.querySelector('.edit-faulty-tr');
                if (tInput) {
                    var t = tInput.value.trim();
                    var tr = trInput ? trInput.value.trim() : "";
                    var faultyTr = faultyTrInput ? faultyTrInput.value.trim() : "";
                    if (t || tr) {
                        var itemObj = { t: t, tr: tr };
                        if (type === 'faulty' && faultyTr) {
                            itemObj.faultyTr = faultyTr;
                        }
                        currentSents.push(itemObj);
                    }
                }
            });
        }
        if (currentSents.length === 0) {
            var countDropdown = document.getElementById('sentence-count');
            var chosenLimit = countDropdown ? parseInt(countDropdown.value, 10) : 10;
            currentSents = getBalancedSelection(allSentences, chosenLimit);
        }

        var activityAnswersHtml = '<div class="ak-group"><h3>' + boxTitle + '</h3><ol class="answer-list">';
        var usedGapWords = new Set();

        if (type === 'match') {
            var shuf = shuffleArray(currentSents);
            activityHtml += '<table class="match-table">';
            currentSents.forEach(function(s, i) {
                activityHtml += '<tr>' +
                    '<td style="width:45%; padding: 3pt 0;"><b>' + (i+1) + '.</b> ' + s.t + '</td>' +
                    '<td style="width:10%; text-align:center; padding: 3pt 0;">[ &nbsp; ]</td>' +
                    '<td style="width:45%; padding: 3pt 0;"><b>' + String.fromCharCode(65+i) + '.</b> ' + shuf[i].tr + '</td>' +
                '</tr>';
                
                var matchIndex = shuf.indexOf(s);
                var correctLetter = String.fromCharCode(65 + (matchIndex >= 0 ? matchIndex : 0));
                activityAnswersHtml += '<li>' + correctLetter + '</li>';
            });
            activityHtml += '</table>';
        } else {
            var needsWritingLine = ['nospaces', 'jumbled', 'faulty', 'trans-en', 'trans-target'].includes(type);

            currentSents.forEach(function(s, i) {
                var out = s.t, hint = '<span class="blue">(' + s.tr + ')</span>';
                var answerText = s.t; 
                
                if (type === 'vowels' || type === 'cons') {
                    var pattern = (type === 'vowels') ? /[aeiouáéíóúàèìòùâêîôûäëïöüÿ]/gi : /[bcdfghjklmnpqrstvwxyzßçñ]/gi;
                    out = s.t.split(' ').map(function(word) { return word.replace(pattern, ' __ '); }).join('&nbsp;&nbsp;');
                }
                else if (type === 'nospaces') {
                    out = s.t.replace(/\s+/g, '').toLowerCase();
                }
                else if (type === 'jumbled') {
                    out = shuffleArray(s.t.split(' ')).join(' / ');
                }
                else if (type === 'gap-t') { 
                    var rawTarget = s.t;
                    if (!extractGapWord(rawTarget).fullMatch) {
                        rawTarget = addAsteriskToGapWord(rawTarget, usedGapWords);
                    }
                    var gapRes = extractGapWord(rawTarget);
                    if (gapRes.fullMatch) {
                        out = rawTarget.replace(gapRes.fullMatch, '___________');
                    } else {
                        var words = rawTarget.split(' ');
                        var targetIdx = Math.floor(words.length / 2);
                        words[targetIdx] = '___________';
                        out = words.join(' ');
                    }
                    answerText = rawTarget.replace(/\*/g, '');
                }
                else if (type === 'gap-en') { 
                    out = s.t; 
                    var rawEnglish = s.tr;
                    if (!extractGapWord(rawEnglish).fullMatch) {
                        rawEnglish = addAsteriskToGapWord(rawEnglish, usedGapWords);
                    }
                    var gapResEn = extractGapWord(rawEnglish);
                    var maskedTr = rawEnglish;
                    if (gapResEn.fullMatch) {
                        maskedTr = rawEnglish.replace(gapResEn.fullMatch, '___________');
                    } else {
                        var wordsEn = rawEnglish.split(' ');
                        var targetIdxEn = Math.floor(wordsEn.length / 2);
                        wordsEn[targetIdxEn] = '___________';
                        maskedTr = wordsEn.join(' ');
                    }
                    hint = '<span class="blue">(' + maskedTr + ')</span>'; 
                    answerText = rawEnglish.replace(/\*/g, ''); 
                }
                else if (type === 'trans-en') { 
                    out = s.t; 
                    hint = ""; 
                    answerText = s.tr; 
                }
                else if (type === 'trans-target') { 
                    out = '<span class="blue">' + s.tr + '</span>'; 
                    hint = ""; 
                }
                else if (type === 'faulty') {
                    var faultyEnglish = s.faultyTr || s.tr; 
                    activityHtml += 
                        '<div class="exercise-item-wrapper">' +
                            '<p class="exercise-item"><b>' + (i+1) + '.</b> ' + s.t + ' = <span class="blue">' + faultyEnglish + '</span></p>' +
                            '<p class="writing-line">&nbsp;</p>' +
                        '</div>';
                    activityAnswersHtml += '<li>' + s.t + ' = <span class="blue">' + s.tr + '</span></li>';
                    return;
                }
                
                activityHtml += 
                    '<div class="exercise-item-wrapper">' +
                        '<p class="exercise-item"><b>' + (i+1) + '.</b> ' + out + ' ' + hint + '</p>' +
                        (needsWritingLine ? '<p class="writing-line">&nbsp;</p>' : '') +
                    '</div>';
                activityAnswersHtml += '<li>' + answerText + '</li>';
            });
        }
        activityHtml += '</div>';
        contentHtml += activityHtml;

        activityAnswersHtml += '</ol></div>';
        answerKeyHtml += activityAnswersHtml;
    });

    answerKeyHtml += '</div>'; 
    contentHtml += answerKeyHtml; 

    var fullDoc = 
        '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
        '<head>' +
        '<meta charset="utf-8">' +
        '<!--[if gte mso 9]>' +
        '<xml>' +
         '<w:WordDocument>' +
          '<w:View>Print</w:View>' +
          '<w:Zoom>100</w:Zoom>' +
         '</w:WordDocument>' +
        '</xml>' +
        '<![endif]-->' +
        '<style>' +
            '@page { size: A4 portrait; margin: 2cm; } ' +
            'body { font-family: "Segoe UI", Arial, sans-serif; font-size: 12pt; color: #1e293b; line-height: 1.35; } ' +
            'p { margin: 0; padding: 0; } ' +

            '.header-block { margin-bottom: 16pt; } ' +
            '.doc-main-title { font-size: 16pt; font-weight: bold; text-transform: uppercase; color: #0f172a; margin-bottom: 8pt; } ' +
            '.doc-sub-info { font-size: 11pt; font-weight: normal; text-transform: none; color: #64748b; margin-left: 10px; } ' +
            '.student-info-table { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin-top: 6pt; background-color: #fafafa; } ' +
            '.student-info-table td { border: 1px solid #cbd5e1; padding: 5pt 10pt; font-size: 10pt; font-weight: normal; color: #334155; } ' +

            '.exercise-title-table { width: 100%; border-collapse: collapse; margin-top: 14pt; margin-bottom: 10pt; } ' +
            '.exercise-title-table td { background-color: #f8fafc; border-left: 4px solid #8b5cf6; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 6pt 10pt; mso-para-margin: 0pt !important; } ' +
            '.ex-title { font-size: 12pt; font-weight: bold; color: #1e293b; margin: 0; padding: 0; mso-para-margin: 0pt !important; } ' +
            '.ex-instruction { font-size: 10pt; font-style: italic; color: #64748b; margin-top: 3pt; padding: 0; mso-para-margin: 0pt !important; } ' +

            '.activity-container { page-break-inside: avoid; margin-bottom: 16pt; } ' +
            '.exercise-item-wrapper { margin-bottom: 14pt; page-break-inside: avoid; } ' +
            '.exercise-item { font-size: 12pt; margin: 0; padding: 0; color: #0f172a; line-height: 1.35; mso-para-margin: 0pt; } ' +
            
            '.writing-line { border-bottom: 1pt solid #94a3b8; font-size: 1pt; line-height: 1pt; margin-top: 16pt !important; margin-bottom: 4pt !important; mso-para-margin-top: 16pt !important; mso-para-margin-bottom: 4pt !important; } ' +

            '.match-table { width: 100%; border-collapse: collapse; margin-bottom: 10pt; font-size: 12pt; } ' +
            '.match-table td { font-size: 12pt; border-bottom: 0.5pt solid #f1f5f9; } ' +

            '.answer-key-section { font-size: 10pt; } ' +
            '.ak-group { margin-bottom: 10pt; } ' +
            '.ak-group h3 { font-size: 10pt; font-weight: bold; margin-bottom: 3pt; margin-top: 6pt; color: #334155; } ' +
            '.answer-list { margin: 0; padding-left: 20px; font-size: 10pt; line-height: 1.25; } ' +
            '.answer-list li { font-size: 10pt; margin-bottom: 2pt; } ' +

            '.blue { color: #2980b9; font-style: italic; } ' +
        '</style>' +
        '</head>' +
        '<body>' + contentHtml + '</body>' +
        '</html>';
    
    saveAs(new Blob(['\ufeff', fullDoc], { type: 'application/msword' }), docTitle + '_Worksheet.doc');
    closeModals();
}

/* =========================
   GOOGLE CLASSROOM STUDENT SELECTOR, ASSIGNMENT PUBLISHING & EDITING
========================= */
window.gcCourseStudentsState = {
    courseId: null,
    students: [],
    selectedIds: new Set(),
    isLoading: false,
    isOpen: false,
    loadToken: 0
};

function escapeStudentAttr(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function ensureCourseStudentSelectorUI() {
    const assignFields = document.getElementById('classroom-assign-fields');
    const courseSelect = document.getElementById('gc-course-select');
    if (!assignFields || !courseSelect) return null;

    if (!courseSelect.dataset.studentSelectorBound) {
        courseSelect.addEventListener('change', (e) => {
            loadCourseStudents(e.target.value);
        });
        courseSelect.dataset.studentSelectorBound = 'true';
    }

    let wrapper = document.getElementById('gc-student-selector-wrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'gc-student-selector-wrapper';
        wrapper.style.cssText = 'display:none; margin:8px 0; width:100%; box-sizing:border-box;';
        wrapper.innerHTML = `
            <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:4px;">Assign to:</label>
            <button type="button" id="gc-student-toggle-btn" onclick="toggleGcStudentDropdown()"
                style="width:100%; box-sizing:border-box; display:flex; align-items:center; justify-content:space-between; gap:6px; padding:7px 10px; background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; font-size:12px; font-weight:600; color:#1e293b; cursor:pointer; text-align:left;">
                <span id="gc-student-toggle-label" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">👥 All students</span>
                <span id="gc-student-toggle-chevron" style="font-size:10px; color:#64748b; flex-shrink:0;">▼</span>
            </button>
            <div id="gc-student-dropdown-panel" style="display:none; margin-top:4px; background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; box-shadow:0 4px 12px rgba(15,23,42,0.08); overflow:hidden;">
                <div style="padding:6px; border-bottom:1px solid #e2e8f0; background:#f8fafc;">
                    <input type="text" id="gc-student-search-input" placeholder="Search student..."
                        oninput="renderGcStudentChecklist()"
                        style="width:100%; box-sizing:border-box; padding:4px 7px; font-size:11px; border:1px solid #cbd5e1; border-radius:4px; outline:none;">
                </div>
                <label style="display:flex; align-items:center; gap:7px; padding:7px 8px; border-bottom:1px solid #e2e8f0; background:#f1f5f9; font-size:12px; font-weight:700; color:#0f172a; cursor:pointer; margin:0;">
                    <input type="checkbox" id="gc-student-select-all" onchange="toggleAllGcStudents(this.checked)"
                        style="width:14px; height:14px; margin:0; accent-color:#2563eb; cursor:pointer; flex-shrink:0;">
                    <span>All students</span>
                </label>
                <div id="gc-student-checklist" style="max-height:175px; overflow-y:auto; padding:2px 0;"></div>
            </div>
        `;

        let anchorEl = courseSelect;
        while (anchorEl && anchorEl.parentElement && anchorEl.parentElement !== assignFields) {
            anchorEl = anchorEl.parentElement;
        }
        if (anchorEl && anchorEl.parentElement === assignFields) {
            anchorEl.insertAdjacentElement('afterend', wrapper);
        } else {
            courseSelect.insertAdjacentElement('afterend', wrapper);
        }
    }

    return wrapper;
}

function resetCourseStudentSelector() {
    const prevToken = (window.gcCourseStudentsState && window.gcCourseStudentsState.loadToken) || 0;
    window.gcCourseStudentsState = {
        courseId: null,
        students: [],
        selectedIds: new Set(),
        isLoading: false,
        isOpen: false,
        loadToken: prevToken + 1
    };
    const wrapper = document.getElementById('gc-student-selector-wrapper');
    const panel = document.getElementById('gc-student-dropdown-panel');
    const searchInput = document.getElementById('gc-student-search-input');
    if (searchInput) searchInput.value = '';
    if (panel) panel.style.display = 'none';
    if (wrapper) wrapper.style.display = 'none';
}

function toggleGcStudentDropdown(forceOpen = null) {
    const panel = document.getElementById('gc-student-dropdown-panel');
    const chevron = document.getElementById('gc-student-toggle-chevron');
    if (!panel) return;

    const shouldOpen = forceOpen !== null ? forceOpen : (panel.style.display === 'none');
    window.gcCourseStudentsState.isOpen = shouldOpen;
    panel.style.display = shouldOpen ? 'block' : 'none';
    if (chevron) chevron.textContent = shouldOpen ? '▲' : '▼';

    if (shouldOpen) {
        const searchInput = document.getElementById('gc-student-search-input');
        if (searchInput) setTimeout(() => searchInput.focus(), 20);
    }
}

function updateGcStudentToggleSummary() {
    const state = window.gcCourseStudentsState;
    const labelEl = document.getElementById('gc-student-toggle-label');
    const toggleBtn = document.getElementById('gc-student-toggle-btn');
    const selectAllCb = document.getElementById('gc-student-select-all');
    if (!labelEl) return;

    const total = state.students.length;
    const selectedCount = state.selectedIds.size;

    if (state.isLoading) {
        labelEl.textContent = '⏳ Loading students...';
        if (toggleBtn) toggleBtn.style.borderColor = '#cbd5e1';
        return;
    }

    if (total === 0) {
        labelEl.textContent = 'No students in course';
        if (toggleBtn) toggleBtn.style.borderColor = '#cbd5e1';
        if (selectAllCb) {
            selectAllCb.checked = false;
            selectAllCb.indeterminate = false;
        }
        return;
    }

    if (selectedCount === 0) {
        labelEl.textContent = '⚠️ 0 students selected';
        if (toggleBtn) toggleBtn.style.borderColor = '#ef4444';
    } else if (selectedCount === total) {
        labelEl.textContent = `👥 All students (${total})`;
        if (toggleBtn) toggleBtn.style.borderColor = '#cbd5e1';
    } else {
        labelEl.textContent = `👤 ${selectedCount} of ${total} student${selectedCount === 1 ? '' : 's'}`;
        if (toggleBtn) toggleBtn.style.borderColor = '#2563eb';
    }

    if (selectAllCb) {
        selectAllCb.checked = (selectedCount === total);
        selectAllCb.indeterminate = (selectedCount > 0 && selectedCount < total);
    }
}

function renderGcStudentChecklist() {
    const state = window.gcCourseStudentsState;
    const listEl = document.getElementById('gc-student-checklist');
    if (!listEl) return;

    const query = (document.getElementById('gc-student-search-input')?.value || '').trim().toLowerCase();
    const filtered = query
        ? state.students.filter(s =>
            s.fullName.toLowerCase().includes(query) ||
            s.email.toLowerCase().includes(query)
        )
        : state.students;

    if (filtered.length === 0) {
        listEl.innerHTML = `<div style="padding:8px; font-size:11px; color:#64748b; text-align:center;">No matching students</div>`;
        updateGcStudentToggleSummary();
        return;
    }

    listEl.innerHTML = filtered.map(st => {
        const isChecked = state.selectedIds.has(st.userId);
        return `
            <label title="${escapeStudentAttr(st.email)}"
                style="display:flex; align-items:center; gap:7px; padding:5px 8px; border-bottom:1px solid #f1f5f9; font-size:12px; color:#1e293b; cursor:pointer; margin:0; background:${isChecked ? '#eff6ff' : '#ffffff'};">
                <input type="checkbox" value="${escapeStudentAttr(st.userId)}" ${isChecked ? 'checked' : ''}
                    onchange="toggleSingleGcStudent('${escapeStudentAttr(st.userId)}', this.checked)"
                    style="width:14px; height:14px; margin:0; accent-color:#2563eb; cursor:pointer; flex-shrink:0;">
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">${escapeStudentAttr(st.fullName)}</span>
            </label>
        `;
    }).join('');

    updateGcStudentToggleSummary();
}

function toggleSingleGcStudent(userId, isChecked) {
    const state = window.gcCourseStudentsState;
    if (isChecked) {
        state.selectedIds.add(userId);
    } else {
        state.selectedIds.delete(userId);
    }
    renderGcStudentChecklist();
}

function toggleAllGcStudents(selectAll) {
    const state = window.gcCourseStudentsState;
    if (selectAll) {
        state.selectedIds = new Set(state.students.map(s => s.userId));
    } else {
        state.selectedIds.clear();
    }
    renderGcStudentChecklist();
}

async function loadCourseStudents(courseId, preselectAssign = null) {
    const wrapper = ensureCourseStudentSelectorUI();
    if (!wrapper) return;

    if (!courseId) {
        resetCourseStudentSelector();
        return;
    }

    // Avoid duplicate concurrent fetch if already loaded for this course and no preselection override is passed
    if (
        !preselectAssign &&
        window.gcCourseStudentsState.courseId === courseId &&
        (window.gcCourseStudentsState.isLoading || window.gcCourseStudentsState.students.length > 0)
    ) {
        wrapper.style.display = 'block';
        return;
    }

    const requestToken = ((window.gcCourseStudentsState && window.gcCourseStudentsState.loadToken) || 0) + 1;

    wrapper.style.display = 'block';
    window.gcCourseStudentsState = {
        courseId,
        students: [],
        selectedIds: new Set(),
        isLoading: true,
        isOpen: false,
        loadToken: requestToken
    };
    updateGcStudentToggleSummary();

    const listEl = document.getElementById('gc-student-checklist');
    if (listEl) listEl.innerHTML = `<div style="padding:8px; font-size:11px; color:#64748b; text-align:center;">Loading roster...</div>`;

    try {
        await ensureGapiClassroomLoaded();

        let allRawStudents = [];
        let pageToken = null;
        do {
            const params = { courseId, pageSize: 100 };
            if (pageToken) params.pageToken = pageToken;
            const res = await gapi.client.classroom.courses.students.list(params);
            if (window.gcCourseStudentsState.loadToken !== requestToken) return;
            allRawStudents = allRawStudents.concat(res.result.students || []);
            pageToken = res.result.nextPageToken || null;
        } while (pageToken);

        if (window.gcCourseStudentsState.loadToken !== requestToken) return;

        const normalized = allRawStudents.map(st => {
            const profile = st.profile || {};
            const nameObj = profile.name || {};
            const fullName = nameObj.fullName || profile.emailAddress || st.userId;
            const sortKey = `${nameObj.familyName || ''} ${nameObj.givenName || fullName}`.trim().toLowerCase();
            return {
                userId: String(st.userId),
                fullName,
                sortKey,
                email: (profile.emailAddress || '').toLowerCase()
            };
        }).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

        let selectedIds;
        if (preselectAssign && preselectAssign.assigneeMode === 'INDIVIDUAL_STUDENTS') {
            const savedIds = new Set((preselectAssign.assignedStudentIds || []).map(String));
            const savedEmails = new Set((preselectAssign.assignedStudentEmails || []).map(e => e.toLowerCase()));
            selectedIds = new Set(
                normalized
                    .filter(s => savedIds.has(s.userId) || (s.email && savedEmails.has(s.email)))
                    .map(s => s.userId)
            );
        } else {
            selectedIds = new Set(normalized.map(s => s.userId));
        }

        window.gcCourseStudentsState = {
            courseId,
            students: normalized,
            selectedIds,
            isLoading: false,
            isOpen: false,
            loadToken: requestToken
        };

        renderGcStudentChecklist();

        if (preselectAssign && preselectAssign.assigneeMode === 'INDIVIDUAL_STUDENTS') {
            toggleGcStudentDropdown(true);
        } else {
            toggleGcStudentDropdown(false);
        }
    } catch (err) {
        if (window.gcCourseStudentsState.loadToken !== requestToken) return;
        console.warn("Could not load course students:", err);
        window.gcCourseStudentsState.isLoading = false;
        const labelEl = document.getElementById('gc-student-toggle-label');
        if (labelEl) labelEl.textContent = '⚠️ Could not load students';
    }
}

async function openClassroomPublishSection() {
    const assignFields = document.getElementById('classroom-assign-fields');
    assignFields.style.display = 'block';

    ensureCourseStudentSelectorUI();
    resetCourseStudentSelector();

    // Smooth scroll only the right panel container
    if (assignFields.parentElement) {
        assignFields.parentElement.scrollTo({ top: assignFields.parentElement.scrollHeight, behavior: 'smooth' });
    }

    try {
        let isLoaded = await ensureGapiClassroomLoaded();
        if (!isLoaded) {
            alert("Google Classroom API could not be loaded.");
            return;
        }

        const select = document.getElementById('gc-course-select');
        select.innerHTML = '<option value="">Loading courses...</option>';

        let res;
        try {
            res = await gapi.client.classroom.courses.list({ teacherId: 'me', courseStates: ['ACTIVE'] });
        } catch (authErr) {
            console.warn("Classroom API rejected current token, requesting account selection...", authErr);
            localStorage.removeItem('oauth_token');
            localStorage.removeItem('oauth_token_expiry');
            await ensureClassroomToken(true);
            res = await gapi.client.classroom.courses.list({ teacherId: 'me', courseStates: ['ACTIVE'] });
        }

        const courses = res.result.courses || [];

        if (courses.length === 0) {
            select.innerHTML = '<option value="">No active Google Classroom courses found.</option>';
            return;
        }

        select.innerHTML = '<option value="">-- Choose Course --</option>' + 
            courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    } catch (err) {
        console.error("Classroom Error:", err);
        alert("Classroom Connection Error: " + (err.message || "Failed to load Google Classroom courses."));
    }
}

async function loadCourseTopics(courseId) {
    if (!courseId) {
        resetCourseStudentSelector();
        return;
    }

    // Trigger student roster load in parallel whenever a course is selected
    loadCourseStudents(courseId);

    try {
        await ensureGapiClassroomLoaded();
        const res = await gapi.client.classroom.courses.topics.list({ courseId: courseId });
        const topics = res.result.topic || [];
        const select = document.getElementById('gc-topic-select');
        if (!select) return;
        select.innerHTML = '<option value="">-- No Topic --</option>' + 
            topics.map(t => `<option value="${t.topicId}">${t.name}</option>`).join('');
    } catch (e) {
        console.warn("Topic error:", e);
    }
}

async function publishTaskToClassroom() {
    const courseSelect = document.getElementById('gc-course-select');
    const courseId = courseSelect?.value;
    const courseName = courseSelect?.options?.[courseSelect.selectedIndex]?.text || '';

    if (!courseId) return alert("Select a Google Classroom course.");

    // Validate selected students from the course roster
    const studentState = window.gcCourseStudentsState || { students: [], selectedIds: new Set() };
    const totalStudents = studentState.students.length;
    const selectedStudentIds = Array.from(studentState.selectedIds);

    if (totalStudents > 0 && selectedStudentIds.length === 0) {
        toggleGcStudentDropdown(true);
        return alert("Please select at least one student to assign this task to.");
    }

    const isIndividual = totalStudents > 0 && selectedStudentIds.length < totalStudents;
    const assigneeMode = isIndividual ? 'INDIVIDUAL_STUDENTS' : 'ALL_STUDENTS';
    const selectedStudentEmails = isIndividual
        ? studentState.students
            .filter(s => studentState.selectedIds.has(s.userId) && s.email)
            .map(s => s.email)
        : [];

    const selectedActivities = Array.from(document.querySelectorAll('#activity-list input[type="checkbox"]:checked'))
        .map(c => c.value)
        .filter(id => id !== 'study');
    if (selectedActivities.length === 0) return alert("Select at least one activity!");

    const listenTradGapLevel = selectedActivities.includes('listen-trad')
        ? (document.getElementById('listen-trad-gap-select')?.value || '1')
        : '1';
    const listenDictationGapLevel = selectedActivities.includes('listen-dictation')
        ? (document.getElementById('listen-dictation-gap-select')?.value || '1')
        : '1';
    const delayedDictationGapLevel = selectedActivities.includes('delayed-dictation')
        ? (document.getElementById('delayed-dictation-gap-select')?.value || '1')
        : '1';
    const delayedCopyingGapLevel = selectedActivities.includes('delayed-copying')
        ? (document.getElementById('delayed-copying-gap-select')?.value || '1')
        : '1';
    const beatRobotMode = selectedActivities.includes('beat-robot')
        ? (document.getElementById('beat-robot-mode-select')?.value || 'vowels')
        : 'vowels';
    const beatRobotSpeed = '1500';
    const activityGapLevels = {
        'listen-trad': listenTradGapLevel,
        'listen-dictation': listenDictationGapLevel,
        'delayed-dictation': delayedDictationGapLevel,
        'delayed-copying': delayedCopyingGapLevel
    };
    const allSentences = getAssembledSentences();

    const structuredSentencesPerActivity = {};
    let totalSentencesCount = 0;

    selectedActivities.forEach(actId => {
        const bodyEl = document.getElementById(`act-body-${actId}`);
        const sents = [];
        if (bodyEl) {
            const rows = bodyEl.querySelectorAll('.act-sentence-row');
            const targets = rows.length > 0 ? rows : bodyEl.children;
            Array.from(targets).forEach(row => {
                const tInput = row.querySelector('.edit-t');
                const trInput = row.querySelector('.edit-tr');
                const faultyTrInput = row.querySelector('.edit-faulty-tr');
                if (tInput) {
                    const t = tInput.value.trim();
                    const tr = trInput ? trInput.value.trim() : "";
                    const faultyTr = faultyTrInput ? faultyTrInput.value.trim() : "";
                    if (t || tr) {
                        const itemObj = { t, tr: tr };
                        if ((actId === 'faulty' || actId === 'listen-faulty') && faultyTr) {
                            itemObj.faultyTr = faultyTr;
                        }
                        sents.push(itemObj);
                    }
                }
            });
        }

        if (sents.length > 0) {
            structuredSentencesPerActivity[actId] = sents;
            totalSentencesCount += sents.length;
        } else if (window.editingSavedSentencesMap && window.editingSavedSentencesMap[actId] && window.editingSavedSentencesMap[actId].length > 0) {
            // Preserve exact duplicated sentences without re-shuffling from grid
            structuredSentencesPerActivity[actId] = window.editingSavedSentencesMap[actId];
            totalSentencesCount += window.editingSavedSentencesMap[actId].length;
        } else {
            const exerciseLimit = parseInt(document.getElementById('sentence-count')?.value, 10) || 10;
            const pool = (actId === 'faulty' || actId === 'listen-faulty')
                ? allSentences.filter(isEligibleForFaulty)
                : allSentences;
            structuredSentencesPerActivity[actId] = getBalancedSelection(pool, exerciseLimit);
            totalSentencesCount += structuredSentencesPerActivity[actId].length;
        }
    });

    const title = document.getElementById('builder-title')?.value || "Sentence Practice";
    const maxPoints = totalSentencesCount * 1;
    const dueDateVal = document.getElementById('gc-due-date')?.value || "";
    const scheduleDateVal = document.getElementById('gc-schedule-date')?.value || "";
    const topicId = document.getElementById('gc-topic-select')?.value || "";

    let gcDueDate = null, gcDueTime = null;
    if (dueDateVal) {
        const dateObj = new Date(dueDateVal);
        gcDueDate = { year: dateObj.getFullYear(), month: dateObj.getMonth() + 1, day: dateObj.getDate() };
        gcDueTime = { hours: dateObj.getHours(), minutes: dateObj.getMinutes(), seconds: 0, nanos: 0 };
    }

    let gcScheduledTime = null;
    if (scheduleDateVal) {
        gcScheduledTime = new Date(scheduleDateVal).toISOString();
    }

    // Builder binding & snapshot payload
    const targetBuilderId = activeAssignmentBuilderId || currentDocId || null;
    const builderSnapshot = {
        grid: JSON.stringify(activeAssignmentGrid || grid),
        disabledRoutes: activeAssignmentDisabledRoutes || disabledRoutes || [],
        excludedCombos: activeAssignmentExcludedCombos || excludedCombos || [],
        requiredCombos: activeAssignmentRequiredCombos || requiredCombos || [],
        excludedPairs: activeAssignmentExcludedPairs || excludedPairs || [],
        transformationsText: activeAssignmentTransformationsText || transformationsText || ""
    };

    await ensureGapiClassroomLoaded();

    if (editingAssignmentId) {
        try {
            const assignDoc = await db.collection("assignments").doc(editingAssignmentId).get();
            const existingData = assignDoc.data();

            const updatePayload = {
                title: title,
                builderId: targetBuilderId,
                builderSnapshot: builderSnapshot,
                assigneeMode: assigneeMode,
                assignedStudentIds: isIndividual ? selectedStudentIds : [],
                assignedStudentEmails: isIndividual ? selectedStudentEmails : [],
                selectedActivities: selectedActivities,
                listenTradGapLevel: listenTradGapLevel,
                listenDictationGapLevel: listenDictationGapLevel,
                delayedDictationGapLevel: delayedDictationGapLevel,
                delayedCopyingGapLevel: delayedCopyingGapLevel,
                activityGapLevels: activityGapLevels,
                beatRobotMode: beatRobotMode,
                beatRobotSpeed: beatRobotSpeed,
                sentencesPerActivity: structuredSentencesPerActivity,
                maxPoints: maxPoints > 0 ? maxPoints : 10,
                dueDate: dueDateVal ? new Date(dueDateVal).toISOString() : null,
                scheduleDate: scheduleDateVal ? new Date(scheduleDateVal).toISOString() : null,
                topicId: topicId || null,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection("assignments").doc(editingAssignmentId).update(updatePayload);

            if (existingData && existingData.gClassroomAssignmentId && existingData.courseId) {
                const cwPatch = { title: `🧩 ${title}`, maxPoints: maxPoints > 0 ? maxPoints : 10 };
                const updateMasks = ["title", "maxPoints"];

                if (gcDueDate && gcDueTime) {
                    cwPatch.dueDate = gcDueDate;
                    cwPatch.dueTime = gcDueTime;
                    updateMasks.push("dueDate", "dueTime");
                }

                if (gcScheduledTime) {
                    cwPatch.scheduledTime = gcScheduledTime;
                    updateMasks.push("scheduledTime");
                }

                if (topicId) {
                    cwPatch.topicId = topicId;
                    updateMasks.push("topicId");
                }

                await gapi.client.classroom.courses.courseWork.patch({
                    courseId: existingData.courseId,
                    id: existingData.gClassroomAssignmentId,
                    updateMask: updateMasks.join(","),
                    resource: cwPatch
                });

                // Sync individual student assignees in Google Classroom when changed
                const prevMode = existingData.assigneeMode || 'ALL_STUDENTS';
                const prevIds = (existingData.assignedStudentIds || []).map(String);
                const addStudentIds = assigneeMode === 'INDIVIDUAL_STUDENTS'
                    ? selectedStudentIds.filter(id => !prevIds.includes(id))
                    : [];
                const removeStudentIds = assigneeMode === 'INDIVIDUAL_STUDENTS'
                    ? prevIds.filter(id => !selectedStudentIds.includes(id))
                    : [];

                const shouldModifyAssignees =
                    prevMode !== assigneeMode ||
                    addStudentIds.length > 0 ||
                    removeStudentIds.length > 0;

                if (shouldModifyAssignees) {
                    const modifyResource = { assigneeMode };
                    if (assigneeMode === 'INDIVIDUAL_STUDENTS') {
                        modifyResource.modifyIndividualStudentsOptions = {
                            addStudentIds,
                            removeStudentIds
                        };
                    }

                    await gapi.client.classroom.courses.courseWork.modifyAssignees({
                        courseId: existingData.courseId,
                        id: existingData.gClassroomAssignmentId,
                        resource: modifyResource
                    });
                }
            }

            alert("✅ Assignment updated and synced with Google Classroom!");
            editingAssignmentId = null;
            closeModals();
            renderStudentSubmissionsTable();
            return;
        } catch (e) {
            alert("Error updating assignment: " + e.message);
            return;
        }
    }

    try {
        const assignmentRef = db.collection("assignments").doc();
        const assignmentId = assignmentRef.id;
        const studentUrl = `${window.location.origin}${window.location.pathname}?assignmentId=${assignmentId}`;

        const cwPayload = {
            title: `🧩 ${title}`,
            description: `Use the link below to complete the interactive tasks. Make sure to log in using your school Google account`,
            workType: 'ASSIGNMENT',
            maxPoints: maxPoints > 0 ? maxPoints : 10,
            assigneeMode: assigneeMode,
            materials: [{ link: { url: studentUrl, title: "Interactive Sentence Task" } }]
        };

        if (isIndividual) {
            cwPayload.individualStudentsOptions = { studentIds: selectedStudentIds };
        }

        if (gcDueDate && gcDueTime) {
            cwPayload.dueDate = gcDueDate;
            cwPayload.dueTime = gcDueTime;
        }

        if (topicId) cwPayload.topicId = topicId;

        if (gcScheduledTime) {
            cwPayload.scheduledTime = gcScheduledTime;
            cwPayload.state = 'DRAFT';
        } else {
            cwPayload.state = 'PUBLISHED';
        }

        const res = await gapi.client.classroom.courses.courseWork.create({ courseId: courseId, resource: cwPayload });

        if (!gcScheduledTime) {
            await gapi.client.classroom.courses.courseWork.patch({
                courseId: courseId, id: res.result.id, updateMask: "state", resource: { state: 'PUBLISHED' }
            });
        }

        await assignmentRef.set({
            id: assignmentId,
            builderId: targetBuilderId,
            builderSnapshot: builderSnapshot,
            gClassroomAssignmentId: res.result.id,
            courseId: courseId,
            courseName: courseName,
            assigneeMode: assigneeMode,
            assignedStudentIds: isIndividual ? selectedStudentIds : [],
            assignedStudentEmails: isIndividual ? selectedStudentEmails : [],
            title: title,
            lang: window.duplicatingAssignmentLang || document.getElementById('meta-lang')?.value || meta.lang || "French",
            selectedActivities: selectedActivities,
            listenTradGapLevel: listenTradGapLevel,
            listenDictationGapLevel: listenDictationGapLevel,
            delayedDictationGapLevel: delayedDictationGapLevel,
            delayedCopyingGapLevel: delayedCopyingGapLevel,
            activityGapLevels: activityGapLevels,
            beatRobotMode: beatRobotMode,
            beatRobotSpeed: beatRobotSpeed,
            sentencesPerActivity: structuredSentencesPerActivity,
            maxPoints: maxPoints > 0 ? maxPoints : 10,
            dueDate: dueDateVal ? new Date(dueDateVal).toISOString() : null,
            scheduleDate: scheduleDateVal ? new Date(scheduleDateVal).toISOString() : null,
            topicId: topicId || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(gcScheduledTime ? "📅 Assignment scheduled for publication on Google Classroom!" : "🎉 Assignment successfully posted to Google Classroom!");
        closeModals();
    } catch (err) {
        console.error("Failed to publish assignment:", err);
        alert("Error publishing assignment to Google Classroom: " + (err?.result?.error?.message || err.message || "Unknown error"));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    hideSentenceTableCountControl();
    arrangeActivityMenuLayout();
});
