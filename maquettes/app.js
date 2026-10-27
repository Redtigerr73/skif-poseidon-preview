/* Shared mockup logic: weekly timetable, month calendar with spanning event bars, upcoming list, quick tiles.
   Real club data (skifb.be capture, to be confirmed). Throwaway mockup code: static data only. */
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const CLASSES = [
	{ d: 0, s: "21:00", e: "22:00", t: "Adultes", sub: "dès 17 ans", g: "adult", age: [17, 99], rank: 0 },
	{ d: 2, s: "18:45", e: "19:45", t: "Enfants", sub: "9 à 12 ans", g: "kids", age: [9, 12], rank: 0 },
	{ d: 2, s: "19:45", e: "20:45", t: "Ados", sub: "13 à 16 ans", g: "teen", age: [13, 16], rank: 0 },
	{ d: 2, s: "20:45", e: "22:00", t: "Avancés", sub: "3e kyu et +", g: "adv", age: [13, 99], rank: 7 },
	{ d: 4, s: "21:00", e: "22:00", t: "Adultes", sub: "dès 17 ans", g: "adult", age: [17, 99], rank: 0 },
	{ d: 5, s: "14:30", e: "15:30", t: "Enfants", sub: "6 à 8 ans", g: "kids", age: [6, 8], rank: 0 },
	{ d: 5, s: "15:30", e: "16:45", t: "Enfants", sub: "9 à 12 ans", g: "kids", age: [9, 12], rank: 0 },
	{ d: 5, s: "16:45", e: "18:00", t: "Ados", sub: "13 à 16 ans", g: "teen", age: [13, 16], rank: 0 },
	{ d: 6, s: "10:00", e: "11:00", t: "Kumite", sub: "7e kyu et +", g: "adv", age: [10, 99], rank: 3 },
	{ d: 6, s: "11:00", e: "12:00", t: "Kata", sub: "7e kyu et +", g: "adv", age: [10, 99], rank: 3 },
];
const FILTERS = [
	{ id: "all", label: "Tous" },
	{ id: "6-8", label: "6-8 ans", age: 7 },
	{ id: "9-12", label: "9-12 ans", age: 10 },
	{ id: "13-16", label: "13-16 ans", age: 14 },
	{ id: "adult", label: "Adultes", age: 30 },
];
const EVENTS = [
	{ id: "e1", start: "2026-10-30", end: "2026-10-30", time: "18:30 - 20:30", title: "Stage Castrique Sensei et Di Mecola Sensei", short: "Stage Castrique", place: "Hall sportif Hanck, Sambreville", type: "stage" },
	{ id: "e2", start: "2026-11-09", end: "2026-11-15", time: "", title: "15e Championnats du monde SKIF", short: "Mondiaux SKIF, Antalya", place: "Antalya, Türkiye", type: "competition" },
	{ id: "e3", start: "2026-12-06", end: "2026-12-06", time: "09:30 - 16:00", title: "Examen national et cours instructeurs", short: "Examen national", place: "Honbu Dojo, Mortsel", type: "exam" },
];
const TYPE_LABEL = { stage: "Stage", competition: "Compétition", exam: "Examen", closure: "Fermeture" };
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MONTHS_ABBR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const NOW = new Date(2026, 9, 27, 19, 0); // mockup clock

function el(tag, cls, text) {
	const n = document.createElement(tag);
	if (cls) n.className = cls;
	if (text !== undefined) n.textContent = text;
	return n;
}
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s) => new Date(s + "T12:00");

/* ---------- Timetable: only days that have classes ---------- */
function renderTimetable(root) {
	let active = "all", beginner = false;
	const bar = el("div", "chips");
	const row = el("div", "chip-row");
	FILTERS.forEach((f) => {
		const b = el("button", "chip", f.label);
		b.type = "button";
		b.setAttribute("aria-pressed", String(f.id === active));
		b.onclick = () => { active = f.id; row.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === b))); draw(); };
		row.append(b);
	});
	const toggle = el("label", "toggle");
	const box = el("input");
	box.type = "checkbox";
	box.onchange = () => { beginner = box.checked; draw(); };
	toggle.append(box, document.createTextNode(" Je débute"));
	bar.append(row, toggle);
	const count = el("p", "match-count");
	count.setAttribute("aria-live", "polite");
	const grid = el("div", "week");
	const note = el("p", "week-note", "Pas de cours le mardi et le jeudi.");
	root.append(bar, count, grid, note);

	const days = [...new Set(CLASSES.map((c) => c.d))].sort();
	function fits(c) {
		const f = FILTERS.find((x) => x.id === active);
		if (f.age !== undefined && (f.age < c.age[0] || f.age > c.age[1])) return false;
		if (beginner && c.rank > 1) return false;
		return true;
	}
	function draw() {
		grid.replaceChildren();
		let n = 0;
		days.forEach((d) => {
			const col = el("div", "day");
			col.append(el("h3", "day-name", DAYS[d]));
			let any = false;
			CLASSES.filter((c) => c.d === d).forEach((c) => {
				const ok = fits(c);
				any = any || ok;
				if (ok) n++;
				const card = el("div", `slot g-${c.g}${ok ? "" : " dim"}`);
				card.append(el("span", "slot-time", `${c.s} - ${c.e}`), el("strong", "", c.t), el("span", "slot-sub", c.sub));
				col.append(card);
			});
			if (!any) col.classList.add("all-dim");
			grid.append(col);
		});
		count.textContent = active === "all" && !beginner ? `${n} cours par semaine` : n ? `${n} cours correspondent` : "Aucun cours ne correspond : contactez-nous, nous trouverons la bonne formule.";
	}
	draw();
}

/* ---------- Month calendar: one bar per event and week, full title once ---------- */
function renderCalendar(root) {
	let cur = new Date(NOW.getFullYear(), NOW.getMonth() + (NOW.getDate() > 24 ? 1 : 0), 1);
	const head = el("div", "cal-head");
	const prev = el("button", "cal-nav", "‹");
	const next = el("button", "cal-nav", "›");
	const title = el("h3", "cal-title");
	const today = el("button", "cal-today", "Aujourd'hui");
	prev.setAttribute("aria-label", "Mois précédent");
	next.setAttribute("aria-label", "Mois suivant");
	head.append(prev, title, next, today);
	const legend = el("div", "cal-legend");
	Object.entries({ stage: "Stage", competition: "Compétition", exam: "Examen", closure: "Fermeture" }).forEach(([k, v]) => {
		const s = el("span", `t-${k}`);
		s.append(el("i"), document.createTextNode(v));
		legend.append(s);
	});
	const dows = el("div", "cal-dows");
	["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].forEach((d) => dows.append(el("span", "", d)));
	const weeks = el("div", "cal-weeks");
	root.append(head, dows, weeks, legend);
	prev.onclick = () => { cur = new Date(cur.getFullYear(), cur.getMonth() - 1, 1); draw(); };
	next.onclick = () => { cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1); draw(); };
	today.onclick = () => { cur = new Date(NOW.getFullYear(), NOW.getMonth(), 1); draw(); };

	function draw() {
		title.textContent = `${MONTHS[cur.getMonth()]} ${cur.getFullYear()}`;
		weeks.replaceChildren();
		const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
		const last = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
		const start = new Date(first);
		start.setDate(1 - ((first.getDay() + 6) % 7));
		for (let w = new Date(start); w <= last; w.setDate(w.getDate() + 7)) {
			const week = el("div", "cal-week");
			const wStart = iso(w);
			const end = new Date(w);
			end.setDate(w.getDate() + 6);
			const wEnd = iso(end);
			for (let i = 0; i < 7; i++) {
				const d = new Date(w);
				d.setDate(w.getDate() + i);
				const cell = el("div", `cal-day${d.getMonth() !== cur.getMonth() ? " out" : ""}${iso(d) === iso(NOW) ? " today" : ""}`);
				cell.style.gridColumn = String(i + 1);
				cell.append(el("span", "cal-num", String(d.getDate())));
				week.append(cell);
			}
			let lane = 0;
			EVENTS.filter((e) => e.start <= wEnd && e.end >= wStart).forEach((e) => {
				// Day index inside the week from calendar dates (not timestamps: avoids DST and rounding errors).
				const idx = (str) => Math.round((Date.UTC(...str.split("-").map((v, i) => (i === 1 ? v - 1 : +v))) - Date.UTC(w.getFullYear(), w.getMonth(), w.getDate())) / 864e5);
				const s = e.start < wStart ? 0 : idx(e.start);
				const en = e.end > wEnd ? 6 : idx(e.end);
				const b = el("a", `cal-bar t-${e.type}${e.start < wStart ? " cont-l" : ""}${e.end > wEnd ? " cont-r" : ""}`, en - s >= 1 ? e.title : e.short);
				b.href = `#${e.id}`;
				b.title = `${TYPE_LABEL[e.type]} : ${e.title}`;
				b.style.gridColumn = `${s + 1} / ${en + 2}`;
				b.style.gridRow = String(lane + 2);
				b.onclick = (ev) => { ev.preventDefault(); const card = document.getElementById(e.id); card?.scrollIntoView({ behavior: "smooth", block: "center" }); card?.classList.add("flash"); setTimeout(() => card?.classList.remove("flash"), 1400); };
				week.append(b);
				lane++;
			});
			weeks.append(week);
		}
	}
	draw();
}

function renderUpcoming(root) {
	EVENTS.filter((e) => parse(e.end) >= NOW).forEach((e) => {
		const s = parse(e.start), en = parse(e.end);
		const a = el("article", `event t-${e.type}`);
		a.id = e.id;
		const tile = el("div", "date-tile");
		tile.append(el("span", "dd", String(s.getDate())), el("span", "mm", MONTHS_ABBR[s.getMonth()]));
		const body = el("div", "event-body");
		body.append(el("span", "event-type", TYPE_LABEL[e.type]), el("h4", "", e.title));
		const when = e.start === e.end ? e.time : `Du ${s.getDate()} au ${en.getDate()} ${MONTHS[en.getMonth()]}`;
		const p = el("p", "", when);
		p.append(document.createElement("br"), document.createTextNode(e.place));
		body.append(p);
		a.append(tile, body);
		root.append(a);
	});
}

/* ---------- Quick tiles: next class, next event ---------- */
function quickTiles() {
	const today = (NOW.getDay() + 6) % 7;
	const mins = NOW.getHours() * 60 + NOW.getMinutes();
	const toMin = (t) => parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(3), 10);
	let best = null;
	CLASSES.forEach((c) => {
		let delta = (c.d - today + 7) % 7;
		if (delta === 0 && toMin(c.s) <= mins) delta = 7;
		const score = delta * 1440 + toMin(c.s);
		if (!best || score < best.score) best = { c, delta, score };
	});
	const nc = document.querySelector("[data-next-class]");
	if (nc && best) {
		const when = best.delta === 0 ? "Aujourd'hui" : best.delta === 1 ? "Demain" : DAYS[best.c.d];
		nc.querySelector("strong").textContent = `${when} ${best.c.s}`;
		nc.querySelector("span").textContent = `${best.c.t}, ${best.c.sub}`;
	}
	const ne = document.querySelector("[data-next-event]");
	const ev = EVENTS.find((e) => parse(e.end) >= NOW);
	if (ne && ev) {
		const s = parse(ev.start);
		ne.querySelector("strong").textContent = `${s.getDate()} ${MONTHS[s.getMonth()]}`;
		ne.querySelector("span").textContent = ev.short;
	}
}

document.querySelectorAll("[data-timetable]").forEach(renderTimetable);
document.querySelectorAll("[data-calendar]").forEach(renderCalendar);
document.querySelectorAll("[data-upcoming]").forEach(renderUpcoming);
quickTiles();
