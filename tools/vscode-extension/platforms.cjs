'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const core = require('./core.cjs');
const hosts = {leetcode: 'leetcode.com', neetcode: 'neetcode.io', codeforces: 'codeforces.com', hackerrank: 'hackerrank.com'};
const kinds = ['Guided practice', 'First attempt', 'No-clue attempt', 'Delayed re-solve', 'Changed variation', 'Timed attempt'];
const outcomes = ['Accepted', 'Not accepted', 'Not submitted'];
const helps = ['No help on this attempt', 'Hint or explanation used', 'Solution code viewed or used', 'Not specified'];
const profileFile = root => path.join(root, 'platforms', 'profiles.json');
const profiles = root => fs.existsSync(profileFile(root)) ? core.json(profileFile(root)) : {};
function platformUrl(value) {
  const u = new URL(value.trim());
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  const platform = Object.keys(hosts).find(p => hosts[p] === host);
  if (!platform || u.protocol !== 'https:' || u.username || u.password || u.port) {
    throw new Error('Use an https problem or result link on LeetCode, NeetCode, Codeforces, or HackerRank.');
  }
  u.search = ''; u.hash = '';
  return {platform, url: u.href, pathname: u.pathname};
}
function problem(value) {
  const p = platformUrl(value);
  let match, key;
  if (p.platform === 'leetcode') match = p.pathname.match(/^\/problems\/([a-z0-9-]+)(?:\/|$)/i);
  if (p.platform === 'neetcode') match = p.pathname.match(/^\/problems\/([a-z0-9-]+)(?:\/|$)/i);
  if (p.platform === 'hackerrank') match = p.pathname.match(/^\/challenges\/([a-z0-9-]+)(?:\/|$)/i);
  if (match) key = match[1].toLowerCase();
  if (p.platform === 'codeforces') {
    match = p.pathname.match(/^\/problemset\/problem\/(\d+)\/([A-Z0-9]+)\/?$/i)
      || p.pathname.match(/^\/(?:contest|gym)\/(\d+)\/problem\/([A-Z0-9]+)\/?$/i);
    if (match) key = match[1] + '-' + match[2].toUpperCase();
  }
  if (!key) throw new Error('Use the public practice problem URL, rather than a profile, editorial, or employer assessment link.');
  const slug = key.replace(/[^a-z0-9-]/gi, '-');
  return {platform: p.platform, key: `${p.platform}:${key}`, url: p.url, slug};
}
function configure(root, platform, handle) {
  if (!hosts[platform] || typeof handle !== 'string' || !/^[a-zA-Z0-9_.-]{1,50}$/.test(handle)) throw new Error('Enter a valid public username.');
  const prefixes = {leetcode:'https://leetcode.com/u/',neetcode:'https://neetcode.io/user/',codeforces:'https://codeforces.com/profile/',hackerrank:'https://www.hackerrank.com/profile/'};
  const data = profiles(root);
  data[platform] = {...data[platform], handle, url: prefixes[platform] + encodeURIComponent(handle)};
  core.writeJson(profileFile(root), data);
  render(root);
}
function start(root, url, collection, kind) {
  const p = problem(url);
  if (!['blind75','neetcode150','other'].includes(collection) || !kinds.includes(kind)) throw new Error('Choose a collection and attempt type.');
  const c = core.newExercise(root, `${p.platform} ${p.slug}`, `Official task: ${p.url}\n\nRead the problem on its original platform. Record your own interpretation, constraints, and examples here. GPT web remains the tutor.\n\nWrite only your own attempt in attempt.py. Submit on the platform when ready; the arena does not submit for you.`);
  core.writeJson(path.join(c.dir, 'source.json'), {...p, collection, kind, startedAt: new Date().toISOString(), membership: 'learner-selected'});
  return c;
}
function source(root) {
  const p = path.join(core.current(root).dir, 'source.json');
  return fs.existsSync(p) ? core.json(p) : null;
}
function record(root, {outcome, evidenceUrl, assistance}) {
  const c = core.current(root), s = source(root);
  if (!s) throw new Error('Start a platform exercise first. The current custom lesson stays unchanged.');
  if (!outcomes.includes(outcome) || !helps.includes(assistance)) throw new Error('Select a result and assistance label.');
  let proof = null;
  if (evidenceUrl) {
    proof = platformUrl(evidenceUrl);
    if (proof.platform !== s.platform) throw new Error('The result link must be on the same platform as the problem.');
  }
  if (outcome !== 'Not submitted' && !proof) throw new Error('Include the platform result or submission URL.');
  const captured = core.capture(root, assistance);
  const row = {id: core.stamp() + '-' + crypto.randomBytes(3).toString('hex'),
    recordedAt: new Date().toISOString(), exercise: c.exercise,
    problemKey: s.key, platform: s.platform, problemUrl: s.url,
    collection: s.collection, attemptKind: s.kind, startedAt: s.startedAt,
    outcome, assistance, evidenceUrl: proof?.url || null,
    evidenceType: 'learner-reported result; link not independently verified',
    codeSha256: captured.metadata.sha256,
    capture: path.relative(root, captured.directory).replaceAll(path.sep, '/'),
    mastery: 'not assessed by tooling'};
  core.writeJson(path.join(root, 'platforms', 'records', row.id + '.json'), row);
  render(root); return row;
}
async function requestJson(url, options = {}) {
  const response = await fetch(url, {...options, redirect: 'error', signal: AbortSignal.timeout(20000),
    headers: {'User-Agent':'Learning-Arena/0.2 (public profile read)', ...options.headers}});
  if (!response.ok) throw new Error(`Profile service returned HTTP ${response.status}. Last successful data is retained.`);
  const text = await response.text();
  if (text.length > 20000000) throw new Error('Profile response exceeded the supported size.');
  try { return JSON.parse(text); } catch { throw new Error('Profile service returned a non-JSON response.'); }
}
function parseLeetCode(data, handle) {
  if (data.errors?.length) throw new Error('LeetCode rejected the public-profile query.');
  const user = data.data?.matchedUser;
  if (!user || user.username?.toLowerCase() !== handle.toLowerCase()) throw new Error('LeetCode profile was not found or did not match.');
  const counts = user.submitStatsGlobal?.acSubmissionNum;
  if (!Array.isArray(counts)) throw new Error('LeetCode profile format changed.');
  const solved = {};
  for (const difficulty of ['All','Easy','Medium','Hard']) {
    const value = counts.find(c => c.difficulty === difficulty)?.count;
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('LeetCode returned incomplete solve counts.');
    solved[difficulty] = value;
  }
  const recent = data.data.recentAcSubmissionList;
  if (!Array.isArray(recent)) throw new Error('LeetCode returned no recent-submission field.');
  return {handle: user.username, solved, recentAccepted: recent.slice(0,20).map(r => ({id:String(r.id),title:String(r.title),slug:String(r.titleSlug),timestamp:String(r.timestamp)})),
    coverage: 'Aggregate solve counts and up to 20 recent accepted entries; not complete submission history',
    method: 'LeetCode public GraphQL response; undocumented interface', independentAbility: 'not assessed'};
}
let nextCodeforcesRequest = 0;
let codeforcesQueue = Promise.resolve();
function cf(method, params, get = requestJson) {
  const work = async () => {
    await new Promise(resolve => setTimeout(resolve, Math.max(0, nextCodeforcesRequest - Date.now())));
    nextCodeforcesRequest = Date.now() + 2100;
    const response = await get(`https://codeforces.com/api/${method}?${new URLSearchParams(params)}`);
    if (response.status !== 'OK') throw new Error(`Codeforces: ${response.comment || 'request failed'}`);
    return response.result;
  };
  const pending = codeforcesQueue.then(work, work);
  codeforcesQueue = pending.catch(() => {});
  return pending;
}
function parseCodeforces(info, submissions, handle) {
  if (!Array.isArray(info) || info[0]?.handle?.toLowerCase() !== handle.toLowerCase() || !Array.isArray(submissions)) throw new Error('Unexpected Codeforces profile response.');
  const accepted = submissions.filter(s => s.verdict === 'OK');
  if (accepted.some(s => !Number.isSafeInteger(s.problem?.contestId ?? s.contestId) || !/^[A-Z0-9]+$/i.test(s.problem?.index || ''))) {
    throw new Error('Codeforces returned an accepted submission without a valid problem identity.');
  }
  const unique = new Set(accepted.map(s => `${s.problem?.contestId ?? s.contestId}:${s.problem?.index}`));
  return {handle:info[0].handle, rating:info[0].rating ?? null, maxRating:info[0].maxRating ?? null,
    rank:info[0].rank ?? 'unrated', submissionsFetched:submissions.length,
    acceptedSubmissions:accepted.length, uniqueAcceptedInFetchedHistory:unique.size,
    coverage: submissions.length < 10000 ? 'All returned public history (under the 10,000-entry request limit)' : 'Latest 10,000 submissions only; counts are a lower bound',
    method:'Official Codeforces public API', independentAbility:'not assessed'};
}
async function sync(root, platform, get = requestJson) {
  const config = profiles(root)[platform];
  if (!config?.handle) throw new Error(`Configure your ${platform} handle first.`);
  let data;
  try {
    if (platform === 'leetcode') {
      const payload = {query:'query ArenaProfile($username: String!) { matchedUser(username: $username) { username submitStatsGlobal { acSubmissionNum { difficulty count submissions } } } recentAcSubmissionList(username: $username, limit: 20) { id title titleSlug timestamp } }',variables:{username:config.handle}};
      data = parseLeetCode(await get('https://leetcode.com/graphql/', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}), config.handle);
    } else if (platform === 'codeforces') {
      const info = await cf('user.info', {handles:config.handle,checkHistoricHandles:'false'}, get);
      const submissions = await cf('user.status', {handle:config.handle,from:'1',count:'10000'}, get);
      data = parseCodeforces(info, submissions, config.handle);
    } else throw new Error('This platform is linked through its own profile and submission records, not an automatic statistics API.');
    const snapshot = {platform, ...data, profileUrl:config.url, retrievedAt:new Date().toISOString()};
    core.writeJson(path.join(root, 'platforms', 'snapshots', platform + '.json'), snapshot);
    core.writeJson(path.join(root, '.arena', 'external-status', platform + '.json'), {ok:true});
    render(root); return snapshot;
  } catch (error) {
    core.writeJson(path.join(root, '.arena', 'external-status', platform + '.json'), {ok:false,at:new Date().toISOString(),message:error.message});
    render(root); throw error;
  }
}
const escape = value => String(value).replace(/[|\r\n]/g, ' ').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function render(root) {
  const config = profiles(root);
  const readme = path.join(root, 'platforms', 'README.md');
  const lines = ['# 🌐 External practice', '',
    'GPT web owns the current lesson. These connections preserve platform evidence as the curriculum reaches it.', '',
    '| Platform | Profile | Evidence available |', '|---|---|---|'];
  for (const p of Object.keys(hosts)) {
    const account = config[p];
    let status = account ? 'Profile linked; no automatic statistics snapshot' : 'Handle not configured';
    const snap = path.join(root, 'platforms', 'snapshots', p + '.json');
    if (account && fs.existsSync(snap)) {
      const s = core.json(snap);
      if (s.handle.toLowerCase() === account.handle.toLowerCase()) {
        status = p === 'leetcode' ? `${s.solved.All} solved (${s.solved.Easy} easy / ${s.solved.Medium} medium / ${s.solved.Hard} hard)`
          : `Rating ${s.rating ?? 'unrated'}; ${s.uniqueAcceptedInFetchedHistory} unique accepted in fetched history`;
        status += ` · [snapshot](snapshots/${p}.json), ${s.retrievedAt}`;
      }
    }
    const refreshStatus = path.join(root, '.arena', 'external-status', p + '.json');
    if (fs.existsSync(refreshStatus) && !core.json(refreshStatus).ok) status += ' · Last refresh failed; any earlier snapshot above is retained';
    lines.push(`| ${p} | ${account ? `[${escape(account.handle)}](${account.url})` : 'Not configured'} | ${status} |`);
  }
  lines.push('', '## NeetCode → GitHub', '',
    'The existing native NeetCode integration was observed connected to **LLParis/neetcode-submissions**, with **Auto-commit on submission** and **Accepted Only** enabled. This observation was made on September 19, 2026.', '',
    '[Open the submission repository](https://github.com/LLParis/neetcode-submissions) · [Open NeetCode profile](https://neetcode.io/user/FleetEnsign925)', '',
    'Only work submitted on NeetCode enters that native sync. GPT web conversations and LeetCode submissions are separate. The arena does not rename, rewrite, or push into the native-sync repository.', '',
    '## Future practice sets', '',
    '- [Blind 75](https://neetcode.io/practice/practice/blind75)',
    '- [NeetCode 150](https://neetcode.io/practice/practice/neetcode150) includes Blind 75 plus 75 additional problems.', '',
    'These are future collections, not a replacement for the current foundations lesson. Collection membership is recorded when the learner starts a task. No completion percentage is inferred from aggregate account counts.', '',
    '## Saved practice evidence', '',
    'Results below are learner-reported, with the exact code capture and a platform link. Profile API totals are separate; neither establishes independent mastery.', '',
    '| Exercise | Attempt | Reported result | Help | Evidence |', '|---|---|---|---|---|');
  const directory = path.join(root, 'platforms', 'records');
  const records = fs.existsSync(directory) ? fs.readdirSync(directory).filter(n=>n.endsWith('.json')).sort().map(n=>core.json(path.join(directory,n))) : [];
  for (const r of records) lines.push(`| [${escape(r.exercise)}](../exercises/${r.exercise}/attempt.py) | ${escape(r.attemptKind)} | ${escape(r.outcome)} | ${escape(r.assistance)} | [captured code](../${r.capture}/attempt.py)${r.evidenceUrl ? ` · [platform](${r.evidenceUrl})` : ''} |`);
  if (!records.length) lines.push('| No new platform attempts recorded | — | — | — | — |');
  lines.push('', '[How to use the connections](../docs/EXTERNAL_PRACTICE.md) · [Current learning record](../PROGRESS.md)', '');
  core.write(readme, lines.join('\n')); return readme;
}
module.exports = {hosts,kinds,outcomes,helps,profiles,platformUrl,problem,configure,start,source,record,parseLeetCode,parseCodeforces,sync,render,requestJson};
