import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const modelDir = path.join(root, 'backend', 'models');
const outputDir = path.join(root, 'docs', 'diagrams');
const outputFile = path.join(outputDir, 'backend-model-erd.svg');
const checkOnly = process.argv.includes('--check');

const F = (name, type, flags = '') => ({ name, type, flags });
const T = [F('createdAt', 'Date', 'auto'), F('updatedAt', 'Date', 'auto')];
const M = (name, group, fields, timestamps = true) => ({
  name,
  group,
  fields: [F('_id', 'ObjectId', 'PK'), ...fields, ...(timestamps ? T : [])],
});

const models = [
  M('User', 'CORE', [
    F('username', 'String', 'required unique'), F('fullName', 'String'), F('email', 'String', 'unique sparse'),
    F('avatarUrl', 'String'), F('dateOfBirth', 'Date?'), F('gender', 'Enum', 'MALE | FEMALE | OTHER'),
    F('phone', 'String', 'unique sparse'), F('address', 'String'), F('specialization', 'String'),
    F('yearsOfExperience', 'Number', '0..80'), F('certificates', 'String[]'), F('bio', 'String', 'max 1000'),
    F('password', 'String', 'required'), F('role', 'Enum', 'ADMIN | PT | CUSTOMER'), F('status', 'Enum', 'ACTIVE | LOCKED'),
  ]),
  M('CustomerProfile', 'CORE', [
    F('userId', 'ObjectId?', 'ref User · unique sparse'), F('assignedPtId', 'ObjectId', 'ref User · required index'),
    F('fullName', 'String', 'required index'), F('phone', 'String', 'required index'), F('email', 'String?'),
    F('dateOfBirth', 'Date?'), F('gender', 'Enum', 'MALE | FEMALE | OTHER'), F('height', 'Number?'),
    F('initialWeight', 'Number?'), F('medicalNotes', 'String'), F('initialGoal', 'String'),
    F('internalNotes', 'String'), F('status', 'Enum', 'ACTIVE | INACTIVE | LEAD · index'),
  ]),
  M('FeatureFlag', 'SYSTEM', [
    F('key', 'Enum', 'required unique'), F('enabled', 'Boolean'), F('roles', 'UserRole[]'),
    F('pilotUserIds', 'ObjectId[]', 'ref User'),
  ]),
  M('AuditLog', 'SYSTEM', [
    F('actorId', 'ObjectId', 'ref User · required index'), F('actorRole', 'Enum', 'ADMIN | PT | CUSTOMER'),
    F('action', 'String', 'required index'), F('resourceType', 'String', 'required index'),
    F('resourceId', 'String', 'required index · soft ref'), F('customerId', 'ObjectId?', 'ref CustomerProfile · index'),
    F('metadata', 'Mixed'),
  ]),
  M('Notification', 'SYSTEM', [
    F('userId', 'ObjectId', 'ref User · required index'), F('type', 'String', 'required index'),
    F('title', 'String', 'required'), F('message', 'String', 'required'), F('resourceType', 'String', 'required'),
    F('resourceId', 'String', 'required · soft ref'), F('readAt', 'Date?'),
  ]),
  M('MigrationRecord', 'SYSTEM', [
    F('version', 'String', 'required unique'), F('name', 'String', 'required'), F('status', 'Enum', 'RUNNING | APPLIED | FAILED | ROLLED_BACK'),
    F('appliedAt', 'Date?'), F('rolledBackAt', 'Date?'), F('ownerId', 'String?'), F('lockedAt', 'Date?'),
    F('expiresAt', 'Date?'), F('error', 'Mixed?'), F('metadata', 'Mixed'),
  ]),
  M('TransferRequest', 'CRM', [
    F('customerId', 'ObjectId', 'ref CustomerProfile · required index'), F('fromPtId', 'ObjectId', 'ref User · required index'),
    F('fromPtName', 'String'), F('toPtId', 'ObjectId', 'ref User · required index'), F('toPtName', 'String'),
    F('reason', 'String', 'required'), F('status', 'Enum', 'PENDING | ACCEPTED | REJECTED | CANCELLED | ADMIN_FORCED'),
    F('resolvedById', 'ObjectId?', 'ref User'), F('resolvedByName', 'String'), F('resolvedAt', 'Date?'),
  ]),
  M('PtPackage', 'CRM', [
    F('customerId', 'ObjectId', 'ref CustomerProfile · required index'), F('name', 'String', 'required'),
    F('totalSessions', 'Number', 'required min 1'), F('usedSessions', 'Number', 'min 0'),
    F('remainingSessions', 'Number', 'required min 0'), F('startDate', 'Date', 'required'), F('endDate', 'Date', 'required'),
    F('status', 'Enum', 'ACTIVE | EXPIRED | COMPLETED | CANCELLED'),
  ]),
  M('CalendarEvent', 'CARE', [
    F('ownerPtId', 'ObjectId', 'ref User · required index'), F('customerId', 'ObjectId?', 'ref CustomerProfile · index'),
    F('title', 'String', 'required'), F('startsAt', 'Date', 'required index'), F('endsAt', 'Date', 'required'),
    F('notes', 'String'), F('status', 'Enum', 'SCHEDULED | COMPLETED | CANCELLED'),
  ]),
  M('CareTask', 'CARE', [
    F('customerId', 'ObjectId', 'ref CustomerProfile · required index'), F('assignedPtId', 'ObjectId', 'ref User · required index'),
    F('title', 'String', 'required'), F('dueAt', 'Date', 'required index'), F('status', 'Enum', 'OPEN | DONE · index'),
    F('result', 'String'),
  ]),
  M('CareLog', 'CARE', [
    F('customerId', 'ObjectId', 'ref CustomerProfile · required index'), F('ptId', 'ObjectId', 'ref User · required index'),
    F('kind', 'String', 'required'), F('referenceId', 'ObjectId?', 'soft ref'), F('note', 'String', 'required'),
  ]),
  M('CareAlert', 'CARE', [
    F('customerId', 'ObjectId', 'ref CustomerProfile · required index'), F('ptId', 'ObjectId', 'ref User · required index'),
    F('ruleKey', 'String', 'required index'), F('title', 'String', 'required'), F('reason', 'String', 'required'),
    F('status', 'Enum', 'OPEN | RESOLVED · index'), F('dueAt', 'Date', 'required'), F('resolvedAt', 'Date?'),
    F('resolvedById', 'ObjectId?', 'ref User'), F('result', 'String'),
  ]),
  M('Goal', 'PROGRESS', [
    F('customerId', 'ObjectId', 'ref CustomerProfile · required index'), F('ptId', 'ObjectId', 'ref User · required index'),
    F('type', 'Enum', 'WEIGHT_LOSS | FAT_LOSS | WEIGHT_GAIN | MUSCLE_GAIN | RECOMPOSITION | FITNESS'),
    F('title', 'String', 'required'), F('targetValue', 'Number?'), F('targetUnit', 'String'), F('deadline', 'Date', 'required'),
    F('sessionsPerWeek', 'Number', '1..14'), F('cardioNotes', 'String'), F('evaluationNotes', 'String'),
    F('status', 'Enum', 'DRAFT | PUBLISHED'), F('publishedAt', 'Date?'), F('version', 'Number'),
  ]),
  M('Roadmap', 'PROGRESS', [
    F('customerId', 'ObjectId', 'ref CustomerProfile · required index'), F('ptId', 'ObjectId', 'ref User · required index'),
    F('title', 'String', 'required'), F('baseline', 'Mixed'), F('phases', 'Phase[]', 'embedded'),
    F('phases[].order', 'Number', 'required min 1'), F('phases[].name', 'String', 'required'),
    F('phases[].durationWeeks', 'Number', 'required min 1'), F('phases[].goals', 'String[]'),
    F('phases[].weeks', 'Week[]', 'embedded'), F('weeks[].week', 'Number', 'required min 1'),
    F('weeks[].focus', 'String', 'required'), F('weeks[].sessionTargets', 'Number?'),
    F('status', 'Enum', 'DRAFT | PUBLISHED'), F('version', 'Number'), F('publishedAt', 'Date?'),
  ]),
  M('ProgressReport', 'PROGRESS', [
    F('customerId', 'ObjectId', 'ref CustomerProfile · required index'), F('ptId', 'ObjectId', 'ref User · required index'),
    F('periodStart', 'Date', 'required'), F('periodEnd', 'Date', 'required'), F('summary', 'String', 'required'),
    F('metrics', 'Mixed'), F('sourceVersions', 'Mixed'), F('status', 'Enum', 'DRAFT | PUBLISHED'),
    F('version', 'Number'), F('publishedAt', 'Date?'),
  ]),
  M('InBodyRecord', 'HEALTH', [
    F('customerId', 'ObjectId', 'ref CustomerProfile · required index'), F('ptId', 'ObjectId', 'ref User · required index'),
    F('measurementDate', 'Date', 'required'), F('weight', 'Number', 'required min 0'), F('bmi', 'Number?'),
    F('bodyFatPercentage', 'Number?', '0..100'), F('bodyFatMass', 'Number?'), F('muscleMass', 'Number?'),
    F('bmr', 'Number?'), F('visceralFatLevel', 'Number?'), F('inbodyScore', 'Number?'), F('strengths', 'String'),
    F('priorities', 'String'), F('recommendation', 'String'), F('source', 'Enum', 'MANUAL | AI_SCAN'),
    F('ocrStatus', 'Enum', 'NOT_APPLICABLE | REVIEW_REQUIRED | CONFIRMED'), F('confidence', 'Number?', '0..1'),
    F('ocrWarnings', 'String[]'), F('sourceImage.fileName', 'String'), F('sourceImage.mimeType', 'String'),
    F('sourceImage.data', 'Buffer?'), F('status', 'Enum', 'DRAFT | PUBLISHED'), F('publishedAt', 'Date?'), F('version', 'Number'),
  ]),
  M('BodyMeasurement', 'HEALTH', [
    F('customerId', 'ObjectId', 'ref CustomerProfile · required index'), F('ptId', 'ObjectId', 'ref User · required index'),
    F('measuredAt', 'Date', 'required index'), F('weight', 'Number?'), F('bodyFatPercentage', 'Number?', '0..100'),
    F('muscleMass', 'Number?'), F('measurements', 'Mixed'),
  ]),
  M('NutritionPlan', 'NUTRITION', [
    F('customerId', 'ObjectId', 'ref CustomerProfile · required index'), F('ptId', 'ObjectId', 'ref User · required index'),
    F('title', 'String', 'required'), F('bmr', 'Number?'), F('tdee', 'Number?'), F('targetCalories', 'Number', 'required'),
    F('macros.protein', 'Number', 'required'), F('macros.carbs', 'Number', 'required'), F('macros.fat', 'Number', 'required'),
    F('menu', 'Mixed[]'), F('notes', 'String'), F('createdByAi', 'Boolean'),
    F('reviewStatus', 'Enum', 'NOT_REQUIRED | PT_REVIEW_REQUIRED | APPROVED | REJECTED'),
    F('status', 'Enum', 'DRAFT | PUBLISHED'), F('publishedAt', 'Date?'), F('version', 'Number'),
  ]),
  M('NutritionLog', 'NUTRITION', [
    F('customerId', 'ObjectId', 'ref CustomerProfile · required index'), F('ptId', 'ObjectId', 'ref User · required index'),
    F('loggedAt', 'Date', 'required index'), F('type', 'Enum', 'FOOD | ACTIVITY · index'), F('name', 'String', 'required'),
    F('calories', 'Number', 'required min 0'), F('macros.protein', 'Number'), F('macros.carbs', 'Number'),
    F('macros.fat', 'Number'), F('durationMinutes', 'Number?'), F('notes', 'String'),
  ]),
  M('ActivityCalorie', 'NUTRITION', [
    F('name', 'String', 'required unique'), F('category', 'String', 'required index'), F('met', 'Number', 'required 0.1..30'),
    F('active', 'Boolean', 'index'),
  ]),
  M('NutritionFormula', 'NUTRITION', [
    F('name', 'String', 'required'), F('version', 'Number', 'required'), F('active', 'Boolean'),
    F('fatLossFactor', 'Number'), F('muscleGainFactor', 'Number'), F('proteinPerKg', 'Number'), F('fatPerKg', 'Number'),
  ]),
  M('Exercise', 'WORKOUT', [
    F('name', 'String', 'required index'), F('muscleGroup', 'String', 'required index'),
    F('level', 'Enum', 'BEGINNER | INTERMEDIATE | ADVANCED · index'), F('equipment', 'String[]'),
    F('videoUrl', 'String'), F('technique', 'String'), F('commonMistakes', 'String[]'),
    F('contraindications', 'String[]'), F('variants', 'String[]'), F('scope', 'Enum', 'GLOBAL | PRIVATE · index'),
    F('ownerPtId', 'ObjectId?', 'ref User · index'),
  ]),
  M('WorkoutTemplate', 'WORKOUT', [
    F('ownerPtId', 'ObjectId', 'ref User · required index'), F('title', 'String', 'required'), F('goal', 'String', 'required index'),
    F('level', 'String', 'required index'), F('sessions', 'Session[]', 'embedded'), F('sessions[].name', 'String', 'required'),
    F('sessions[].exercises', 'ExerciseItem[]', 'embedded'), F('exercises[].exerciseId', 'ObjectId?', 'ref Exercise'),
    F('exercises[].name', 'String', 'required'), F('exercises[].sets', 'Number'), F('exercises[].reps', 'String'),
    F('exercises[].weight', 'String'), F('exercises[].rpe', 'Number?'), F('exercises[].rir', 'Number?'),
    F('exercises[].tempo', 'String'), F('exercises[].restSeconds', 'Number'), F('exercises[].notes', 'String'),
    F('version', 'Number'), F('status', 'Enum', 'ACTIVE | ARCHIVED'),
  ]),
  M('WorkoutSession', 'WORKOUT', [
    F('customerId', 'ObjectId', 'ref CustomerProfile · required index'), F('ptId', 'ObjectId', 'ref User · required index'),
    F('templateId', 'ObjectId?', 'ref WorkoutTemplate'), F('performedAt', 'Date', 'required index'),
    F('attendance', 'Enum', 'PRESENT | ABSENT | LATE'), F('absenceReason', 'String'), F('planSnapshot', 'Mixed', 'required'),
    F('exerciseLogs', 'ExerciseLog[]', 'embedded'), F('exerciseLogs[].exerciseId', 'ObjectId?', 'ref Exercise'),
    F('exerciseLogs[].name', 'String', 'required'), F('exerciseLogs[].sets', 'SetLog[]', 'embedded'),
    F('sets[].reps', 'Number?'), F('sets[].weight', 'Number?'), F('sets[].rpe', 'Number?', '0..10'),
    F('sets[].rir', 'Number?'), F('sets[].completed', 'Boolean'), F('exerciseLogs[].notes', 'String'),
    F('feeling', 'String'), F('notes', 'String'), F('idempotencyKey', 'String', 'required unique with ptId'),
  ]),
  M('WorkoutPlan', 'WORKOUT', [
    F('customerId', 'ObjectId', 'ref CustomerProfile · required index'), F('ptId', 'ObjectId', 'ref User · required index'),
    F('title', 'String', 'required'), F('startDate', 'Date?'), F('endDate', 'Date?'), F('sessions', 'Session[]', 'embedded'),
    F('sessions[].name', 'String', 'required'), F('sessions[].exercises', 'ExerciseItem[]', 'embedded'),
    F('exercises[].name', 'String', 'required'), F('exercises[].sets', 'Number'), F('exercises[].reps', 'String'),
    F('exercises[].weight', 'String'), F('exercises[].rest', 'String'), F('exercises[].tempo', 'String'),
    F('exercises[].notes', 'String'), F('createdByAi', 'Boolean'),
    F('reviewStatus', 'Enum', 'NOT_REQUIRED | PT_REVIEW_REQUIRED | APPROVED | REJECTED'),
    F('status', 'Enum', 'DRAFT | PUBLISHED'), F('publishedAt', 'Date?'), F('version', 'Number'),
  ]),
  M('KnowledgeDocument', 'KNOWLEDGE', [
    F('title', 'String', 'required index'), F('topic', 'String', 'required index'), F('content', 'String', 'required'),
    F('version', 'Number'), F('status', 'Enum', 'DRAFT | PUBLISHED'), F('approvedById', 'ObjectId?', 'ref User'),
    F('effectiveAt', 'Date?'), F('publishedAt', 'Date?'),
  ]),
  M('KnowledgeChunk', 'KNOWLEDGE', [
    F('documentId', 'ObjectId', 'ref KnowledgeDocument · required index'), F('documentVersion', 'Number', 'required'),
    F('topic', 'String', 'required index'), F('position', 'Number', 'required'), F('content', 'String', 'required'),
    F('embedding', 'Number[]'),
  ]),
  M('AssistantConversation', 'ASSISTANT', [
    F('customerId', 'ObjectId?', 'ref CustomerProfile · index'), F('ptId', 'ObjectId', 'ref User · required index'),
    F('title', 'String', 'required'), F('messages', 'Mixed[]'),
  ]),
  M('AssistantSuggestion', 'ASSISTANT', [
    F('customerId', 'ObjectId', 'ref CustomerProfile · required index'), F('ptId', 'ObjectId', 'ref User · required index'),
    F('requestType', 'String', 'required'), F('scenario', 'String', 'required'), F('content', 'String', 'required'),
    F('editedContent', 'String?'), F('citations', 'Citation[]', 'embedded'), F('citations[].documentId', 'String', 'required soft ref'),
    F('citations[].title', 'String', 'required'), F('customerContextFields', 'String[]'), F('safetyWarnings', 'String[]'),
    F('reviewStatus', 'Enum', 'PT_REVIEW_REQUIRED | APPROVED | REJECTED'), F('reviewedAt', 'Date?'), F('appliedAt', 'Date?'),
  ]),
];

const refs = [
  ['CustomerProfile','userId','User'], ['CustomerProfile','assignedPtId','User'],
  ['FeatureFlag','pilotUserIds','User'], ['AuditLog','actorId','User'], ['AuditLog','customerId','CustomerProfile'],
  ['Notification','userId','User'], ['TransferRequest','customerId','CustomerProfile'], ['TransferRequest','fromPtId','User'],
  ['TransferRequest','toPtId','User'], ['TransferRequest','resolvedById','User'], ['PtPackage','customerId','CustomerProfile'],
  ['CalendarEvent','ownerPtId','User'], ['CalendarEvent','customerId','CustomerProfile'], ['CareTask','customerId','CustomerProfile'],
  ['CareTask','assignedPtId','User'], ['CareLog','customerId','CustomerProfile'], ['CareLog','ptId','User'],
  ['CareAlert','customerId','CustomerProfile'], ['CareAlert','ptId','User'], ['CareAlert','resolvedById','User'],
  ['Goal','customerId','CustomerProfile'], ['Goal','ptId','User'], ['Roadmap','customerId','CustomerProfile'], ['Roadmap','ptId','User'],
  ['ProgressReport','customerId','CustomerProfile'], ['ProgressReport','ptId','User'], ['InBodyRecord','customerId','CustomerProfile'],
  ['InBodyRecord','ptId','User'], ['BodyMeasurement','customerId','CustomerProfile'], ['BodyMeasurement','ptId','User'],
  ['NutritionPlan','customerId','CustomerProfile'], ['NutritionPlan','ptId','User'], ['NutritionLog','customerId','CustomerProfile'],
  ['NutritionLog','ptId','User'], ['Exercise','ownerPtId','User'], ['WorkoutTemplate','ownerPtId','User'],
  ['WorkoutTemplate','exercises[].exerciseId','Exercise'], ['WorkoutSession','customerId','CustomerProfile'],
  ['WorkoutSession','ptId','User'], ['WorkoutSession','templateId','WorkoutTemplate'], ['WorkoutSession','exerciseLogs[].exerciseId','Exercise'],
  ['WorkoutPlan','customerId','CustomerProfile'], ['WorkoutPlan','ptId','User'], ['KnowledgeDocument','approvedById','User'],
  ['KnowledgeChunk','documentId','KnowledgeDocument'], ['AssistantConversation','customerId','CustomerProfile'],
  ['AssistantConversation','ptId','User'], ['AssistantSuggestion','customerId','CustomerProfile'], ['AssistantSuggestion','ptId','User'],
].map(([from, field, to]) => ({ from, field, to }));

const escapeXml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' })[c]);
const sourceFiles = fs.readdirSync(modelDir).filter((file) => file.endsWith('.ts'));
const modelFiles = sourceFiles.map((file) => path.basename(file, '.ts'));

function assert(condition, message) { if (!condition) throw new Error(message); }
function validateModels() {
  const names = models.map((model) => model.name);
  assert(new Set(names).size === names.length, 'Duplicate model name');
  assert(names.length === 29, `Expected 29 models, received ${names.length}`);
  assert([...names].sort().join('|') === [...modelFiles].sort().join('|'), 'Model metadata differs from backend/models');
  for (const model of models) {
    const fieldNames = model.fields.map((field) => field.name);
    assert(new Set(fieldNames).size === fieldNames.length, `Duplicate field in ${model.name}`);
  }
  for (const ref of refs) assert(names.includes(ref.to), `Unknown ref target: ${ref.to}`);

  const sourceRefs = new Set();
  for (const file of sourceFiles) {
    const source = fs.readFileSync(path.join(modelDir, file), 'utf8');
    const from = path.basename(file, '.ts');
    for (const match of source.matchAll(/ref:\s*['"]([^'"]+)['"]/g)) sourceRefs.add(`${from}->${match[1]}`);
  }
  const diagramRefs = new Set(refs.map((ref) => `${ref.from}->${ref.to}`));
  for (const ref of sourceRefs) assert(diagramRefs.has(ref), `Missing diagram ref: ${ref}`);
  console.log(`Validated ${models.length} models and ${refs.length} field-level references.`);
}

const columns = [
  ['SYSTEM', 'CORE'], ['CRM', 'CARE'], ['PROGRESS'], ['HEALTH', 'NUTRITION'], ['WORKOUT'], ['KNOWLEDGE', 'ASSISTANT'],
];
const groupOrder = new Map(columns.flatMap((groups, column) => groups.map((group) => [group, column])));
const palette = {
  SYSTEM:'#475569', CORE:'#0f766e', CRM:'#2563eb', CARE:'#7c3aed', PROGRESS:'#be123c',
  HEALTH:'#c2410c', NUTRITION:'#4d7c0f', WORKOUT:'#0369a1', KNOWLEDGE:'#6d28d9', ASSISTANT:'#a21caf',
};
const W = 7680, H = 4320, marginX = 110, top = 260, colGap = 55, cardW = 1195, rowGap = 34, fieldH = 23, headerH = 48, pad = 18;
const positions = new Map();
for (let col = 0; col < columns.length; col += 1) {
  let y = top;
  const columnModels = models.filter((model) => groupOrder.get(model.group) === col);
  for (const model of columnModels) {
    const h = headerH + model.fields.length * fieldH + pad;
    positions.set(model.name, { x: marginX + col * (cardW + colGap), y, w: cardW, h });
    y += h + rowGap;
  }
  assert(y < H - 70, `Column ${col + 1} exceeds canvas height (${y})`);
}

function renderCard(model) {
  const p = positions.get(model.name); const color = palette[model.group];
  const rows = model.fields.map((field, i) => {
    const y = p.y + headerH + 17 + i * fieldH;
    const shade = i % 2 ? `<rect x="${p.x + 1}" y="${y - 16}" width="${p.w - 2}" height="${fieldH}" fill="#f8fafc"/>` : '';
    return `${shade}<text x="${p.x + 18}" y="${y}" class="field-name">${escapeXml(field.name)}</text><text x="${p.x + 445}" y="${y}" class="field-type">${escapeXml(field.type)}</text><text x="${p.x + 650}" y="${y}" class="field-flags">${escapeXml(field.flags)}</text>`;
  }).join('');
  return `<g id="model-${model.name}"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="12" fill="#fff" stroke="#cbd5e1" stroke-width="2" filter="url(#shadow)"/><path d="M${p.x + 12} ${p.y}H${p.x + p.w - 12}Q${p.x + p.w} ${p.y} ${p.x + p.w} ${p.y + 12}V${p.y + headerH}H${p.x}V${p.y + 12}Q${p.x} ${p.y} ${p.x + 12} ${p.y}" fill="${color}"/><text x="${p.x + 18}" y="${p.y + 31}" class="model-name">${model.name}</text><text x="${p.x + p.w - 18}" y="${p.y + 30}" text-anchor="end" class="group-name">${model.group}</text>${rows}</g>`;
}

function renderEdge(ref, index) {
  const a = positions.get(ref.from), b = positions.get(ref.to);
  const fromRight = a.x < b.x;
  const sx = fromRight ? a.x + a.w : a.x, tx = fromRight ? b.x : b.x + b.w;
  const sy = a.y + 32 + (index % Math.max(1, Math.floor((a.h - 64) / 12))) * 12;
  const ty = b.y + Math.min(b.h - 28, 62 + (index % 13) * 16);
  const bend = sx + (tx - sx) * 0.5;
  return `<path d="M${sx} ${sy} C${bend} ${sy},${bend} ${ty},${tx} ${ty}" class="relation" marker-end="url(#arrow)"/><text x="${bend}" y="${(sy + ty) / 2 - 6}" class="edge-label">${escapeXml(ref.field)}</text>`;
}

function renderSvg() {
  const edges = refs.map(renderEdge).join('');
  const cards = models.map(renderCard).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#0f172a" flood-opacity=".13"/></filter><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#64748b"/></marker></defs>
<style>.title{font:700 48px Inter,Segoe UI,sans-serif;fill:#0f172a}.subtitle{font:400 22px Inter,Segoe UI,sans-serif;fill:#475569}.model-name{font:700 22px Inter,Segoe UI,sans-serif;fill:#fff}.group-name{font:700 14px Inter,Segoe UI,sans-serif;fill:#fff;opacity:.8;letter-spacing:1.5px}.field-name{font:600 15px Consolas,monospace;fill:#0f172a}.field-type{font:500 15px Consolas,monospace;fill:#334155}.field-flags{font:400 14px Segoe UI,sans-serif;fill:#64748b}.relation{fill:none;stroke:#64748b;stroke-width:2;opacity:.32}.edge-label{font:500 11px Consolas,monospace;fill:#475569;paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round}.legend{font:500 17px Segoe UI,sans-serif;fill:#334155}</style>
<rect width="${W}" height="${H}" fill="#f1f5f9"/><text x="110" y="92" class="title">3S GYM · BACKEND DATA MODEL</text><text x="110" y="135" class="subtitle">29 Mongoose collections · đầy đủ fields, embedded documents và ObjectId refs · generated from backend/models</text>
<g transform="translate(5480 66)"><rect width="2080" height="104" rx="14" fill="#fff" stroke="#cbd5e1"/><text x="24" y="35" class="legend"><tspan font-weight="700">CHÚ GIẢ</tspan><tspan dx="34">PK</tspan><tspan dx="10">khóa chính</tspan><tspan dx="34">ref X</tspan><tspan dx="10">Mongoose reference</tspan><tspan dx="34">[]</tspan><tspan dx="10">mảng / embedded array</tspan></text><path d="M24 74H155" class="relation" marker-end="url(#arrow)" opacity="1"/><text x="174" y="80" class="legend">ObjectId ref (nhãn là field nguồn)</text><text x="870" y="80" class="legend">resourceId/referenceId: soft ref, giữ trong field flags vì đích động</text></g>
${edges}${cards}
<text x="7570" y="4280" text-anchor="end" class="subtitle">Generated 2026-08-28 · Source of truth: backend/models/*.ts</text></svg>`;
}

validateModels();
if (!checkOnly) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputFile, renderSvg(), 'utf8');
  console.log(`Wrote ${path.relative(root, outputFile)} (${W}x${H}).`);
}
