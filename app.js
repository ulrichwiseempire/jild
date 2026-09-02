/* =========================================================
   JILD — logique appli connectée à Supabase
   ========================================================= */

const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

let currentUser = null;      // objet auth Supabase
let myProfile = null;        // ligne de la table profiles
let viewedProfileId = null;  // profil actuellement affiché dans l'écran "profile"
let composeMedia = {         // état du post en cours de création
  image: null, video: null,
  audio: null                // { mode:'existing', file_url, title, artist } ou { mode:'new', file, title, artist }
};

/* ---------- utilitaires ---------- */
function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return [...root.querySelectorAll(sel)]; }
function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return Math.floor(diff / 60) + 'm';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h';
  return Math.floor(diff / 86400) + 'j';
}
function verifiedBadge(profile) {
  if (!profile || !profile.is_verified) return '';
  return '<span class="icon-svg badge-verified" data-icon="check-badge" style="width:15px;height:15px;"></span>';
}
ICONS_EXTRA_LOADED = false;

/* ---------- upload de fichier vers un bucket ---------- */
async function uploadToBucket(bucket, file) {
  const ext = file.name.split('.').pop();
  const path = `${currentUser.id}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/* =========================================================
   AUTH
   ========================================================= */
async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) await handleSignedIn(session.user);
  else showAuthScreen();

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) await handleSignedIn(session.user);
    if (event === 'SIGNED_OUT') { currentUser = null; myProfile = null; showAuthScreen(); }
  });
}

async function handleSignedIn(user) {
  currentUser = user;
  let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (!profile) {
    // filet de sécurité si le profil n'a pas été créé à l'inscription
    const username = 'user' + user.id.slice(0, 6);
    await supabase.from('profiles').insert({ id: user.id, username, display_name: username });
    ({ data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle());
  }
  myProfile = profile;
  showApp();
  loadFeed();
}

function showAuthScreen() {
  $('#auth-overlay').style.display = 'flex';
  $('#app-root').style.display = 'none';
}
function showApp() {
  $('#auth-overlay').style.display = 'none';
  $('#app-root').style.display = 'flex';
  renderMyProfileHeader();
}

async function doSignUp() {
  const email = $('#auth-email').value.trim();
  const password = $('#auth-password').value;
  const username = $('#auth-username').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const errEl = $('#auth-error');
  errEl.textContent = '';
  if (!email || !password || !username) { errEl.textContent = 'Remplis tous les champs.'; return; }
  if (password.length < 6) { errEl.textContent = 'Le mot de passe doit faire 6 caractères minimum.'; return; }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) { errEl.textContent = error.message; return; }

  if (data.user) {
    const { error: profErr } = await supabase.from('profiles').insert({
      id: data.user.id, username, display_name: username
    });
    if (profErr) { errEl.textContent = "Ce nom d'utilisateur est peut-être déjà pris."; return; }
  }
  if (!data.session) {
    errEl.style.color = 'var(--accent)';
    errEl.textContent = 'Compte créé ! Vérifie ta boîte mail pour confirmer, puis connecte-toi.';
  }
}

async function doSignIn() {
  const email = $('#auth-email').value.trim();
  const password = $('#auth-password').value;
  const errEl = $('#auth-error');
  errEl.style.color = 'var(--heart)';
  errEl.textContent = '';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) errEl.textContent = 'Email ou mot de passe incorrect.';
}

async function doSignOut() {
  await supabase.auth.signOut();
}

function toggleAuthMode() {
  const isSignup = $('#auth-form').dataset.mode === 'signup';
  $('#auth-form').dataset.mode = isSignup ? 'login' : 'signup';
  $('#auth-username-row').style.display = isSignup ? 'none' : 'block';
  $('#auth-title').textContent = isSignup ? 'Connexion' : 'Créer un compte';
  $('#auth-submit').textContent = isSignup ? 'Se connecter' : "S'inscrire";
  $('#auth-switch-text').textContent = isSignup ? "Pas encore de compte ?" : 'Déjà un compte ?';
  $('#auth-switch-link').textContent = isSignup ? "S'inscrire" : 'Se connecter';
  $('#auth-error').textContent = '';
}

/* =========================================================
   FEED
   ========================================================= */
async function loadFeed() {
  const feedEl = $('#screen-feed');
  feedEl.innerHTML = '<div class="empty">Chargement du fil...</div>';

  const { data: followRows } = await supabase.from('follows').select('following_id').eq('follower_id', currentUser.id);
  const followingIds = (followRows || []).map(r => r.following_id);

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*, profiles:author_id(*), post_media(*)')
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) { feedEl.innerHTML = `<div class="empty">Erreur de chargement : ${escapeHtml(error.message)}</div>`; return; }
  if (!posts || posts.length === 0) {
    feedEl.innerHTML = '<div class="empty"><div class="big">Le fil est vide</div>Sois le premier à publier quelque chose !</div>';
    return;
  }

  // posts des comptes suivis d'abord, puis le reste (recommandations) — les deux triés par date
  const mine = posts.filter(p => followingIds.includes(p.author_id) || p.author_id === currentUser.id);
  const others = posts.filter(p => !followingIds.includes(p.author_id) && p.author_id !== currentUser.id);
  const ordered = [...mine, ...others];

  feedEl.innerHTML = '';
  ordered.forEach(post => feedEl.appendChild(renderPost(post)));
  renderIcons(feedEl);
}

function renderPost(post) {
  const wrap = document.createElement('div');
  wrap.className = 'post';
  const author = post.profiles || {};
  const media = post.post_media || [];
  const image = media.find(m => m.media_type === 'image');
  const video = media.find(m => m.media_type === 'video');
  const audio = media.find(m => m.media_type === 'audio');

  let mediaHtml = '';
  if (image) mediaHtml += `<div class="post-media"><img src="${escapeHtml(image.file_url)}" alt=""></div>`;
  if (video) mediaHtml += `<div class="post-media"><video src="${escapeHtml(video.file_url)}" controls playsinline style="width:100%;display:block;"></video></div>`;
  if (audio) mediaHtml += `
    <div class="track-card">
      <div class="play" onclick="playAudio(this,'${escapeHtml(audio.file_url)}')"><span class="icon-svg" data-icon="play"></span></div>
      <div class="meta">
        <div class="t1">${escapeHtml(audio.title || 'Son')}</div>
        <div class="t2">${escapeHtml(audio.artist || author.display_name || author.username || '')}</div>
      </div>
    </div>`;

  wrap.innerHTML = `
    <div class="avatar" onclick="openProfile('${author.id}')">${author.avatar_url ? `<img src="${escapeHtml(author.avatar_url)}">` : (author.username || '?')[0].toUpperCase()}</div>
    <div class="post-body">
      <div class="post-head">
        <span class="name" onclick="openProfile('${author.id}')">${escapeHtml(author.display_name || author.username || 'Utilisateur')}</span>
        ${verifiedBadge(author)}
        <span class="handle">@${escapeHtml(author.username || '')}</span>
        <span class="time">· ${timeAgo(post.created_at)}</span>
      </div>
      ${post.text_content ? `<p class="post-text">${escapeHtml(post.text_content)}</p>` : ''}
      ${mediaHtml}
      <div class="post-actions">
        <button class="like-btn" data-post="${post.id}" onclick="toggleLikeUI(this,'${post.id}')"><span class="icon-svg" data-icon="heart"></span><span class="count">0</span></button>
        <button><span class="icon-svg" data-icon="message-circle"></span><span>0</span></button>
        <button><span class="icon-svg" data-icon="repeat"></span><span>0</span></button>
        <button><span class="icon-svg" data-icon="bookmark"></span></button>
        <button><span class="icon-svg" data-icon="share"></span></button>
      </div>
    </div>`;

  hydrateLike(wrap.querySelector('.like-btn'), post.id);
  return wrap;
}

async function hydrateLike(btn, postId) {
  const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', postId);
  const { data: mine } = await supabase.from('likes').select('*').eq('post_id', postId).eq('user_id', currentUser.id).maybeSingle();
  btn.querySelector('.count').textContent = count || 0;
  if (mine) { btn.classList.add('liked'); setIcon(btn.querySelector('.icon-svg'), 'heart-filled'); }
}

async function toggleLikeUI(btn, postId) {
  const liked = btn.classList.contains('liked');
  const countEl = btn.querySelector('.count');
  const iconEl = btn.querySelector('.icon-svg');
  if (liked) {
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
    btn.classList.remove('liked'); setIcon(iconEl, 'heart');
    countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
  } else {
    await supabase.from('likes').insert({ post_id: postId, user_id: currentUser.id });
    btn.classList.add('liked'); setIcon(iconEl, 'heart-filled');
    countEl.textContent = parseInt(countEl.textContent) + 1;
  }
}

let currentAudioEl = null;
function playAudio(btn, url) {
  if (currentAudioEl && !currentAudioEl.paused && currentAudioEl.src === url) {
    currentAudioEl.pause();
    setIcon(btn.querySelector('.icon-svg'), 'play');
    return;
  }
  if (currentAudioEl) currentAudioEl.pause();
  currentAudioEl = new Audio(url);
  currentAudioEl.play();
  setIcon(btn.querySelector('.icon-svg'), 'pause');
  currentAudioEl.onended = () => setIcon(btn.querySelector('.icon-svg'), 'play');
}

/* =========================================================
   COMPOSE (créer un post)
   ========================================================= */
function openCompose() {
  composeMedia = { image: null, video: null, audio: null };
  $('#compose-text').value = '';
  renderComposePreview();
  showScreen('compose');
}

function onPickImage(input) {
  if (input.files[0]) { composeMedia.image = input.files[0]; composeMedia.video = null; renderComposePreview(); }
}
function onPickVideo(input) {
  if (input.files[0]) { composeMedia.video = input.files[0]; composeMedia.image = null; renderComposePreview(); }
}

function composeChip(icon, label, clearExpr) {
  return `<div class="compose-chip">
    <span style="display:flex;align-items:center;gap:8px;min-width:0;">
      <span class="icon-svg" data-icon="${icon}" style="width:16px;height:16px;"></span>
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(label)}</span>
    </span>
    <button onclick="${clearExpr}" class="icon-svg" data-icon="x" style="width:15px;height:15px;"></button>
  </div>`;
}
function renderComposePreview() {
  const el = $('#compose-preview');
  el.innerHTML = '';
  if (composeMedia.image) el.innerHTML += composeChip('image', composeMedia.image.name, 'composeMedia.image=null; renderComposePreview();');
  if (composeMedia.video) el.innerHTML += composeChip('video', composeMedia.video.name, 'composeMedia.video=null; renderComposePreview();');
  if (composeMedia.audio) {
    const label = composeMedia.audio.title || (composeMedia.audio.file && composeMedia.audio.file.name) || 'Son';
    el.innerHTML += composeChip('music', label, 'composeMedia.audio=null; renderComposePreview();');
  }
  renderIcons(el);
}

async function publishPost() {
  const text = $('#compose-text').value.trim();
  if (!text && !composeMedia.image && !composeMedia.video && !composeMedia.audio) {
    alert('Ajoute au moins du texte ou un média.');
    return;
  }
  const submitBtn = $('#compose-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Publication...';

  try {
    const { data: post, error } = await supabase.from('posts')
      .insert({ author_id: currentUser.id, text_content: text || null })
      .select().single();
    if (error) throw error;

    if (composeMedia.image) {
      const url = await uploadToBucket(window.BUCKETS.posts, composeMedia.image);
      await supabase.from('post_media').insert({ post_id: post.id, media_type: 'image', file_url: url });
    }
    if (composeMedia.video) {
      const url = await uploadToBucket(window.BUCKETS.posts, composeMedia.video);
      await supabase.from('post_media').insert({ post_id: post.id, media_type: 'video', file_url: url });
    }
    if (composeMedia.audio) {
      let url, title, artist;
      if (composeMedia.audio.mode === 'existing') {
        url = composeMedia.audio.file_url; title = composeMedia.audio.title; artist = composeMedia.audio.artist;
      } else {
        url = await uploadToBucket(window.BUCKETS.audio, composeMedia.audio.file);
        title = composeMedia.audio.title || composeMedia.audio.file.name;
        artist = myProfile.display_name || myProfile.username;
      }
      await supabase.from('post_media').insert({ post_id: post.id, media_type: 'audio', file_url: url, title, artist });
    }

    showScreen('feed');
    loadFeed();
  } catch (e) {
    alert('Erreur : ' + e.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Publier';
  }
}

/* =========================================================
   MUSIQUE — sélecteur façon TikTok
   ========================================================= */
function openMusicPicker() {
  $('#music-modal').style.display = 'flex';
  switchMusicTab('search');
  searchSounds('');
}
function closeMusicPicker() { $('#music-modal').style.display = 'none'; }

function switchMusicTab(tab) {
  $all('#music-modal .tab').forEach(t => t.classList.toggle('active', t.dataset.mtab2 === tab));
  $all('.music-panel').forEach(p => p.style.display = 'none');
  $('#music-panel-' + tab).style.display = 'block';
  if (tab === 'mine') loadMySounds();
}

async function searchSounds(query) {
  const resEl = $('#music-search-results');
  resEl.innerHTML = '<div class="empty" style="padding:20px;">Recherche...</div>';
  let q = supabase.from('post_media')
    .select('id, title, artist, file_url, posts:post_id(author_id, profiles:author_id(username, display_name))')
    .eq('media_type', 'audio')
    .order('id', { ascending: false })
    .limit(20);
  if (query) q = q.ilike('title', `%${query}%`);
  const { data, error } = await q;
  if (error || !data || data.length === 0) {
    resEl.innerHTML = '<div class="empty" style="padding:20px;">Aucun son trouvé.</div>';
    return;
  }
  resEl.innerHTML = '';
  data.forEach(m => resEl.appendChild(soundRow(m.title || 'Son', m.artist || (m.posts && m.posts.profiles && m.posts.profiles.username) || '', m.file_url)));
}
$('#music-search-input') && $('#music-search-input').addEventListener('input', e => searchSounds(e.target.value.trim()));

async function loadMySounds() {
  const resEl = $('#music-mine-results');
  resEl.innerHTML = '<div class="empty" style="padding:20px;">Chargement...</div>';
  const { data, error } = await supabase.from('post_media')
    .select('id, title, artist, file_url, posts:post_id(author_id)')
    .eq('media_type', 'audio')
    .order('id', { ascending: false })
    .limit(50);
  const mine = (data || []).filter(m => m.posts && m.posts.author_id === currentUser.id);
  if (error || mine.length === 0) {
    resEl.innerHTML = '<div class="empty" style="padding:20px;">Tu n\'as pas encore de son.</div>';
    return;
  }
  resEl.innerHTML = '';
  mine.forEach(m => resEl.appendChild(soundRow(m.title || 'Son', m.artist || '', m.file_url)));
}

function soundRow(title, artist, url) {
  const div = document.createElement('div');
  div.className = 'list-track';
  div.style.cursor = 'pointer';
  div.innerHTML = `
    <div class="thumb" style="display:flex;align-items:center;justify-content:center;background:var(--surface);"><span class="icon-svg" data-icon="music" style="width:20px;height:20px;"></span></div>
    <div class="meta"><div class="t1">${escapeHtml(title)}</div><div class="t2">${escapeHtml(artist)}</div></div>
    <button class="btn btn-outline" style="padding:6px 14px;" onclick="event.stopPropagation(); pickExistingSound('${escapeHtml(title).replace(/'/g,"\\'")}','${escapeHtml(artist).replace(/'/g,"\\'")}','${url}')">Utiliser</button>`;
  renderIcons(div);
  return div;
}

function pickExistingSound(title, artist, file_url) {
  composeMedia.audio = { mode: 'existing', title, artist, file_url };
  renderComposePreview();
  closeMusicPicker();
}

function onUploadOwnSound(input) {
  const file = input.files[0];
  if (!file) return;
  const title = prompt('Titre du son ?', file.name.replace(/\.[^.]+$/, '')) || file.name;
  composeMedia.audio = { mode: 'new', file, title };
  renderComposePreview();
  closeMusicPicker();
}

/* =========================================================
   PROFIL
   ========================================================= */
function renderMyProfileHeader() {
  // rien de spécial ici pour l'instant, myProfile est déjà en mémoire
}

async function openProfile(userId) {
  viewedProfileId = userId;
  showScreen('profile');
  const el = $('#profile-content');
  el.innerHTML = '<div class="empty">Chargement...</div>';

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (!profile) { el.innerHTML = '<div class="empty">Profil introuvable.</div>'; return; }

  const { count: followersCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
  const { count: followingCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId);

  const isMe = userId === currentUser.id;
  let isFollowing = false;
  if (!isMe) {
    const { data: f } = await supabase.from('follows').select('*').eq('follower_id', currentUser.id).eq('following_id', userId).maybeSingle();
    isFollowing = !!f;
  }

  const { data: posts } = await supabase.from('posts')
    .select('*, profiles:author_id(*), post_media(*)')
    .eq('author_id', userId)
    .order('created_at', { ascending: false });

  el.innerHTML = `
    <div class="profile-head">
      <div class="profile-top-row">
        <div class="profile-avatar" id="profile-avatar-box">${profile.avatar_url ? `<img src="${escapeHtml(profile.avatar_url)}">` : (profile.username || '?')[0].toUpperCase()}</div>
        <div class="profile-actions" id="profile-actions-inner"></div>
      </div>
      <div class="profile-name">${escapeHtml(profile.display_name || profile.username)} ${verifiedBadge(profile)}</div>
      <div class="profile-handle">@${escapeHtml(profile.username)}</div>
      <p class="profile-bio">${escapeHtml(profile.bio || '')}</p>
      <div class="profile-stats"><span><b>${followersCount || 0}</b> followers</span><span><b>${followingCount || 0}</b> abonnements</span></div>
    </div>
    <div class="section-title">Publications</div>
    <div id="profile-posts"></div>`;

  const actionsEl = $('#profile-actions-inner');
  if (isMe) {
    actionsEl.innerHTML = `<button class="btn btn-outline" onclick="editMyProfile()">Modifier le profil</button><button class="btn btn-outline" onclick="doSignOut()">Déconnexion</button>`;
    $('#profile-avatar-box').style.cursor = 'pointer';
    $('#profile-avatar-box').onclick = () => $('#avatar-upload-input').click();
  } else {
    actionsEl.innerHTML = `
      <button class="btn ${isFollowing ? 'btn-following' : 'btn-follow'}" id="follow-toggle-btn">${isFollowing ? 'Abonné(e)' : "S'abonner"}</button>
      <button class="btn btn-outline" onclick="showScreen('messages')">Message</button>`;
    $('#follow-toggle-btn').onclick = () => toggleFollowProfile(userId);
  }

  const postsEl = $('#profile-posts');
  if (!posts || posts.length === 0) {
    postsEl.innerHTML = '<div class="empty">Aucune publication pour l\'instant.</div>';
  } else {
    posts.forEach(p => postsEl.appendChild(renderPost(p)));
  }
  renderIcons(el);
}

async function toggleFollowProfile(userId) {
  const btn = $('#follow-toggle-btn');
  const following = btn.classList.contains('btn-following');
  if (following) {
    await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', userId);
    btn.classList.remove('btn-following'); btn.classList.add('btn-follow'); btn.textContent = "S'abonner";
  } else {
    await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: userId });
    btn.classList.remove('btn-follow'); btn.classList.add('btn-following'); btn.textContent = 'Abonné(e)';
  }
}

async function editMyProfile() {
  const displayName = prompt('Nom affiché :', myProfile.display_name || '');
  if (displayName === null) return;
  const bio = prompt('Bio :', myProfile.bio || '');
  if (bio === null) return;
  const { error } = await supabase.from('profiles').update({ display_name: displayName, bio }).eq('id', currentUser.id);
  if (error) { alert('Erreur : ' + error.message); return; }
  myProfile.display_name = displayName; myProfile.bio = bio;
  openProfile(currentUser.id);
}

async function onUploadAvatar(input) {
  const file = input.files[0];
  if (!file) return;
  try {
    const url = await uploadToBucket(window.BUCKETS.avatars, file);
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', currentUser.id);
    myProfile.avatar_url = url;
    openProfile(currentUser.id);
  } catch (e) { alert('Erreur upload : ' + e.message); }
}

function openMyProfile() { openProfile(currentUser.id); }

/* =========================================================
   RECHERCHE
   ========================================================= */
async function searchUsers(query) {
  const el = $('#search-results');
  if (!query) { el.innerHTML = ''; return; }
  const { data } = await supabase.from('profiles').select('*').ilike('username', `%${query}%`).limit(15);
  el.innerHTML = '';
  (data || []).forEach(p => {
    const div = document.createElement('div');
    div.className = 'conv';
    div.style.cursor = 'pointer';
    div.onclick = () => openProfile(p.id);
    div.innerHTML = `
      <div class="avatar">${p.avatar_url ? `<img src="${escapeHtml(p.avatar_url)}">` : (p.username || '?')[0].toUpperCase()}</div>
      <div class="meta"><div class="row1"><span class="name">${escapeHtml(p.display_name || p.username)} ${verifiedBadge(p)}</span></div><div class="preview">@${escapeHtml(p.username)}</div></div>`;
    el.appendChild(div);
  });
  renderIcons(el);
}
