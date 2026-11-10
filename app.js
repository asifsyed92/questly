const STORAGE_KEY = 'questly-state-v1';
const starterQuests = [
  { id: 'water', title: 'Drink a glass of water after waking up', reward: 10, category: 'WELLNESS' },
  { id: 'focus', title: 'Spend 25 minutes focused on your top priority', reward: 25, category: 'PRODUCTIVITY' },
  { id: 'move', title: 'Get outside and move your body', reward: 20, category: 'WELLNESS' },
  { id: 'reflect', title: 'Write down one thing you’re grateful for', reward: 15, category: 'MINDFULNESS' }
];
const $ = (selector) => document.querySelector(selector);
const dateKey = new Date().toLocaleDateString('en-CA');
let state = loadState();
let toastTimer;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object') return { date: dateKey, totalXp: 0, quests: starterQuests.map(q => ({ ...q, done: false, custom: false })) };
    if (saved.date !== dateKey) {
      saved.date = dateKey;
      saved.quests = (saved.quests || starterQuests).map(q => ({ ...q, done: false }));
    }
    if (!Array.isArray(saved.quests)) saved.quests = [];
    if (!Number.isFinite(saved.totalXp)) saved.totalXp = 0;
    return saved;
  } catch {
    return { date: dateKey, totalXp: 0, quests: starterQuests.map(q => ({ ...q, done: false, custom: false })) };
  }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function getLevel(xp) { return Math.floor(xp / 100) + 1; }
function render() {
  const list = $('#quest-list');
  list.replaceChildren();
  state.quests.forEach(quest => {
    const card = document.createElement('article');
    card.className = `quest-card${quest.done ? ' completed' : ''}`;
    const check = document.createElement('input');
    check.type = 'checkbox'; check.className = 'quest-check'; check.checked = Boolean(quest.done);
    check.setAttribute('aria-label', `${quest.done ? 'Mark incomplete' : 'Complete'}: ${quest.title}`);
    check.addEventListener('change', () => toggleQuest(quest.id, check.checked));
    const info = document.createElement('div'); info.className = 'quest-info';
    const title = document.createElement('p'); title.className = 'quest-title'; title.textContent = quest.title;
    const meta = document.createElement('p'); meta.className = 'quest-meta'; meta.textContent = quest.category || 'CUSTOM QUEST';
    info.append(title, meta);
    const reward = document.createElement('span'); reward.className = 'quest-reward'; reward.textContent = `✧ ${quest.reward} XP`;
    card.append(check, info, reward);
    if (quest.custom) {
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'delete-quest'; remove.textContent = '×';
      remove.setAttribute('aria-label', `Delete ${quest.title}`);
      remove.addEventListener('click', () => { state.quests = state.quests.filter(q => q.id !== quest.id); saveState(); render(); });
      card.append(remove);
    }
    list.append(card);
  });
  const completed = state.quests.filter(q => q.done).length;
  const total = state.quests.length;
  const percent = total ? Math.round(completed / total * 100) : 0;
  const todayXp = state.quests.filter(q => q.done).reduce((sum, q) => sum + q.reward, 0);
  $('#completed-count').textContent = completed;
  $('#quest-count').textContent = total;
  $('#progress-percent').textContent = `${percent}%`;
  $('#progress-fill').style.width = `${percent}%`;
  $('#progress-bar').setAttribute('aria-valuenow', percent);
  $('#today-xp').textContent = todayXp;
  $('#total-xp').textContent = `${state.totalXp} total XP`;
  $('#level-number').textContent = `Level ${getLevel(state.totalXp)}`;
  $('#progress-caption').textContent = percent === 100 && total ? 'All quests conquered. Incredible work!' : completed ? 'Nice work! Keep going, adventurer.' : 'Every great journey starts with one step.';
  $('#empty-state').hidden = total !== 0;
}
function toggleQuest(id, done) {
  const quest = state.quests.find(q => q.id === id);
  if (!quest || quest.done === done) return;
  quest.done = done;
  state.totalXp = Math.max(0, state.totalXp + (done ? quest.reward : -quest.reward));
  saveState(); render();
  if (done) showToast(`Quest complete! +${quest.reward} XP ✨`);
}
function showToast(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}
function openForm() { $('#quest-form').hidden = false; $('#quest-title').focus(); }
$('#today-label').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
$('#open-form').addEventListener('click', openForm);
$('#empty-add').addEventListener('click', openForm);
$('#cancel-form').addEventListener('click', () => { $('#quest-form').reset(); $('#quest-form').hidden = true; });
$('#quest-form').addEventListener('submit', event => {
  event.preventDefault();
  const title = $('#quest-title').value.trim();
  const reward = Math.min(100, Math.max(5, Number($('#quest-reward').value) || 20));
  if (!title) return;
  state.quests.push({ id: `custom-${Date.now()}`, title, reward, category: 'CUSTOM QUEST', done: false, custom: true });
  saveState(); render(); event.currentTarget.reset(); $('#quest-reward').value = 20; event.currentTarget.hidden = true;
  showToast('A new quest joins your board.');
});
render();
