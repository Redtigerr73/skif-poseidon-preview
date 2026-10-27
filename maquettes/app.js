/* Shared mockup logic: weekly timetable with filter chips + month calendar. Real club data (skifb.be capture, to be confirmed). */
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
	{ id: "all", label: "Tous les cours" },
	{ id: "6-8", label: "6-8 ans", age: 7 },
	{ id: "9-12", label: "9-12 ans", age: 10 },
	{ id: "13-16", label: "13-16 ans", age: 14 },
	{ id: "adult", label: "Adultes", age: 30 },
];
const EVENTS = [
	{ start: "2026-10-30", end: "2026-10-30", time: "18:30 - 20:30", title: "Stage Castrique Sensei et Di Mecola Sensei", place: "Hall sportif Hanck, Sambreville", type: "stage" },
	{ start: "2026-11-09", end: "2026-11-15", time: "", title: "15e Championnats du monde SKIF", place: "Antalya, Türkiye", type: "competition" },
	{ start: "2026-12-06", end: "2026-12-06", time: "09:30 - 16:00", title: "Examen national et cours instructeurs", place: "Honbu Dojo, Mortsel", type: "exam" },
];
const TYPE_LABEL = { stage: "Stage", competition: "Compétition", exam: "Examen", closure: "Fermeture" };
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function el(tag, cls, html) {
	const n = document.createElement(tag);
	if (cls) n.className = cls;
	if (html !== undefined) n.innerHTML = html;
	return n;
}

function renderTimetable(root) {
	let active = "all", beginner = false;
	const chips = el("div", "chips");
	FILTERS.forEach((f) => {
		const b = el("button", "chip", f.label);
		b.type = "button";
		b.setAttribute("aria-pressed", f.id === active);
		b.onclick = () => { active = f.id; chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c === b)); draw(); };
		chips.append(b);
	});
	const toggle = el("label", "toggle", '<input type="checkbox"> Je débute');
	toggle.querySelector("input").onchange = (e) => { beginner = e.target.checked; draw(); };
	chips.append(toggle);
	const grid = el("div", "week");
	root.append(chips, grid);

	function fits(c) {
		const f = FILTERS.find((x) => x.id === active);
		if (f.age !== undefined && (f.age < c.age[0] || f.age > c.age[1])) return false;
		if (beginner && c.rank > 1) return false;
		return true;
	}
	function draw() {
		grid.innerHTML = "";
		DAYS.forEach((day, i) => {
			const col = el("div", "day");
			const list = CLASSES.filter((c) => c.d === i);
			col.append(el("div", "day-name", day));
			if (!list.length) col.append(el("div", "rest", "Repos"));
			list.forEach((c) => {
				const card = el("div", `slot g-${c.g}${fits(c) ? "" : " dim"}`, `<span class="slot-time">${c.s} - ${c.e}</span><strong>${c.t}</strong><span>${c.sub}</span>`);
				col.append(card);
			});
			grid.append(col);
		});
	}
	draw();
}

function renderCalendar(root) {
	let cur = new Date(2026, 10, 1);
	const head = el("div", "cal-head");
	const prev = el("button", "cal-nav", "‹");
	const next = el("button", "cal-nav", "›");
	const title = el("h3", "cal-title");
	prev.setAttribute("aria-label", "Mois précédent");
	next.setAttribute("aria-label", "Mois suivant");
	head.append(prev, title, next);
	const grid = el("div", "cal-grid");
	root.append(head, grid);
	prev.onclick = () => { cur = new Date(cur.getFullYear(), cur.getMonth() - 1, 1); draw(); };
	next.onclick = () => { cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1); draw(); };
	const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	function draw() {
		title.textContent = `${MONTHS[cur.getMonth()]} ${cur.getFullYear()}`;
		grid.innerHTML = "";
		["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].forEach((d) => grid.append(el("div", "cal-dow", d)));
		const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
		const offset = (first.getDay() + 6) % 7;
		const start = new Date(first);
		start.setDate(1 - offset);
		for (let i = 0; i < 42; i++) {
			const d = new Date(start);
			d.setDate(start.getDate() + i);
			const out = d.getMonth() !== cur.getMonth();
			const today = iso(d) === "2026-10-27";
			const cell = el("div", `cal-cell${out ? " out" : ""}${today ? " today" : ""}`, `<span class="cal-num">${d.getDate()}</span>`);
			EVENTS.filter((e) => iso(d) >= e.start && iso(d) <= e.end).forEach((e) => cell.append(el("span", `cal-ev t-${e.type}`, e.title)));
			const weekday = (d.getDay() + 6) % 7;
			if (!out && CLASSES.some((c) => c.d === weekday)) cell.append(el("span", "cal-dot", ""));
			grid.append(cell);
		}
	}
	draw();
}

function renderUpcoming(root) {
	EVENTS.forEach((e) => {
		const s = new Date(e.start + "T12:00");
		const en = new Date(e.end + "T12:00");
		const range = e.start === e.end ? e.time : `jusqu'au ${en.getDate()} ${MONTHS[en.getMonth()]}`;
		root.append(el("article", `event t-${e.type}`, `<div class="date-tile"><span class="dd">${s.getDate()}</span><span class="mm">${MONTHS[s.getMonth()].slice(0, 4)}.</span></div><div class="event-body"><span class="event-type">${TYPE_LABEL[e.type]}</span><h4>${e.title}</h4><p>${range}<br>${e.place}</p></div>`));
	});
}

document.querySelectorAll("[data-timetable]").forEach(renderTimetable);
document.querySelectorAll("[data-calendar]").forEach(renderCalendar);
document.querySelectorAll("[data-upcoming]").forEach(renderUpcoming);

/* Quick-access tiles: next class and next event computed from "now" (mockup clock fixed to 27/10/2026 19:00). */
(function () {
	const now = new Date(2026, 9, 27, 19, 0);
	const today = (now.getDay() + 6) % 7;
	const mins = now.getHours() * 60 + now.getMinutes();
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
	const ev = EVENTS.find((e) => new Date(e.end + "T23:59") >= now);
	if (ne && ev) {
		const s = new Date(ev.start + "T12:00");
		ne.querySelector("strong").textContent = `${s.getDate()} ${MONTHS[s.getMonth()]}`;
		ne.querySelector("span").textContent = ev.title;
	}
})();
