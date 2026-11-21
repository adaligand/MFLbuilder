/* =========================
   TEACHER PREVIEW & ASSIGNMENT ACTIONS
========================= */
const TEACHER_MULTI_GAP_ACTIVITIES = ['listen-dictation', 'delayed-dictation', 'delayed-copying'];

function formatActivityGapLabel(rawLevel) {
    const cleaned = String(rawLevel || '1').replace('%', '').trim();
    const labels = {
        '1': '1 word',
        '25': '25% of words',
        '50': '50% of words',
        '75': '75% of words',
        '100': '100% of words'
    };
    return labels[cleaned] || '1 word';
}

function formatDelayedCopyingGapLabel(rawLevel) {
    return formatActivityGapLabel(rawLevel);
}

function extractSavedActivityGapLevels(assign) {
    const getLevel = (actId, topField) => {
        const raw = assign?.[topField]
            ?? assign?.activityGapLevels?.[actId]
            ?? assign?.activitySettings?.[actId]?.gapLevel
            ?? '1';
        const cleaned = String(raw).replace('%', '').trim();
        return ['1', '25', '50', '75', '100'].includes(cleaned) ? cleaned : '1';
    };

    return {
        'listen-dictation': getLevel('listen-dictation', 'listenDictationGapLevel'),
        'delayed-dictation': getLevel('delayed-dictation', 'delayedDictationGapLevel'),
        'delayed-copying': getLevel('delayed-copying', 'delayedCopyingGapLevel')
    };
}

function renderTeacherActivityListRows(list, gapLevelsOrSingle = '1') {
    const gapLevels = (gapLevelsOrSingle && typeof gapLevelsOrSingle === 'object')
        ? gapLevelsOrSingle
        : {
            'listen-dictation': '1',
            'delayed-dictation': '1',
            'delayed-copying': String(gapLevelsOrSingle || '1')
        };

    if (typeof buildActivitySelectorRowHTML === 'function') {
        return list
            .map(a => buildActivitySelectorRowHTML(a, gapLevels, 'display:flex; align-items:center; gap:8px;'))
            .join('');
    }

    const buildOptions = (selectedVal) => {
        const normalized = ['1', '25', '50', '75', '100'].includes(String(selectedVal))
            ? String(selectedVal)
            : '1';
        return [
            { val: '1', label: '1 word' },
            { val: '25', label: '25% of words' },
            { val: '50', label: '50% of words' },
            { val: '75', label: '75% of words' },
            { val: '100', label: '100% of words' }
        ].map(o => `<option value="${o.val}" ${o.val === normalized ? 'selected' : ''}>${o.label}</option>`).join('');
    };

    return list.map(a => `
        <div class="activity-row" style="display:flex; align-items:center; gap:8px;">
            <input type="checkbox" value="${a.id}" id="chk-${a.id}" onchange="renderPerActivitySentenceBoxes()">
            <label for="chk-${a.id}" style="cursor:pointer; font-weight:500;">${a.label}</label>
            ${TEACHER_MULTI_GAP_ACTIVITIES.includes(a.id) ? `
                <select id="${a.id}-gap-select"
                        onclick="event.stopPropagation()"
                        onchange="event.stopPropagation(); if (typeof onActivityGapLevelChange === 'function') onActivityGapLevelChange('${a.id}', this);"
                        title="Choose how many words are removed in ${a.label}"
                        style="margin-left:auto; padding:3px 8px; border-radius:6px; border:1px solid #cbd5e1; font-size:12px; font-weight:600; color:#1e293b; background:#fff; cursor:pointer;">
                    ${buildOptions(gapLevels[a.id])}
                </select>
            ` : ''}
        </div>
    `).join('');
}

async function previewActiveAssignmentAsStudent() {
    window.isTeacherPreview = true;
    const assignmentId = document.getElementById('sub-filter-assignment').value;
    if (!assignmentId) return alert("Select an assignment first.");

    const doc = await db.collection("assignments").doc(assignmentId).get();
    if (!doc.exists) return alert("Assignment not found.");

    currentStudentAssignment = doc.data();
    currentStudentAssignment.id = assignmentId;

    showPage('student-portal-page');

    const previewBanner = document.getElementById('teacher-preview-banner');
    if (previewBanner) previewBanner.style.display = 'flex';

    document.getElementById('student-login-box').style.display = 'none';
    const authTextEl = document.getElementById('student-auth-instruction-text');
    if (authTextEl) authTextEl.style.display = 'none';

    document.getElementById('student-profile-badge').style.display = 'inline-block';
    document.getElementById('student-display-name').innerText = (currentUser?.displayName || 'Teacher') + ' (Teacher Preview)';
    document.getElementById('student-display-email').innerText = `(${currentUser?.email || ''})`;

    const selectedActivities = currentStudentAssignment.selectedActivities || [];
    studentExerciseTypes = selectedActivities.filter(a => a !== 'study');
    studentCurrentExIndex = 0;
    studentSubItemIndex = 0;
    studentAnswersState = {};
    window.studentCompletedExercises = {};

    const perActSentences = currentStudentAssignment.sentencesPerActivity || {};
    const hasStudySelected = selectedActivities.includes('study');

    if (hasStudySelected && perActSentences['study'] && perActSentences['study'].length > 0) {
        const refBanner = document.getElementById('student-reference-banner');
        if (refBanner) refBanner.style.display = 'block';
        let refHtml = '<table style="width:100%; border-collapse:collapse;"><thead><tr><th>Target Language</th><th>English Translation</th></tr></thead><tbody>';
        perActSentences['study'].forEach(s => { refHtml += `<tr><td><b>${s.t}</b></td><td>${s.tr}</td></tr>`; });
        refHtml += '</tbody></table>';
        const refBody = document.getElementById('ref-table-body');
        if (refBody) refBody.innerHTML = refHtml;
    } else {
        document.getElementById('student-reference-banner').style.display = 'none';
    }

    document.getElementById('student-marksheet-card').style.display = 'none';
    document.getElementById('student-pending-review-card').style.display = 'none';
    document.getElementById('student-active-exercise-card').style.display = 'block';
    document.getElementById('student-nav-actions').style.display = 'flex';

    renderCurrentStudentExercise();
}

function exitTeacherPreview() {
    window.isTeacherPreview = false;
    const previewBanner = document.getElementById('teacher-preview-banner');
    if (previewBanner) previewBanner.style.display = 'none';

    showPage('submissions-page');
    renderStudentSubmissionsTable();
}

async function duplicateCurrentAssignmentToClass() {
    const assignmentId = document.getElementById('sub-filter-assignment').value;
    if (!assignmentId) return alert("Select an assignment first.");

    const doc = await db.collection("assignments").doc(assignmentId).get();
    if (!doc.exists) return alert("Assignment not found.");

    const assign = doc.data();
    editingAssignmentId = null;

    await setupAssignmentBuilderContext(assign);

    const clonedSentencesMap = assign.sentencesPerActivity ? JSON.parse(JSON.stringify(assign.sentencesPerActivity)) : null;
    window.duplicatingAssignmentLang = assign.lang || null;

    const currentLang = assign.lang || meta.lang || "Target Language";
    const list = [
        {id:'study', label:'Sentence Table (Reference)'}, 
        {id:'match', label:'Match up'}, 
        {id:'nospaces', label:'No Spaces'}, 
        {id:'jumbled', label:'Unjumble'}, 
        {id:'gap-en', label:'Gap Fill (English)'}, 
        {id:'gap-t', label:`Gap Fill (${currentLang})`}, 
        {id:'vowels', label:'Missing Vowels'}, 
        {id:'cons', label:'Missing Consonants'}, 
        {id:'faulty', label:'Faulty Translation'}, 
        {id:'trans-en', label:'Translate (English)'}, 
        {id:'trans-target', label:`Translate (${currentLang})`},
        {id:'listen-trad', label:'🎧 Listen / Translate'},
        {id:'listen-dictation', label:'🎧 Listening Dictation'},
        {id:'delayed-dictation', label:'🎧 Delayed Dictation'},
        {id:'delayed-copying', label:'Delayed Copying'}
    ];

    const savedGapLevels = extractSavedActivityGapLevels(assign);
    document.getElementById('activity-list').innerHTML = renderTeacherActivityListRows(list, savedGapLevels);

    document.getElementById('builder-title').value = assign.title || '';
    
    const selActs = assign.selectedActivities || [];
    document.querySelectorAll('#activity-list input').forEach(cb => {
        cb.checked = selActs.includes(cb.value);
    });

    let detectedCount = 10;
    if (clonedSentencesMap) {
        for (let actKey in clonedSentencesMap) {
            if (actKey !== 'study' && clonedSentencesMap[actKey].length > 0) {
                detectedCount = clonedSentencesMap[actKey].length;
                break;
            }
        }
    }
    const sentCountSelect = document.getElementById('sentence-count');
    if (sentCountSelect) sentCountSelect.value = String(detectedCount);

    if (clonedSentencesMap && clonedSentencesMap['study']) {
        const tableCountSelect = document.getElementById('table-sentence-count');
        if (tableCountSelect) tableCountSelect.value = String(clonedSentencesMap['study'].length);
    }

    renderPerActivitySentenceBoxes(clonedSentencesMap);

    document.getElementById('activity-menu').style.display = 'flex';
    document.getElementById('overlay').style.display = 'block';

    await openClassroomPublishSection();
    
    document.getElementById('gc-due-date').value = '';
    document.getElementById('gc-schedule-date').value = '';

    const gcBtn = document.getElementById('gc-publish-btn');
    if (gcBtn) gcBtn.innerText = "📋 Duplicate & Publish";
}

async function downloadActiveAssignmentWorksheet() {
    const assignmentId = document.getElementById('sub-filter-assignment').value;
    if (!assignmentId) return alert("Select an assignment first.");

    const doc = await db.collection("assignments").doc(assignmentId).get();
    if (!doc.exists) return alert("Assignment not found.");

    const assign = doc.data();
    const docTitle = assign.title || "Sentence Builder";
    const docLang = assign.lang || "Target Language";
    const docYear = assign.year || "Year 9";
    const perAct = assign.sentencesPerActivity || {};
    const selectedActs = assign.selectedActivities || Object.keys(perAct);

    if (selectedActs.length === 0) return alert("No activities found in assignment.");

    const activityInstructions = {
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

    let contentHtml = 
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

    let answerKeyHtml = "<br clear='all' style='page-break-before:always' /><div class='answer-key-section'><table class='exercise-title-table'><tr><td><div class='ex-title'>Answer Key</div></td></tr></table>";
    let exerciseCounter = 1;

    selectedActs.forEach((type) => {
        const isStudy = (type === 'study');
        const boxTitle = isStudy ? "Sentence Table" : ("Exercise " + exerciseCounter + ": " + getCleanActivityTitle(type, docLang));
        if (!isStudy) exerciseCounter++;

        const textInstruction = isStudy ? "" : (activityInstructions[type] || "");
        const instructionMarkup = textInstruction ? ('<div class="ex-instruction">' + textInstruction + '</div>') : '';

        let activityHtml = 
            '<div class="activity-container">' +
                '<table class="exercise-title-table">' +
                    '<tr>' +
                        '<td>' +
                            '<div class="ex-title">' + boxTitle + '</div>' +
                            instructionMarkup +
                        '</td>' +
                    '</tr>' +
                '</table>';

        const currentSents = perAct[type] || [];
        let activityAnswersHtml = "";
        if (!isStudy) activityAnswersHtml += '<div class="ak-group"><h3>' + boxTitle + '</h3><ol class="answer-list">';

        const usedGapWords = new Set();

        if (type === 'study') {
            activityHtml += '<table class="sentence-grid-table"><tr><th>' + docLang + '</th><th>English Translation</th></tr>';
            currentSents.forEach(s => { 
                activityHtml += '<tr><td style="padding:1pt 5pt; mso-para-margin:0pt;"><b>' + s.t + '</b></td><td class="blue" style="padding:1pt 5pt; mso-para-margin:0pt;">' + s.tr + '</td></tr>'; 
            });
            activityHtml += '</table>';
        } else if (type === 'match') {
            const shuf = shuffleArray(currentSents);
            activityHtml += '<table class="match-table">';
            currentSents.forEach((s, i) => {
                activityHtml += '<tr>' +
                    '<td style="width:45%; padding: 3pt 0;"><b>' + (i+1) + '.</b> ' + s.t + '</td>' +
                    '<td style="width:10%; text-align:center; padding: 3pt 0;">[ &nbsp; ]</td>' +
                    '<td style="width:45%; padding: 3pt 0;"><b>' + String.fromCharCode(65+i) + '.</b> ' + shuf[i].tr + '</td>' +
                '</tr>';
                const matchIndex = shuf.indexOf(s);
                const correctLetter = String.fromCharCode(65 + (matchIndex >= 0 ? matchIndex : 0));
                activityAnswersHtml += '<li>' + correctLetter + '</li>';
            });
            activityHtml += '</table>';
        } else {
            const needsWritingLine = ['nospaces', 'jumbled', 'faulty', 'trans-en', 'trans-target'].includes(type);

            currentSents.forEach((s, i) => {
                let out = s.t, hint = '<span class="blue">(' + s.tr + ')</span>';
                let answerText = s.t;

                if (type === 'vowels' || type === 'cons') {
                    const pattern = (type === 'vowels') ? /[aeiouàéèíóúü]/gi : /[bcdfghjklmnpqrstvwxyz]/gi;
                    out = s.t.split(' ').map(word => word.replace(pattern, ' __ ')).join('&nbsp;&nbsp;');
                } else if (type === 'nospaces') {
                    out = s.t.replace(/\s+/g, '').toLowerCase();
                } else if (type === 'jumbled') {
                    out = shuffleArray(s.t.split(' ')).join(' / ');
                } else if (type === 'gap-t') {
                    let rawTarget = s.t;
                    if (!extractGapWord(rawTarget).fullMatch) {
                        rawTarget = addAsteriskToGapWord(rawTarget, usedGapWords);
                    }
                    const gapRes = extractGapWord(rawTarget);
                    if (gapRes.fullMatch) {
                        out = rawTarget.replace(gapRes.fullMatch, '___________');
                    } else {
                        const words = rawTarget.split(' ');
                        const targetIdx = Math.floor(words.length / 2);
                        words[targetIdx] = '___________';
                        out = words.join(' ');
                    }
                    answerText = rawTarget.replace(/\*/g, '');
                } else if (type === 'gap-en') {
                    out = s.t;
                    let rawEnglish = s.tr;
                    if (!extractGapWord(rawEnglish).fullMatch) {
                        rawEnglish = addAsteriskToGapWord(rawEnglish, usedGapWords);
                    }
                    const gapResEn = extractGapWord(rawEnglish);
                    let maskedTr = rawEnglish;
                    if (gapResEn.fullMatch) {
                        maskedTr = rawEnglish.replace(gapResEn.fullMatch, '___________');
                    } else {
                        const wordsEn = rawEnglish.split(' ');
                        const targetIdxEn = Math.floor(wordsEn.length / 2);
                        wordsEn[targetIdxEn] = '___________';
                        maskedTr = wordsEn.join(' ');
                    }
                    hint = '<span class="blue">(' + maskedTr + ')</span>';
                    answerText = rawEnglish.replace(/\*/g, '');
                } else if (type === 'trans-en') {
                    out = s.t; hint = ""; answerText = s.tr;
                } else if (type === 'trans-target') {
                    out = '<span class="blue">' + s.tr + '</span>'; hint = "";
                } else if (type === 'faulty') {
                    out = s.t + ' = <span class="blue">' + (s.faultyTr || s.tr) + '</span>';
                    answerText = s.tr;
                    activityHtml += 
                        '<div class="exercise-item-wrapper">' +
                            '<p class="exercise-item"><b>' + (i+1) + '.</b> ' + out + '</p>' +
                            (needsWritingLine ? '<p class="writing-line">&nbsp;</p>' : '') +
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
        if (!isStudy) { activityAnswersHtml += '</ol></div>'; answerKeyHtml += activityAnswersHtml; }
    });

    answerKeyHtml += '</div>';
    contentHtml += answerKeyHtml;

    const fullDoc = 
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

            '.sentence-grid-table { width: 100%; border-collapse: collapse; margin-top: 2pt; margin-bottom: 8pt; } ' +
            '.sentence-grid-table th { border: 1px solid #cbd5e1; padding: 2pt 5pt !important; font-size: 10pt !important; background-color: #f1f5f9; text-align: left; font-weight: bold; mso-para-margin: 0pt
