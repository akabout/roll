const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');

// Charger les variables d'environnement
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

const AUDIO_STORE_DIR = path.join(__dirname, '..', 'data');
const AUDIO_STORE_FILE = path.join(AUDIO_STORE_DIR, 'audio-state.json');
const AUDIO_UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'audio');
const PDF_UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'pdf');
const MODELS_UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'models');
const SCENARIO_STORE_FILE = path.join(AUDIO_STORE_DIR, 'scenario-state.json');
const MODELING_STORE_FILE = path.join(AUDIO_STORE_DIR, 'modeling-state.json');
const MODELS_CATALOG_FILE = path.join(AUDIO_STORE_DIR, 'models-catalog.json');
const CARDS_STORE_FILE  = path.join(AUDIO_STORE_DIR, 'cards-state.json');
const MAPS_STORE_FILE   = path.join(AUDIO_STORE_DIR, 'maps.json');
const MAPS_UPLOADS_DIR  = path.join(__dirname, '..', 'uploads', 'maps');

const DEFAULT_AUDIO_SETTINGS = {
  masterVolume: 80,
  ambianceVolume: 60,
  combatVolume: 70,
  enqueteVolume: 50,
  dialoguesVolume: 65,
  fondSonoreVolume: 40,
  bruitsVolume: 75
};

const DEFAULT_AUDIO_STATE = {
  tracks: [],
  playlists: [],
  settings: DEFAULT_AUDIO_SETTINGS
};

const DEFAULT_SCENARIO_STATE = {
  moments: [],
  characterSheets: [],
  adventureMeta: {
    adventureName: '',
    gameSystem: '',
    adventureType: '',
    playerCount: 4,
    ruleMode: '',
    worldStyle: '',
    summary: ''
  }
};

const DEFAULT_MODELING_STATE = {
  assets: []
};

const getPdfMaxScenes = () => {
  const parsed = Number(process.env.PDF_MAX_SCENES || 300);
  if (!Number.isFinite(parsed)) return 300;
  return Math.max(20, Math.min(1000, Math.floor(parsed)));
};

const ensureAudioStore = () => {
  if (!fs.existsSync(AUDIO_STORE_DIR)) {
    fs.mkdirSync(AUDIO_STORE_DIR, { recursive: true });
  }
  if (!fs.existsSync(AUDIO_UPLOADS_DIR)) {
    fs.mkdirSync(AUDIO_UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(PDF_UPLOADS_DIR)) {
    fs.mkdirSync(PDF_UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(MODELS_UPLOADS_DIR)) {
    fs.mkdirSync(MODELS_UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(AUDIO_STORE_FILE)) {
    fs.writeFileSync(AUDIO_STORE_FILE, JSON.stringify({ users: {} }, null, 2), 'utf8');
  }
  if (!fs.existsSync(SCENARIO_STORE_FILE)) {
    fs.writeFileSync(SCENARIO_STORE_FILE, JSON.stringify({ users: {} }, null, 2), 'utf8');
  }
  if (!fs.existsSync(MODELING_STORE_FILE)) {
    fs.writeFileSync(MODELING_STORE_FILE, JSON.stringify({ users: {}, sharedAssets: [] }, null, 2), 'utf8');
  }
  if (!fs.existsSync(MODELS_CATALOG_FILE)) {
    fs.writeFileSync(MODELS_CATALOG_FILE, JSON.stringify({ models: [] }, null, 2), 'utf8');
  }
  if (!fs.existsSync(CARDS_STORE_FILE)) {
    fs.writeFileSync(CARDS_STORE_FILE, JSON.stringify({ users: {} }, null, 2), 'utf8');
  }
  if (!fs.existsSync(MAPS_UPLOADS_DIR)) {
    fs.mkdirSync(MAPS_UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(MAPS_STORE_FILE)) {
    fs.writeFileSync(MAPS_STORE_FILE, JSON.stringify([], null, 2), 'utf8');
  }
};

const readModelsCatalog = () => {
  ensureAudioStore();
  try {
    const raw = fs.readFileSync(MODELS_CATALOG_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.models)) return { models: [] };
    return parsed;
  } catch (_e) {
    return { models: [] };
  }
};

const writeModelsCatalog = (data) => {
  ensureAudioStore();
  fs.writeFileSync(MODELS_CATALOG_FILE, JSON.stringify(data, null, 2), 'utf8');
};

const readAudioStore = () => {
  ensureAudioStore();
  try {
    const raw = fs.readFileSync(AUDIO_STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.users || typeof parsed.users !== 'object') {
      return { users: {} };
    }
    return parsed;
  } catch (_e) {
    return { users: {} };
  }
};

const writeAudioStore = (data) => {
  ensureAudioStore();
  fs.writeFileSync(AUDIO_STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
};

const readScenarioStore = () => {
  ensureAudioStore();
  try {
    const raw = fs.readFileSync(SCENARIO_STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.users || typeof parsed.users !== 'object') {
      return { users: {} };
    }
    return parsed;
  } catch (_e) {
    return { users: {} };
  }
};

const writeScenarioStore = (data) => {
  ensureAudioStore();
  fs.writeFileSync(SCENARIO_STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
};

const readModelingStore = () => {
  ensureAudioStore();
  try {
    const raw = fs.readFileSync(MODELING_STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { users: {}, sharedAssets: [] };
    }
    return {
      users: parsed.users && typeof parsed.users === 'object' ? parsed.users : {},
      sharedAssets: Array.isArray(parsed.sharedAssets) ? parsed.sharedAssets : []
    };
  } catch (_e) {
    return { users: {}, sharedAssets: [] };
  }
};

const writeModelingStore = (data) => {
  ensureAudioStore();
  fs.writeFileSync(MODELING_STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
};

const allowedModelShapes = new Set(['cube', 'sphere', 'cylinder', 'cone']);
const normalizeVector = (value) => ({
  x: Number(value?.x || 0),
  y: Number(value?.y || 0),
  z: Number(value?.z || 0)
});

const sanitizeModelBlock = (block) => ({
  id: String(block?.id || createId()),
  shape: allowedModelShapes.has(String(block?.shape || '').toLowerCase())
    ? String(block.shape).toLowerCase()
    : 'cube',
  color: String(block?.color || '#b77933').slice(0, 16),
  size: Math.max(0.3, Math.min(3, Number(block?.size || 1))),
  position: normalizeVector(block?.position),
});

const sanitizeModelAsset = (asset) => ({
  id: String(asset?.id || createId()),
  name: String(asset?.name || '').trim() || 'Asset sans nom',
  blocks: Array.isArray(asset?.blocks) ? asset.blocks.map(sanitizeModelBlock).slice(0, 500) : [],
  updatedAt: asset?.updatedAt ? new Date(asset.updatedAt).toISOString() : new Date().toISOString(),
});

const normalizeUserKey = (value) => String(value || '').trim().toLowerCase();
const getUserKeyFromRequest = (req) => normalizeUserKey(req.header('x-user-email') || req.query.userEmail || req.body?.userEmail);
const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

app.use('/uploads/audio', express.static(AUDIO_UPLOADS_DIR));
app.use('/uploads/pdf',   express.static(PDF_UPLOADS_DIR));
app.use('/uploads/maps',  express.static(MAPS_UPLOADS_DIR));

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureAudioStore();
    cb(null, AUDIO_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext || '.mp3';
    cb(null, `${createId()}${safeExt}`);
  }
});

const uploadAudio = multer({
  storage: uploadStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('audio/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only audio files are allowed.'));
  }
});

const uploadPdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureAudioStore();
    cb(null, PDF_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext === '.pdf' ? '.pdf' : '.pdf';
    cb(null, `${createId()}${safeExt}`);
  }
});

const uploadPdf = multer({
  storage: uploadPdfStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfName = (file.originalname || '').toLowerCase().endsWith('.pdf');
    if (isPdfMime || isPdfName) {
      cb(null, true);
      return;
    }
    cb(new Error('Only PDF files are allowed.'));
  }
});

const scenarioImportJobs = new Map();

const normalizeScenarioText = (value) => String(value || '')
  .replace(/\r/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .replace(/[ \t]{2,}/g, ' ')
  .trim();

const uniqueLimited = (items, limit = 8) => {
  const seen = new Set();
  const output = [];
  items.forEach((item) => {
    const normalized = String(item || '').trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    output.push(normalized);
  });
  return output.slice(0, limit);
};

const classifySceneKind = (text) => {
  const lower = String(text || '').toLowerCase();
  const kinds = [
    { key: 'combat', words: ['combat', 'attaque', 'initiative', 'ennemi', 'boss', 'bataille', 'embuscade'] },
    { key: 'dialogue', words: ['dialogue', 'discute', 'parle', 'negociation', 'interrogatoire', 'conversation'] },
    { key: 'intrigue', words: ['indice', 'mystere', 'enquete', 'piste', 'secret', 'complot', 'trahison'] },
    { key: 'exploration', words: ['explore', 'voyage', 'route', 'donjon', 'temple', 'foret', 'village'] },
    { key: 'transition', words: ['pause', 'repos', 'transition', 'interlude', 'campement', 'deplacement'] }
  ];

  let best = { key: 'narration', score: 0 };
  kinds.forEach((kind) => {
    const score = kind.words.reduce((count, word) => (lower.includes(word) ? count + 1 : count), 0);
    if (score > best.score) best = { key: kind.key, score };
  });
  return best.key;
};

const detectMoodHint = (text) => {
  const lower = String(text || '').toLowerCase();
  if (/(horreur|sombre|terreur|sang|angoisse)/.test(lower)) return 'sombre';
  if (/(epique|heroique|victoire|gloire|sacrifice)/.test(lower)) return 'epique';
  if (/(mystere|enigme|secret|etrange)/.test(lower)) return 'mystere';
  if (/(calme|repos|village|auberge|feu de camp|campement)/.test(lower)) return 'calme';
  if (/(urgence|fuite|course|danger imminent)/.test(lower)) return 'tension';
  return 'neutre';
};

const extractNpcCandidates = (text) => {
  const value = String(text || '');
  const stopWords = new Set(['Scene', 'Chapitre', 'Acte', 'Partie', 'Le', 'La', 'Les', 'Un', 'Une', 'Des', 'Ils', 'Elles']);
  const properNames = value.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/g) || [];
  const explicitRoles = value.match(/\b(?:PNJ|NPC|MJ|garde|roi|reine|marchand|sorcier|prêtre|pretre|capitaine)\b/gi) || [];
  const merged = [...properNames, ...explicitRoles]
    .map((name) => String(name || '').trim())
    .filter((name) => name && !stopWords.has(name));
  return uniqueLimited(merged, 6);
};

const extractLocationCandidates = (text) => {
  const value = String(text || '');
  const locations = [];
  const hintRegex = /\b(?:dans|vers|sur|sous|au|aux|a la|a l'|devant|derriere)\s+([A-Z][^,\n.;:]{1,30})/gi;
  let match = hintRegex.exec(value);
  while (match) {
    locations.push(String(match[1] || '').trim());
    match = hintRegex.exec(value);
  }
  const explicit = value.match(/\b(?:village|chateau|donjon|foret|temple|caverne|taverne|camp|ville|tour)\b/gi) || [];
  return uniqueLimited([...locations, ...explicit], 6);
};

const buildTriggerKeywords = (text, title) => {
  const combined = `${title || ''} ${text || ''}`.toLowerCase();
  const dictionary = [
    'combat', 'boss', 'fuite', 'mystere', 'enquete', 'negociation', 'exploration', 'embuscade',
    'rituel', 'donjon', 'village', 'taverne', 'revelation', 'trahison', 'urgence', 'repos'
  ];
  const hits = dictionary.filter((word) => combined.includes(word));
  return uniqueLimited(hits, 8);
};

const splitTextIntoScenes = (text) => {
  const normalized = normalizeScenarioText(text);
  if (!normalized) {
    return {
      moments: [],
      totalDetectedScenes: 0,
      wasTruncated: false,
      maxScenes: getPdfMaxScenes()
    };
  }

  const blocks = normalized
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const headingRegex = /^(chapitre|chapter|scene|acte|partie|séquence|sequence|episode|épisode)\b/i;
  const scenes = [];
  let current = { title: 'Scene 1', chunks: [] };

  const pushCurrent = () => {
    const body = current.chunks.join('\n\n').trim();
    if (!body) return;
    scenes.push({
      title: current.title,
      notes: body.slice(0, 1200),
      body
    });
  };

  blocks.forEach((block) => {
    const firstLine = block.split('\n')[0].trim();
    const isHeading = headingRegex.test(firstLine) || /^#{1,6}\s+/.test(firstLine);
    const currentSize = current.chunks.join('\n\n').length;

    if (isHeading) {
      pushCurrent();
      current = {
        title: firstLine.replace(/^#{1,6}\s+/, '').trim() || `Scene ${scenes.length + 1}`,
        chunks: [block]
      };
      return;
    }

    if (currentSize > 1400) {
      pushCurrent();
      current = {
        title: `Scene ${scenes.length + 1}`,
        chunks: [block]
      };
      return;
    }

    current.chunks.push(block);
  });

  pushCurrent();

  const maxScenes = getPdfMaxScenes();
  const totalDetectedScenes = scenes.length;
  const wasTruncated = totalDetectedScenes > maxScenes;
  const limitedScenes = wasTruncated ? scenes.slice(0, maxScenes) : scenes;

  const moments = limitedScenes.map((scene, index) => {
    const sceneKind = classifySceneKind(scene.body);
    const moodHint = detectMoodHint(scene.body);
    const npcs = extractNpcCandidates(scene.body);
    const locations = extractLocationCandidates(scene.body);
    const triggerKeywords = buildTriggerKeywords(scene.body, scene.title);
    return {
      id: createId(),
      title: scene.title || `Scene ${index + 1}`,
      notes: scene.notes,
      audioTrackId: '',
      cardType: sceneKind,
      ambiance: moodHint,
      imageUrl: '',
      mapUrl: '',
      trackUrl: '',
      attachedCharacterSheetIds: [],
      invitedTemplateKeys: [],
      sceneKind,
      moodHint,
      npcs,
      locations,
      triggerKeywords,
      createdAt: new Date().toISOString()
    };
  });

  return {
    moments,
    totalDetectedScenes,
    wasTruncated,
    maxScenes
  };
};

const updateScenarioJob = (jobId, patch) => {
  const previous = scenarioImportJobs.get(jobId);
  if (!previous) return;
  scenarioImportJobs.set(jobId, { ...previous, ...patch });
};

const processScenarioPdf = async (jobId, userKey, filePath, originalName) => {
  try {
    updateScenarioJob(jobId, {
      status: 'processing',
      progress: 10,
      message: 'Lecture du fichier PDF...'
    });

    const buffer = fs.readFileSync(filePath);
    updateScenarioJob(jobId, {
      progress: 35,
      message: 'Extraction du texte en cours...'
    });

    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    const fullText = normalizeScenarioText(parsed?.text || '');
    await parser.destroy();
    updateScenarioJob(jobId, {
      progress: 68,
      message: 'Decoupage automatique en scenes...'
    });

    const extraction = splitTextIntoScenes(fullText);
    const moments = extraction.moments;
    updateScenarioJob(jobId, {
      progress: 86,
      message: 'Sauvegarde du scenario...'
    });

    const store = readScenarioStore();
    const previous = store.users[userKey] || DEFAULT_SCENARIO_STATE;
    store.users[userKey] = {
      ...previous,
      sourceDocument: {
        fileName: originalName,
        importedAt: new Date().toISOString(),
        totalDetectedScenes: extraction.totalDetectedScenes,
        wasTruncated: extraction.wasTruncated,
        maxScenes: extraction.maxScenes
      },
      rawTextLength: fullText.length,
      moments,
      updatedAt: new Date().toISOString()
    };
    writeScenarioStore(store);

    updateScenarioJob(jobId, {
      status: 'completed',
      progress: 100,
      message: 'Analyse terminee. Scenes pretes.',
      result: {
        momentsCount: moments.length,
        totalDetectedScenes: extraction.totalDetectedScenes,
        wasTruncated: extraction.wasTruncated,
        maxScenes: extraction.maxScenes
      },
      finishedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Scenario PDF processing error:', error);
    updateScenarioJob(jobId, {
      status: 'failed',
      progress: 100,
      message: 'Echec de l\'analyse du PDF.',
      error: String(error?.message || 'Unknown error'),
      finishedAt: new Date().toISOString()
    });
  } finally {
    try {
      fs.unlinkSync(filePath);
    } catch (_e) {
      // no-op
    }
  }
};

app.get('/api/audio/state', (req, res) => {
  const userKey = getUserKeyFromRequest(req);
  if (!userKey) {
    return res.status(400).json({ error: 'Missing user identity (x-user-email).' });
  }

  const store = readAudioStore();
  const userState = store.users[userKey] || DEFAULT_AUDIO_STATE;
  return res.json({
    tracks: Array.isArray(userState.tracks) ? userState.tracks : [],
    playlists: Array.isArray(userState.playlists) ? userState.playlists : [],
    settings: { ...DEFAULT_AUDIO_SETTINGS, ...(userState.settings || {}) }
  });
});

app.put('/api/audio/state', (req, res) => {
  const userKey = getUserKeyFromRequest(req);
  if (!userKey) {
    return res.status(400).json({ error: 'Missing user identity (x-user-email).' });
  }

  const incomingTracks = Array.isArray(req.body?.tracks) ? req.body.tracks : [];
  const incomingPlaylists = Array.isArray(req.body?.playlists) ? req.body.playlists : [];
  const incomingSettings = req.body?.settings && typeof req.body.settings === 'object' ? req.body.settings : {};

  const store = readAudioStore();
  store.users[userKey] = {
    tracks: incomingTracks,
    playlists: incomingPlaylists,
    settings: { ...DEFAULT_AUDIO_SETTINGS, ...incomingSettings },
    updatedAt: new Date().toISOString()
  };
  writeAudioStore(store);

  return res.json({ ok: true });
});

app.post('/api/audio/upload', uploadAudio.single('file'), (req, res) => {
  const userKey = getUserKeyFromRequest(req);
  if (!userKey) {
    return res.status(400).json({ error: 'Missing user identity (x-user-email).' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Missing audio file.' });
  }

  const title = String(req.body?.title || '').trim() || req.file.originalname;
  const artist = String(req.body?.artist || '').trim() || 'Unknown';
  const category = String(req.body?.category || 'ambiance');
  const description = String(req.body?.description || '').trim();
  const allowedCategories = ['ambiance', 'combat', 'enquete', 'dialogues', 'fond_sonore', 'bruits'];
  const safeCategory = allowedCategories.includes(category) ? category : 'ambiance';

  const relativeUrl = `/uploads/audio/${req.file.filename}`;
  const track = {
    id: createId(),
    title,
    artist,
    duration: 180,
    category: safeCategory,
    source: 'file',
    url: relativeUrl,
    isFavorite: false,
    uploadedAt: new Date().toISOString(),
    fileSize: Number((req.file.size / (1024 * 1024)).toFixed(2)),
    description
  };

  const store = readAudioStore();
  const userState = store.users[userKey] || { ...DEFAULT_AUDIO_STATE };
  const tracks = Array.isArray(userState.tracks) ? userState.tracks : [];
  const playlists = Array.isArray(userState.playlists) ? userState.playlists : [];
  const settings = { ...DEFAULT_AUDIO_SETTINGS, ...(userState.settings || {}) };

  store.users[userKey] = {
    tracks: [...tracks, track],
    playlists,
    settings,
    updatedAt: new Date().toISOString()
  };
  writeAudioStore(store);

  return res.json({ ok: true, track });
});

app.get('/api/scenario/state', (req, res) => {
  const userKey = getUserKeyFromRequest(req);
  if (!userKey) {
    return res.status(400).json({ error: 'Missing user identity (x-user-email).' });
  }

  const store = readScenarioStore();
  const userState = store.users[userKey] || DEFAULT_SCENARIO_STATE;
  const safeMeta = {
    ...DEFAULT_SCENARIO_STATE.adventureMeta,
    ...(userState.adventureMeta && typeof userState.adventureMeta === 'object' ? userState.adventureMeta : {})
  };
  return res.json({
    moments: Array.isArray(userState.moments) ? userState.moments : [],
    characterSheets: Array.isArray(userState.characterSheets) ? userState.characterSheets : [],
    adventureMeta: safeMeta
  });
});

app.put('/api/scenario/state', (req, res) => {
  const userKey = getUserKeyFromRequest(req);
  if (!userKey) {
    return res.status(400).json({ error: 'Missing user identity (x-user-email).' });
  }

  const hasIncomingMoments = Array.isArray(req.body?.moments);
  const hasIncomingCharacterSheets = Array.isArray(req.body?.characterSheets);
  const incomingAdventureMeta = req.body?.adventureMeta && typeof req.body.adventureMeta === 'object'
    ? req.body.adventureMeta
    : null;

  const store = readScenarioStore();
  const previousState = store.users[userKey] || DEFAULT_SCENARIO_STATE;

  const incomingMoments = hasIncomingMoments
    ? req.body.moments
    : (Array.isArray(previousState.moments) ? previousState.moments : []);
  const incomingCharacterSheets = hasIncomingCharacterSheets
    ? req.body.characterSheets
    : (Array.isArray(previousState.characterSheets) ? previousState.characterSheets : []);

  const safeCharacterSheets = incomingCharacterSheets.map((sheet) => ({
    id: String(sheet?.id || createId()),
    name: String(sheet?.name || '').trim(),
    notes: String(sheet?.notes || '').trim(),
    url: String(sheet?.url || '').trim(),
    entityType: String(sheet?.entityType || 'pnj').trim().toLowerCase(),
    source: sheet?.source === 'template' ? 'template' : 'specific',
    templateKey: String(sheet?.templateKey || '').trim(),
    isConvoy: Boolean(sheet?.isConvoy),
    createdAt: sheet?.createdAt ? new Date(sheet.createdAt).toISOString() : new Date().toISOString()
  })).filter((sheet) => sheet.name);

  const safeCharacterSheetIds = new Set(safeCharacterSheets.map((sheet) => sheet.id));
  const safeMoments = incomingMoments.map((moment) => ({
    id: String(moment?.id || createId()),
    title: String(moment?.title || '').trim(),
    notes: String(moment?.notes || '').trim(),
    audioTrackId: String(moment?.audioTrackId || '').trim(),
    cardType: String(moment?.cardType || moment?.sceneKind || 'narration').trim(),
    ambiance: String(moment?.ambiance || moment?.moodHint || 'neutre').trim(),
    imageUrl: String(moment?.imageUrl || '').trim(),
    mapUrl: String(moment?.mapUrl || '').trim(),
    trackUrl: String(moment?.trackUrl || '').trim(),
    attachedCharacterSheetIds: uniqueLimited(Array.isArray(moment?.attachedCharacterSheetIds) ? moment.attachedCharacterSheetIds : [], 30)
      .filter((id) => safeCharacterSheetIds.has(String(id))),
    invitedTemplateKeys: uniqueLimited(Array.isArray(moment?.invitedTemplateKeys) ? moment.invitedTemplateKeys : [], 40),
    attachedCardIds: uniqueLimited(Array.isArray(moment?.attachedCardIds) ? moment.attachedCardIds.map((id) => String(id)) : [], 50),
    sceneKind: String(moment?.sceneKind || 'narration').trim(),
    moodHint: String(moment?.moodHint || 'neutre').trim(),
    npcs: uniqueLimited(Array.isArray(moment?.npcs) ? moment.npcs : [], 10),
    locations: uniqueLimited(Array.isArray(moment?.locations) ? moment.locations : [], 10),
    triggerKeywords: uniqueLimited(Array.isArray(moment?.triggerKeywords) ? moment.triggerKeywords : [], 12),
    createdAt: moment?.createdAt ? new Date(moment.createdAt).toISOString() : new Date().toISOString()
  })).filter((moment) => moment.title);

  const mergedMeta = {
    ...DEFAULT_SCENARIO_STATE.adventureMeta,
    ...(previousState.adventureMeta && typeof previousState.adventureMeta === 'object' ? previousState.adventureMeta : {}),
    ...(incomingAdventureMeta || {})
  };
  const safeAdventureMeta = {
    adventureName: String(mergedMeta.adventureName || '').trim(),
    gameSystem: String(mergedMeta.gameSystem || '').trim(),
    adventureType: String(mergedMeta.adventureType || '').trim(),
    playerCount: Math.max(1, Math.min(20, Number(mergedMeta.playerCount || 4))),
    ruleMode: String(mergedMeta.ruleMode || '').trim(),
    worldStyle: String(mergedMeta.worldStyle || '').trim(),
    summary: String(mergedMeta.summary || '').trim()
  };

  store.users[userKey] = {
    moments: safeMoments,
    characterSheets: safeCharacterSheets,
    adventureMeta: safeAdventureMeta,
    updatedAt: new Date().toISOString()
  };
  writeScenarioStore(store);

  return res.json({ ok: true });
});

app.post('/api/scenario/pdf/upload', uploadPdf.single('file'), (req, res) => {
  const userKey = getUserKeyFromRequest(req);
  if (!userKey) {
    return res.status(400).json({ error: 'Missing user identity (x-user-email).' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Missing PDF file.' });
  }

  const jobId = createId();
  const job = {
    id: jobId,
    userKey,
    status: 'queued',
    progress: 0,
    message: 'Fichier recu. Analyse en attente...',
    createdAt: new Date().toISOString(),
    result: null
  };

  scenarioImportJobs.set(jobId, job);
  processScenarioPdf(jobId, userKey, req.file.path, req.file.originalname);

  return res.json({ ok: true, jobId });
});

app.get('/api/scenario/pdf/job/:jobId', (req, res) => {
  const userKey = getUserKeyFromRequest(req);
  if (!userKey) {
    return res.status(400).json({ error: 'Missing user identity (x-user-email).' });
  }

  const job = scenarioImportJobs.get(String(req.params.jobId || ''));
  if (!job || job.userKey !== userKey) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  return res.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    message: job.message,
    result: job.result || null,
    error: job.error || null,
    createdAt: job.createdAt,
    finishedAt: job.finishedAt || null
  });
});

app.get('/api/modeling/state', (req, res) => {
  const userKey = getUserKeyFromRequest(req);
  if (!userKey) {
    return res.status(400).json({ error: 'Missing user identity (x-user-email).' });
  }

  const store = readModelingStore();
  const userState = store.users[userKey] || DEFAULT_MODELING_STATE;
  return res.json({
    assets: Array.isArray(userState.assets) ? userState.assets.map(sanitizeModelAsset) : [],
    sharedAssets: Array.isArray(store.sharedAssets) ? store.sharedAssets.map(sanitizeModelAsset) : []
  });
});

app.put('/api/modeling/state', (req, res) => {
  const userKey = getUserKeyFromRequest(req);
  if (!userKey) {
    return res.status(400).json({ error: 'Missing user identity (x-user-email).' });
  }

  const incomingAssets = Array.isArray(req.body?.assets) ? req.body.assets : [];
  const safeAssets = incomingAssets.map(sanitizeModelAsset).slice(0, 120);

  const store = readModelingStore();
  store.users[userKey] = {
    assets: safeAssets,
    updatedAt: new Date().toISOString()
  };
  writeModelingStore(store);

  return res.json({ ok: true });
});

app.post('/api/modeling/share', (req, res) => {
  const userKey = getUserKeyFromRequest(req);
  if (!userKey) {
    return res.status(400).json({ error: 'Missing user identity (x-user-email).' });
  }

  const assetId = String(req.body?.assetId || '').trim();
  if (!assetId) {
    return res.status(400).json({ error: 'Missing assetId.' });
  }

  const store = readModelingStore();
  const userAssets = Array.isArray(store.users[userKey]?.assets)
    ? store.users[userKey].assets.map(sanitizeModelAsset)
    : [];
  const asset = userAssets.find((candidate) => candidate.id === assetId);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found for this user.' });
  }

  const sharedAsset = {
    ...asset,
    id: `${asset.id}::${userKey}`,
    owner: userKey,
    sourceAssetId: asset.id,
    sharedAt: new Date().toISOString(),
  };
  const nextSharedAssets = Array.isArray(store.sharedAssets) ? [...store.sharedAssets] : [];
  const existingIndex = nextSharedAssets.findIndex((candidate) => String(candidate.id) === sharedAsset.id);
  if (existingIndex >= 0) {
    nextSharedAssets[existingIndex] = sharedAsset;
  } else {
    nextSharedAssets.push(sharedAsset);
  }
  store.sharedAssets = nextSharedAssets.slice(-500);
  writeModelingStore(store);

  return res.json({ ok: true, sharedId: sharedAsset.id });
});

// ─── Multer GLB/GLTF ─────────────────────────────────────────────────────────
const uploadGlbStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureAudioStore();
    cb(null, MODELS_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.glb', '.gltf'].includes(ext) ? ext : '.glb';
    cb(null, `${createId()}${safeExt}`);
  }
});

const uploadGlb = multer({
  storage: uploadGlbStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const validMime = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'].includes(file.mimetype);
    const validExt  = ['.glb', '.gltf'].includes(ext);
    if (validMime || validExt) { cb(null, true); return; }
    cb(new Error('Seuls les fichiers .glb et .gltf sont acceptés.'));
  }
});

app.use('/uploads/models', express.static(MODELS_UPLOADS_DIR));

// ─── Routes /api/models ───────────────────────────────────────────────────────
const VALID_MODEL_CATEGORIES = new Set(['heros', 'paysans', 'animaux', 'monstres', 'objets', 'autre']);

app.get('/api/models', (_req, res) => {
  const catalog = readModelsCatalog();
  return res.json({ models: catalog.models });
});

app.post('/api/models/upload', uploadGlb.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Fichier .glb ou .gltf manquant.' });
  }

  const name        = String(req.body?.name || '').trim() || req.file.originalname.replace(/\.[^.]+$/, '');
  const rawCategory = String(req.body?.category || 'autre').trim().toLowerCase();
  const category    = VALID_MODEL_CATEGORIES.has(rawCategory) ? rawCategory : 'autre';
  const description = String(req.body?.description || '').trim().slice(0, 500);
  const rawTags     = String(req.body?.tags || '').trim();
  const tags        = rawTags
    ? rawTags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10)
    : [];

  const entry = {
    id:          createId(),
    name,
    category,
    description,
    tags,
    filename:    req.file.filename,
    url:         `/uploads/models/${req.file.filename}`,
    fileSize:    Number((req.file.size / (1024 * 1024)).toFixed(2)),
    uploadedAt:  new Date().toISOString(),
  };

  const catalog = readModelsCatalog();
  catalog.models.push(entry);
  writeModelsCatalog(catalog);

  return res.json({ ok: true, model: entry });
});

app.delete('/api/models/:id', (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'ID manquant.' });

  const catalog = readModelsCatalog();
  const index   = catalog.models.findIndex(m => m.id === id);
  if (index === -1) return res.status(404).json({ error: 'Modèle introuvable.' });

  const [removed] = catalog.models.splice(index, 1);
  writeModelsCatalog(catalog);

  const filePath = path.join(MODELS_UPLOADS_DIR, removed.filename);
  try { fs.unlinkSync(filePath); } catch (_e) { /* fichier déjà absent */ }

  return res.json({ ok: true });
});

// ─── Cards store ─────────────────────────────────────────────────────────────
const ALLOWED_CARD_TYPES = new Set(['pj', 'pnj', 'objet', 'lieu', 'situation', 'custom']);

const readCardsStore = () => {
  ensureAudioStore();
  try {
    const raw = fs.readFileSync(CARDS_STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.users || typeof parsed.users !== 'object') {
      return { users: {} };
    }
    return parsed;
  } catch (_e) {
    return { users: {} };
  }
};

const writeCardsStore = (data) => {
  ensureAudioStore();
  fs.writeFileSync(CARDS_STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
};

const sanitizeCard = (card) => ({
  id: String(card?.id || createId()),
  type: ALLOWED_CARD_TYPES.has(String(card?.type || '')) ? String(card.type) : 'custom',
  name: String(card?.name || '').trim().slice(0, 120),
  description: String(card?.description || '').trim().slice(0, 1000),
  stats: Array.isArray(card?.stats)
    ? card.stats
        .filter((s) => s && String(s.label || '').trim())
        .map((s) => ({ label: String(s.label || '').trim().slice(0, 60), value: String(s.value || '').trim().slice(0, 80) }))
        .slice(0, 12)
    : [],
  tags: Array.isArray(card?.tags)
    ? card.tags.map((t) => String(t || '').trim().toLowerCase()).filter(Boolean).slice(0, 8)
    : [],
  createdAt: card?.createdAt ? new Date(card.createdAt).toISOString() : new Date().toISOString(),
  playedAt: card?.playedAt ? new Date(card.playedAt).toISOString() : null,
  playedBy: String(card?.playedBy || '').trim().slice(0, 80),
  effects: Array.isArray(card?.effects)
    ? card.effects.map((e) => String(e || '').trim().slice(0, 200)).filter(Boolean).slice(0, 10)
    : [],
});

const DEFAULT_CARDS_STATE = { library: [], feed: [] };

app.get('/api/cards/state', (req, res) => {
  const userKey = getUserKeyFromRequest(req);
  if (!userKey) return res.status(400).json({ error: 'Missing user identity (x-user-email).' });

  const store = readCardsStore();
  const userState = store.users[userKey] || DEFAULT_CARDS_STATE;
  return res.json({
    library: Array.isArray(userState.library) ? userState.library : [],
    feed: Array.isArray(userState.feed) ? userState.feed : [],
  });
});

app.put('/api/cards/state', (req, res) => {
  const userKey = getUserKeyFromRequest(req);
  if (!userKey) return res.status(400).json({ error: 'Missing user identity (x-user-email).' });

  const incomingLibrary = Array.isArray(req.body?.library) ? req.body.library : null;
  const incomingFeed = Array.isArray(req.body?.feed) ? req.body.feed : null;

  const store = readCardsStore();
  const prev = store.users[userKey] || DEFAULT_CARDS_STATE;

  store.users[userKey] = {
    library: incomingLibrary
      ? incomingLibrary.map(sanitizeCard).filter((c) => c.name).slice(0, 300)
      : (Array.isArray(prev.library) ? prev.library : []),
    feed: incomingFeed
      ? incomingFeed.map(sanitizeCard).slice(0, 500)
      : (Array.isArray(prev.feed) ? prev.feed : []),
    updatedAt: new Date().toISOString(),
  };
  writeCardsStore(store);

  return res.json({ ok: true });
});

app.post('/api/cards/play', (req, res) => {
  const userKey = getUserKeyFromRequest(req);
  if (!userKey) return res.status(400).json({ error: 'Missing user identity (x-user-email).' });

  const cardId = String(req.body?.cardId || '').trim();
  const playedBy = String(req.body?.playedBy || '').trim().slice(0, 80);
  const effects = Array.isArray(req.body?.effects)
    ? req.body.effects.map((e) => String(e || '').trim().slice(0, 200)).filter(Boolean).slice(0, 10)
    : [];

  if (!cardId) return res.status(400).json({ error: 'Missing cardId.' });

  const store = readCardsStore();
  const userState = store.users[userKey] || DEFAULT_CARDS_STATE;
  const library = Array.isArray(userState.library) ? userState.library : [];
  const feed = Array.isArray(userState.feed) ? userState.feed : [];

  const source = library.find((c) => c.id === cardId);
  if (!source) return res.status(404).json({ error: 'Card not found in library.' });

  const playedCard = {
    ...sanitizeCard(source),
    id: createId(),
    sourceCardId: source.id,
    playedAt: new Date().toISOString(),
    playedBy,
    effects,
  };

  store.users[userKey] = {
    library,
    feed: [...feed, playedCard].slice(-500),
    updatedAt: new Date().toISOString(),
  };
  writeCardsStore(store);

  return res.json({ ok: true, card: playedCard });
});

app.post('/api/cards/play-instant', (req, res) => {
  const userKey = getUserKeyFromRequest(req);
  if (!userKey) return res.status(400).json({ error: 'Missing user identity (x-user-email).' });

  const templateId  = String(req.body?.templateId || '').trim();
  const name        = String(req.body?.name || '').trim().slice(0, 120);
  const description = String(req.body?.description || '').trim().slice(0, 1000);
  const type        = ALLOWED_CARD_TYPES.has(String(req.body?.type || '')) ? String(req.body.type) : 'action';
  const playedBy    = String(req.body?.playedBy || '').trim().slice(0, 80);
  const result      = String(req.body?.result || '').trim().slice(0, 60);
  const effects = Array.isArray(req.body?.effects)
    ? req.body.effects.map((e) => String(e || '').trim().slice(0, 200)).filter(Boolean).slice(0, 10)
    : [];
  const incomingStats = Array.isArray(req.body?.stats)
    ? req.body.stats
        .filter((s) => s && String(s.label || '').trim())
        .map((s) => ({ label: String(s.label || '').trim().slice(0, 60), value: String(s.value || '').trim().slice(0, 80) }))
        .slice(0, 12)
    : [];
  const tags = Array.isArray(req.body?.tags)
    ? req.body.tags.map((t) => String(t || '').trim().toLowerCase()).filter(Boolean).slice(0, 8)
    : [];

  if (!name) return res.status(400).json({ error: 'Missing card name.' });

  const stats = result
    ? [{ label: 'Résultat', value: result }, ...incomingStats]
    : incomingStats;

  const playedCard = {
    id: createId(),
    templateId: templateId || null,
    type,
    name,
    description,
    stats,
    tags,
    createdAt: new Date().toISOString(),
    playedAt: new Date().toISOString(),
    playedBy,
    effects,
    sourceCardId: null,
  };

  const store = readCardsStore();
  const userState = store.users[userKey] || DEFAULT_CARDS_STATE;
  const feed = Array.isArray(userState.feed) ? userState.feed : [];

  store.users[userKey] = {
    library: Array.isArray(userState.library) ? userState.library : [],
    feed: [...feed, playedCard].slice(-500),
    updatedAt: new Date().toISOString(),
  };
  writeCardsStore(store);

  return res.json({ ok: true, card: playedCard });
});

// ─── Maps ────────────────────────────────────────────────────────────────────

const readMapsStore = () => {
  ensureAudioStore();
  try {
    const raw = fs.readFileSync(MAPS_STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_e) { return []; }
};

const writeMapsStore = (data) => {
  ensureAudioStore();
  fs.writeFileSync(MAPS_STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
};

const mapImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => { ensureAudioStore(); cb(null, MAPS_UPLOADS_DIR); },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
    cb(null, `${createId()}${ext}`);
  }
});
const uploadMapImage = multer({
  storage: mapImageStorage,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) { cb(null, true); return; }
    cb(new Error('Only image files are allowed.'));
  }
});

app.get('/api/maps', (_req, res) => {
  res.json(readMapsStore());
});

app.post('/api/maps', (req, res) => {
  const { name, imageUrl, gridData } = req.body || {};
  const map = {
    id: createId(),
    name: String(name || '').trim() || 'Map sans titre',
    imageUrl: imageUrl ? String(imageUrl).trim() : null,
    gridData: gridData ?? null,
    pins: [],
    zones: [],
    fogData: null,
    grid: null,
    scale: { pixelsPerUnit: 50, unitLabel: 'm' },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const store = readMapsStore();
  store.push(map);
  writeMapsStore(store);
  res.json(map);
});

app.put('/api/maps/:id', (req, res) => {
  const { id } = req.params;
  const store = readMapsStore();
  const idx = store.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Map not found' });
  const allowed = ['name', 'imageUrl', 'pins', 'zones', 'fogData', 'grid', 'scale', 'gridData'];
  const patch = {};
  allowed.forEach(k => { if (req.body && k in req.body) patch[k] = req.body[k]; });
  store[idx] = { ...store[idx], ...patch, updatedAt: Date.now() };
  writeMapsStore(store);
  res.json(store[idx]);
});

app.delete('/api/maps/:id', (req, res) => {
  const { id } = req.params;
  const store = readMapsStore();
  const filtered = store.filter(m => m.id !== id);
  writeMapsStore(filtered);
  res.json({ ok: true });
});

app.post('/api/maps/upload', uploadMapImage.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const url = `/uploads/maps/${req.file.filename}`;
  res.json({ ok: true, url });
});

// Routes de base
app.get('/', (req, res) => {
  res.json({ message: 'Roll API is running!' });
});

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  console.log('Nouveau client connecté:', socket.id);

  // Gestion des lancers de dés
  socket.on('dice-roll', (data) => {
    console.log('Lancement de dés reçu:', data);
    
    // Diffuser le résultat à tous les clients
    socket.broadcast.emit('dice-roll-result', {
      ...data,
      timestamp: new Date(),
      socketId: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Port par défaut
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Serveur Roll API démarré sur le port ${PORT}`);
  console.log(`📡 Socket.io disponible sur ws://localhost:${PORT}`);
}); 