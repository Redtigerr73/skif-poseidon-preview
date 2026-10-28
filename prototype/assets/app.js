// SKIF Poseidon prototype: small, dependency-free behaviours. Each module wakes up only if its markup is present.
"use strict";

const DATA = (() => {
	const el = document.getElementById("data");
	try { return el ? JSON.parse(el.textContent) : {}; } catch { return {}; }
})();
const NOW = DATA.now ? new Date(DATA.now) : new Date(2026, 9, 28, 19, 0);

function el(tag, cls, text) {
	const n = document.createElement(tag);
	if (cls) n.className = cls;
	if (text != null) n.textContent = text;
	return n;
}

/* Mobile menu */
(function menu() {
	const btn = document.querySelector(".menu-btn");
	const panel = document.getElementById("menu");
	if (!btn || !panel) return;
	const set = (open) => {
		btn.setAttribute("aria-expanded", String(open));
		panel.hidden = !open;
		btn.textContent = open ? "Fermer" : "Menu";
	};
	btn.addEventListener("click", () => set(panel.hidden));
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && !panel.hidden) { set(false); btn.focus(); }
	});
	panel.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
	matchMedia("(min-width: 1181px)").addEventListener("change", (e) => { if (e.matches) set(false); });
})();

/* Timetable filters: age chips + "Je débute". The week itself is rendered by the server. */
document.querySelectorAll("[data-timetable]").forEach((root) => {
	const FILTERS = [
		{ id: "all", label: "Tous" }, { id: "6-8", label: "6-8 ans", age: 7 }, { id: "9-12", label: "9-12 ans", age: 10 },
		{ id: "13-16", label: "13-16 ans", age: 14 }, { id: "adult", label: "Adultes", age: 30 },
	];
	const slots = [...root.querySelectorAll(".slot")];
	const bar = el("div", "chips");
	const row = el("div", "chip-row");
	row.setAttribute("role", "group");
	row.setAttribute("aria-label", "Âge");
	const toggle = el("label", "toggle");
	const box = document.createElement("input");
	box.type = "checkbox";
	toggle.append(box, document.createTextNode("Je débute"));
	const count = el("p", "match-count");
	count.setAttribute("aria-live", "polite");
	let current = FILTERS[0];
	const apply = () => {
		let n = 0;
		slots.forEach((s) => {
			const min = Number(s.dataset.ageMin || 0), max = Number(s.dataset.ageMax || 99), rank = Number(s.dataset.rankMin || 0);
			const ok = (current.age == null || (min <= current.age && current.age <= max)) && (!box.checked || rank === 0);
			s.classList.toggle("dim", !ok);
			if (ok) n++;
		});
		root.querySelectorAll(".day").forEach((d) => d.classList.toggle("all-dim", !d.querySelector(".slot:not(.dim)")));
		count.textContent = n ? `${n} cours ${n > 1 ? "correspondent" : "correspond"}` : "";
		if (!n) {
			count.textContent = "Aucun cours ne correspond. ";
			const a = el("a", null, "Écrivez-nous");
			a.href = (document.querySelector(".brand")?.getAttribute("href") || "index.html").replace("index.html", "contact.html");
			count.append(a);
		}
	};
	FILTERS.forEach((f) => {
		const b = el("button", "chip", f.label);
		b.type = "button";
		b.setAttribute("aria-pressed", String(f === current));
		b.addEventListener("click", () => {
			current = f;
			row.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
			apply();
		});
		row.append(b);
	});
	box.addEventListener("change", apply);
	bar.append(row, toggle);
	root.prepend(bar, count);
	apply();
});

/* Demo forms: nothing is sent, the visitor just sees the confirmation page. */
document.querySelectorAll("[data-demo-form]").forEach((form) => {
	const age = form.querySelector("#age");
	const parent = form.querySelector("[data-parent]");
	if (age && parent) age.addEventListener("input", () => { parent.hidden = !(Number(age.value) > 0 && Number(age.value) < 18); });
	form.addEventListener("submit", (e) => {
		e.preventDefault();
		if (!form.reportValidity()) return;
		location.href = form.getAttribute("action");
	});
});

/* Month calendar: one continuous bar per event and per week; days with events are buttons (phone: list below). */
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const TYPE_LABEL = { stage: "Stage", competition: "Compétition", exam: "Examen", closure: "Fermeture", club: "Vie du club" };
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayIndex = (s, w) => Math.round((Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) - Date.UTC(w.getFullYear(), w.getMonth(), w.getDate())) / 864e5);
const agendaState = { type: "all", listeners: [] };

document.querySelectorAll("[data-calendar]").forEach((root) => {
	const EVENTS = DATA.events || [];
	let cur = new Date(NOW.getFullYear(), NOW.getMonth(), 1);
	const head = el("div", "cal-head");
	const prev = el("button", "cal-nav", "‹");
	const next = el("button", "cal-nav", "›");
	const title = el("h2", "cal-title");
	const today = el("button", "cal-today", "Aujourd’hui");
	[prev, next, today].forEach((b) => { b.type = "button"; });
	prev.setAttribute("aria-label", "Mois précédent");
	next.setAttribute("aria-label", "Mois suivant");
	title.setAttribute("aria-live", "polite");
	head.append(prev, title, next, today);
	const dows = el("div", "cal-dows");
	["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].forEach((d) => dows.append(el("span", "", d)));
	const weeks = el("div", "cal-weeks");
	const empty = el("p", "cal-empty");
	empty.hidden = true;
	root.append(head, dows, weeks, empty);
	const panel = root.parentElement.querySelector(".day-panel");
	const go = (d) => { cur = d; draw(); };
	prev.onclick = () => go(new Date(cur.getFullYear(), cur.getMonth() - 1, 1));
	next.onclick = () => go(new Date(cur.getFullYear(), cur.getMonth() + 1, 1));
	today.onclick = () => go(new Date(NOW.getFullYear(), NOW.getMonth(), 1));
	const visible = () => EVENTS.filter((e) => agendaState.type === "all" || e.type === agendaState.type);

	function showDay(day) {
		if (!panel) return;
		const list = visible().filter((e) => e.start <= day && e.end >= day);
		panel.replaceChildren();
		const d = new Date(day + "T12:00");
		panel.append(el("h3", "", `Le ${d.getDate()} ${MONTHS[d.getMonth()]}`));
		list.forEach((e) => {
			const a = el("a", `day-item t-${e.type}`);
			a.href = e.url;
			a.append(el("span", "event-type", TYPE_LABEL[e.type] + (e.example ? " (exemple)" : "")), el("strong", "", e.short));
			panel.append(a);
		});
		panel.hidden = false;
	}

	function draw() {
		title.textContent = `${MONTHS[cur.getMonth()]} ${cur.getFullYear()}`;
		weeks.replaceChildren();
		if (panel) panel.hidden = true;
		const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
		const last = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
		const start = new Date(first);
		start.setDate(1 - ((first.getDay() + 6) % 7));
		const evs = visible();
		let inMonth = 0;
		for (let w = new Date(start); w <= last; w.setDate(w.getDate() + 7)) {
			const week = el("div", "cal-week");
			const wStart = iso(w);
			const end = new Date(w);
			end.setDate(w.getDate() + 6);
			const wEnd = iso(end);
			for (let i = 0; i < 7; i++) {
				const d = new Date(w);
				d.setDate(w.getDate() + i);
				const key = iso(d);
				const has = evs.filter((e) => e.start <= key && e.end >= key);
				const cell = el(has.length ? "button" : "div", `cal-day${d.getMonth() !== cur.getMonth() ? " out" : ""}${key === iso(NOW) ? " today" : ""}${has.length ? " has" : ""}`);
				cell.dataset.date = key;
				cell.style.gridColumn = String(i + 1);
				cell.append(el("span", "cal-num", String(d.getDate())));
				if (has.length) {
					cell.type = "button";
					cell.setAttribute("aria-label", `${d.getDate()} ${MONTHS[d.getMonth()]} : ${has.map((e) => e.short).join(", ")}`);
					cell.onclick = () => showDay(key);
				}
				if (key === iso(NOW)) cell.setAttribute("aria-current", "date");
				week.append(cell);
			}
			let lane = 0;
			evs.filter((e) => e.start <= wEnd && e.end >= wStart).forEach((e) => {
				const s = e.start < wStart ? 0 : dayIndex(e.start, w);
				const en = e.end > wEnd ? 6 : dayIndex(e.end, w);
				const b = el("a", `cal-bar t-${e.type}${e.start < wStart ? " cont-l" : ""}${e.end > wEnd ? " cont-r" : ""}`);
				b.textContent = (e.example ? "Exemple : " : "") + (en - s >= 1 ? e.title : e.short);
				b.dataset.id = e.id;
				b.href = e.url;
				b.title = `${TYPE_LABEL[e.type]} : ${e.title}`;
				b.style.gridColumn = `${s + 1} / ${en + 2}`;
				b.style.gridRow = String(lane + 2);
				week.append(b);
				lane++;
				if (e.end >= iso(first) && e.start <= iso(last)) inMonth++;
			});
			weeks.append(week);
		}
		empty.replaceChildren();
		empty.hidden = inMonth > 0;
		const button = (label, fn) => { const b = el("button", "btn btn-soft", label); b.type = "button"; b.onclick = fn; empty.append(b); };
		if (!inMonth && agendaState.type === "all") {
			empty.append(document.createTextNode("Aucun événement ce mois-ci. "));
			button("Revenir à aujourd’hui", today.onclick);
		} else if (!inMonth) {
			// A filter is on: say what is missing, and offer the nearest month that has it, or all types.
			const NONE = { stage: "Aucun stage", competition: "Aucune compétition", exam: "Aucun examen", closure: "Aucune fermeture", club: "Aucun événement de la vie du club" };
			empty.append(document.createTextNode(`${NONE[agendaState.type]} en ${MONTHS[cur.getMonth()]}. `));
			const after = evs.filter((e) => e.start > iso(last)).sort((a, b) => (a.start < b.start ? -1 : 1))[0];
			const before = evs.filter((e) => e.end < iso(first)).sort((a, b) => (a.end > b.end ? -1 : 1))[0];
			const target = after || before;
			if (target) {
				const d = new Date(target.start + "T12:00");
				button(`${after ? "Aller au prochain" : "Aller au plus récent"} : ${MONTHS[d.getMonth()]} ${d.getFullYear()}`, () => go(new Date(d.getFullYear(), d.getMonth(), 1)));
			}
			button("Tous les types", () => agendaState.reset?.());
		}
	}
	agendaState.listeners.push(draw);
	draw();
});

/* Agenda list filter (shares its state with the calendar). */
document.querySelectorAll("[data-agenda-filter]").forEach((row) => {
	const side = row.closest(".agenda-side");
	const items = [...side.querySelectorAll(".event")];
	const empty = side.querySelector(".events-empty");
	const set = (type) => {
		agendaState.type = type;
		row.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.filter === type)));
		let n = 0;
		items.forEach((it) => { const ok = type === "all" || it.dataset.type === type; it.hidden = !ok; if (ok) n++; });
		empty.hidden = n > 0;
		agendaState.listeners.forEach((f) => f());
	};
	row.addEventListener("click", (e) => { const c = e.target.closest(".chip"); if (c) set(c.dataset.filter); });
	side.querySelector("[data-filter-reset]")?.addEventListener("click", () => set("all"));
	agendaState.reset = () => set("all");
});

/* Calendar subscription: webcal:// opens the calendar app with a "subscribe" prompt. */
document.querySelectorAll("[data-webcal]").forEach((a) => {
	if (location.protocol.startsWith("http")) a.href = new URL(a.getAttribute("href"), location.href).href.replace(/^https?:/, "webcal:");
});

/* Share: WhatsApp, Facebook, copy, native share sheet. */
document.querySelectorAll("[data-share]").forEach((box) => {
	const url = location.href.split("#")[0];
	const text = box.dataset.text;
	const done = box.querySelector(".share-done");
	box.querySelector("[data-share-wa]").href = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
	box.querySelector("[data-share-fb]").href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
	box.querySelector("[data-share-copy]").addEventListener("click", async () => {
		try { await navigator.clipboard.writeText(url); done.textContent = "Lien copié"; } catch { done.textContent = url; }
	});
	const native = box.querySelector("[data-share-native]");
	if (navigator.share) {
		native.hidden = false;
		native.addEventListener("click", () => navigator.share({ title: document.title, text, url }).catch(() => {}));
	}
});

/* Club feed: type filter kept in the address (?type=stage) so a shared link opens the same view; Back restores it. */
document.querySelectorAll("[data-feed-filter]").forEach((row) => {
	const main = row.closest(".feed-main");
	const items = [...main.querySelectorAll(".feed-item")];
	const empty = main.querySelector(".feed-empty");
	const valid = new Set([...row.querySelectorAll(".chip")].map((c) => c.dataset.filter));
	const read = () => { const t = new URLSearchParams(location.search).get("type"); return valid.has(t) ? t : "all"; };
	const apply = (type) => {
		row.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.filter === type)));
		let n = 0;
		items.forEach((it) => { const ok = type === "all" || it.dataset.type === type; it.hidden = !ok; if (ok) n++; });
		empty.hidden = n > 0;
	};
	const go = (type) => {
		const u = new URL(location.href);
		if (type === "all") u.searchParams.delete("type"); else u.searchParams.set("type", type);
		history.pushState({ type }, "", u);
		apply(type);
	};
	row.addEventListener("click", (e) => { const c = e.target.closest(".chip"); if (c) go(c.dataset.filter); });
	main.querySelector("[data-filter-reset]")?.addEventListener("click", () => go("all"));
	addEventListener("popstate", () => apply(read()));
	apply(read());
});

/* FAQ: accent-insensitive search, categories, an answer opened from its link (faq.html#id), copy the answer link. */
document.querySelectorAll("[data-faq]").forEach((root) => {
	const fold = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
	const input = root.querySelector('input[type="search"]');
	const items = [...root.querySelectorAll(".qa")].map((d) => ({ d, text: fold(d.textContent), cat: d.dataset.category }));
	const count = root.querySelector(".faq-count");
	const empty = root.querySelector(".faq-empty");
	const chips = root.querySelector(".chip-row");
	let cat = "";
	const apply = () => {
		const q = fold(input.value.trim());
		let n = 0;
		items.forEach((it) => {
			const ok = (!cat || it.cat === cat) && (!q || q.split(/\s+/).every((w) => it.text.includes(w)));
			it.d.hidden = !ok;
			if (ok) n++;
		});
		if (q) items.forEach((it) => { if (!it.d.hidden) it.d.open = n <= 3; });
		count.textContent = `${n} question${n > 1 ? "s" : ""}`;
		empty.hidden = n > 0;
		if (!n) empty.querySelector("p").textContent = q ? `Aucune réponse pour « ${input.value.trim()} ». Posez-nous la question :` : "Aucune question dans cette catégorie.";
	};
	input.addEventListener("input", apply);
	chips.addEventListener("click", (e) => {
		const c = e.target.closest(".chip");
		if (!c) return;
		cat = c.dataset.cat;
		chips.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
		apply();
	});
	root.addEventListener("click", async (e) => {
		const b = e.target.closest("[data-copy-anchor]");
		if (!b) return;
		const url = location.href.split("#")[0] + "#" + b.dataset.copyAnchor;
		try { await navigator.clipboard.writeText(url); b.textContent = "Lien copié"; } catch { b.textContent = url; }
	});
	const openHash = () => {
		const d = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
		if (d && d.classList.contains("qa")) { d.hidden = false; d.open = true; d.scrollIntoView({ block: "center" }); }
	};
	addEventListener("hashchange", openHash);
	apply();
	openHash();
});

/* Lightbox shared by albums and articles: arrows, Escape, swipe, counter, caption; focus returns to the thumbnail. */
(function lightbox() {
	const galleries = document.querySelectorAll("[data-gallery]");
	if (!galleries.length) return;
	const dlg = el("dialog", "lightbox");
	dlg.setAttribute("aria-label", "Visionneuse de photos");
	const stage = el("div", "lb-stage");
	const img = el("img", "lb-img");
	const cap = el("p", "lb-cap");
	const count = el("span", "lb-count");
	const prev = el("button", "lb-btn lb-prev", "‹");
	const next = el("button", "lb-btn lb-next", "›");
	const close = el("button", "lb-btn lb-close", "×");
	prev.setAttribute("aria-label", "Photo précédente");
	next.setAttribute("aria-label", "Photo suivante");
	close.setAttribute("aria-label", "Fermer");
	[prev, next, close].forEach((b) => { b.type = "button"; });
	count.setAttribute("aria-live", "polite");
	stage.append(img);
	const bar = el("div", "lb-bar");
	bar.append(count, cap);
	dlg.append(stage, prev, next, close, bar);
	document.body.append(dlg);
	let links = [], idx = 0, opener = null;
	const show = (i) => {
		idx = (i + links.length) % links.length;
		const a = links[idx];
		const t = a.querySelector("img");
		img.src = a.getAttribute("href");
		img.alt = t ? t.alt : "";
		cap.textContent = t ? t.alt : "";
		count.textContent = `${idx + 1} / ${links.length}`;
	};
	const shut = () => { if (dlg.open) dlg.close(); };
	dlg.addEventListener("close", () => {
		document.documentElement.classList.remove("lb-open");
		opener?.focus();
	});
	prev.onclick = () => show(idx - 1);
	next.onclick = () => show(idx + 1);
	close.onclick = shut;
	dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target === stage) shut(); });
	dlg.addEventListener("keydown", (e) => {
		if (e.key === "ArrowRight") { e.preventDefault(); show(idx + 1); }
		if (e.key === "ArrowLeft") { e.preventDefault(); show(idx - 1); }
	});
	let x0 = null;
	stage.addEventListener("touchstart", (e) => { x0 = e.changedTouches[0].clientX; }, { passive: true });
	stage.addEventListener("touchend", (e) => {
		if (x0 == null) return;
		const dx = e.changedTouches[0].clientX - x0;
		x0 = null;
		if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
	});
	galleries.forEach((g) => {
		g.addEventListener("click", (e) => {
			const a = e.target.closest("a[data-lightbox]");
			if (!a) return;
			e.preventDefault();
			links = [...g.querySelectorAll("a[data-lightbox]")];
			opener = a;
			document.documentElement.classList.add("lb-open");
			dlg.showModal();
			show(links.indexOf(a));
			close.focus();
		});
	});
})();
