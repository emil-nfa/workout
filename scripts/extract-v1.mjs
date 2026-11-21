// One-off: pull the exercise content out of the v1 prototype into JSON.
import fs from 'node:fs'; import vm from 'node:vm';
const html = fs.readFileSync(process.argv[2], 'utf8');
const js = html.split('<script>')[1].split('/* pose helpers */')[0].trim().replace(/^\{/, '');
const ctx = { localStorage: { getItem: () => null, setItem() {} }, document: { querySelector: () => null } };
vm.createContext(ctx);
vm.runInContext(js.replace('const X={};', 'var X={};globalThis.X=X;'), ctx);
const out = Object.values(ctx.X).map(e => ({ id: e.id, n: e.n, fr: e.fr, g: e.g, mus: e.mus, eq: e.eq, how: e.how, cue: e.cue, bad: e.bad, alt: e.alt, prog: e.prog, post: !!e.post }));
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log(out.length, 'exercises');
