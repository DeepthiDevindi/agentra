"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { ROUTES, TRIP_SECTIONS } from "../lib/routes";

type TravelResponse = {
  success: boolean;
  error?: string;
  thread_id: string;
  answer: string;
  requires_approval: boolean;
  approval_request?: string;
  flight_results?: string;
  hotel_results?: string;
  weather_results?: string;
  budget_results?: string;
  itinerary?: string;
  trip_constraints?: Record<string, string | string[]>;
};

type Money = { value: number; label: string };
type Activity = { time: string; title: string; detail: string };
type DayPlan = { day: string; title: string; location: string; activities: Activity[]; detail: string };
type TripPlan = { title: string; destination: string; origin: string; duration: string; travelers: string; budget: string; currency: string; summary: string; days: DayPlan[]; flights: string; stays: string; weather: string; budgetText: string; tips: string[]; food: string[]; experiences: string[]; money: Money[]; total: number | null };

const prompts = [
  ["🇯🇵", "Japan", "Plan a complete 7 days Japan trip from Bangladesh including flights, hotels and sightseeing under 2 lakhs."],
  ["🇦🇪", "Dubai", "Plan a 5 days Dubai trip from Dhaka with flights, hotels and sightseeing."],
  ["🇹🇭", "Thailand", "Plan a 7 days Thailand trip from Bangladesh with budget hotels and sightseeing."]
];
const sectionNames = ["flight", "hotel", "accommodation", "stay", "weather", "budget", "food", "restaurant", "experience", "activity", "tip", "recommendation"];

function clean(value: string) { return value.replace(/\|/g, " · ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim(); }
function excerpt(value = "", fallback: string) { const text = clean(value); return text ? text.slice(0, 100) + (text.length > 100 ? "..." : "") : fallback; }
function findMoney(value: string) { return [...value.matchAll(/(?:LKR|BDT|USD|EUR|JPY|৳|₹|\$|€|¥)\s*([\d,]+)|([\d,]+)\s*(?:LKR|BDT|USD|EUR|JPY)/gi)].map((match) => Number((match[1] || match[2]).replace(/,/g, ""))).filter(Boolean); }

function parsePlan(response: TravelResponse): TripPlan {
  const constraints = response.trip_constraints || {};
  const source = response.answer || response.itinerary || "";
  const lines = source.split("\n").map(clean).filter(Boolean);
  const destination = String(constraints.destination || lines.find((line) => /trip|adventure|itinerary/i.test(line))?.replace(/^\d+[-.)]?\s*/, "") || "Your next adventure");
  const origin = String(constraints.origin || "Your departure city");
  const duration = String(constraints.duration || lines.find((line) => /\d+[- ]day/i.test(line))?.match(/\d+[- ]day[s]?/i)?.[0] || "A thoughtful itinerary");
  const budget = String(constraints.budget || "Budget to be confirmed");
  const currency = budget.match(/[A-Z]{3}|[৳₹$€¥]/)?.[0] || "Estimated";
  const title = lines.find((line) => /day|adventure|itinerary|trip/i.test(line)) || `${duration} in ${destination}`;
  const days: DayPlan[] = [];
  let current: DayPlan | null = null;
  let activeSection = "overview";
  const buckets: Record<string, string[]> = {};

  for (const line of lines) {
    const dayMatch = line.match(/(?:day|day\s*)0?(\d{1,2})\s*[:|-]?\s*(.*)/i);
    const heading = line.replace(/^#+\s*/, "").toLowerCase();
    const matchedSection = sectionNames.find((name) => heading.includes(name));
    if (matchedSection) activeSection = matchedSection;
    if (dayMatch) {
      current = { day: `DAY ${dayMatch[1].padStart(2, "0")}`, title: clean(dayMatch[2]) || "A day to remember", location: destination, activities: [], detail: "Your day, thoughtfully paced around the places that matter." };
      days.push(current);
      continue;
    }
    const activityMatch = line.match(/^(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)[-:]\s*(.*)$/i);
    if (current && activityMatch) current.activities.push({ time: activityMatch[1], title: clean(activityMatch[2]), detail: "A flexible stop in your itinerary." });
    else (buckets[activeSection] ||= []).push(line);
  }

  if (!days.length) {
    const chunks = lines.filter((line) => line.length > 34).slice(0, 7);
    chunks.forEach((line, index) => days.push({ day: `DAY ${(index + 1).toString().padStart(2, "0")}`, title: line.slice(0, 58), location: destination, activities: [{ time: "Today", title: line, detail: "A recommended moment from your AI-planned route." }], detail: "Move at your own pace and leave room for discovery." }));
  }

  const allMoney = findMoney([source, response.budget_results || ""].join(" "));
  const categories = Object.entries(buckets).flatMap(([label, values]) => { const value = findMoney(values.join(" "))[0]; return value ? [{ label: label[0].toUpperCase() + label.slice(1), value }] : []; });
  const total = allMoney.length ? Math.max(...allMoney) : null;
  return { title: clean(title), destination, origin, duration, travelers: String(constraints.travelers || "Your travel party"), budget, currency, summary: excerpt(source, "A personalized journey researched around your preferences."), days, flights: excerpt(response.flight_results, "Route options researched and clearly labeled as estimates where live prices are unavailable."), stays: excerpt(response.hotel_results, "Suggested areas and accommodation ideas matched to your trip."), weather: excerpt(response.weather_results, "Seasonal conditions considered for a more comfortable route."), budgetText: excerpt(response.budget_results, "Budget guidance prepared from the available travel research."), tips: (buckets.tip || buckets.recommendation || lines.filter((line) => /recommend|advice|suggest/i.test(line))).slice(0, 4), food: (buckets.food || buckets.restaurant || []).slice(0, 4), experiences: (buckets.experience || buckets.activity || []).slice(0, 5), money: categories, total };
}

function TripHero({ plan, onCopy, copied }: { plan: TripPlan; onCopy: () => void; copied: boolean }) {
  return <section className="trip-hero"><div className="trip-hero-image" /><div className="trip-hero-copy"><p className="eyebrow light">Your trip</p><h2>{plan.title}</h2><p className="hero-route">{plan.origin} <span>→</span> {plan.destination}</p><div className="trip-meta-grid"><span>◷ <b>{plan.duration}</b></span><span>♧ <b>{plan.travelers}</b></span><span>◌ <b>{plan.budget}</b></span><span>✈ <b>{plan.origin}</b></span></div><span className="ai-badge">✦ AI-planned for you</span></div><div className="trip-actions"><button onClick={onCopy}>{copied ? "Copied" : "Save trip"}</button><button onClick={onCopy}>Share</button><button onClick={() => window.print()}>Download PDF</button></div></section>;
}

function SiteHeader() {
  const pathname = usePathname();
  const active = pathname.startsWith(ROUTES.TRIPS) ? ROUTES.TRIPS : pathname.startsWith(ROUTES.EXPLORE) ? ROUTES.EXPLORE : pathname.startsWith(ROUTES.PLAN) ? ROUTES.PLAN : ROUTES.HOME;
  return <header className="site-header"><Link className="brand" href={ROUTES.HOME}><span className="brand-mark">✦</span><span>TripMate <b>AI</b></span></Link><nav className="main-nav"><Link className={active === ROUTES.PLAN ? "active" : ""} href={ROUTES.PLAN}>Plan a trip</Link><Link className={active === ROUTES.TRIPS ? "active" : ""} href={ROUTES.TRIPS}>My trips</Link><Link className={active === ROUTES.EXPLORE ? "active" : ""} href={ROUTES.EXPLORE}>Explore</Link></nav><button className="profile-button" aria-label="Open profile">DD</button></header>;
}

function TripSectionNav() {
  return <nav className="trip-nav" aria-label="Trip sections">{TRIP_SECTIONS.map(([label, id]) => <a href={`#${id}`} key={id}>{label}</a>)}</nav>;
}

function OverviewCards({ plan }: { plan: TripPlan }) {
  const cards = [["✈", "Flights", excerpt(plan.flights, "Route research ready"), "Estimate"], ["⌂", "Where you’ll stay", excerpt(plan.stays, "Suggested areas"), "Suggested"], ["☼", "Weather", excerpt(plan.weather, "Seasonal estimate"), "Estimate"], ["◌", "Budget", plan.total ? `${plan.currency} ${plan.total.toLocaleString()}` : excerpt(plan.budgetText, "Review estimate"), "Calculated from available data"]];
  return <div className="overview-grid">{cards.map(([icon, label, value, note]) => <article className="overview-card" key={label}><span className="overview-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></article>)}</div>;
}

function BudgetOverview({ plan }: { plan: TripPlan }) {
  const categoryTotal = plan.money.reduce((sum, item) => sum + item.value, 0);
  const mismatch = Boolean(plan.total && plan.money.length && Math.abs(categoryTotal - plan.total) > plan.total * 0.05);
  return <section className="content-section budget-section" id="budget"><div className="section-intro"><p className="eyebrow">Your trip at a glance</p><h3>Trip budget</h3><p>Keep the big picture close while the little moments unfold.</p></div><div className="budget-layout"><div className="budget-total"><span>Estimated total</span><strong>{plan.total ? `${plan.currency} ${plan.total.toLocaleString()}` : "Reviewing estimates"}</strong><small>{plan.budget} · calculated from available research</small><div className="budget-progress"><span style={{ width: plan.total ? "82%" : "42%" }} /></div><b>{mismatch ? "Some estimates need review" : "A considered estimate for your journey"}</b></div><div className="budget-categories">{(plan.money.length ? plan.money : [{ label: "Research", value: 0 }]).map((item) => <div className="budget-row" key={item.label}><span>{item.label}</span><div><i style={{ width: `${plan.total ? Math.min(100, (item.value / plan.total) * 100) : 24}%` }} /></div><b>{item.value ? `${plan.currency} ${item.value.toLocaleString()}` : "Estimate"}</b></div>)}</div></div>{mismatch && <div className="soft-warning">⚠ Some estimates need review. We found different totals in the research, so no duplicated number has been silently presented as exact.</div>}</section>;
}

function Itinerary({ plan }: { plan: TripPlan }) {
  return <section className="content-section" id="itinerary"><div className="section-intro"><p className="eyebrow">The story of your trip</p><h3>Day by day</h3><p>Your journey, thoughtfully planned with room for your own discoveries.</p></div><div className="timeline">{plan.days.map((day, index) => <article className="day-card" key={day.day + day.title}><div className="day-art" style={{ backgroundImage: `url(https://images.unsplash.com/photo-${[1493976040374,1540959733332,1528360983277,1528360983277,1530789253388,1528360983277,1503899036084][index % 7]}?auto=format&fit=crop&w=700&q=80)` }}><span>{day.day}</span></div><div className="day-content"><div className="day-heading"><div><h4>{day.title}</h4><p>{day.location} · {day.detail}</p></div><span className="day-marker">{String(index + 1).padStart(2, "0")}</span></div><div className="activity-list">{(day.activities.length ? day.activities : [{ time: "Today", title: day.detail, detail: "Flexible timing" }]).map((activity, activityIndex) => <div className="activity" key={`${activity.time}-${activityIndex}`}><span className="activity-time">{activity.time}</span><span className="activity-dot">{["✈", "⌂", "🍜", "⛩", "✦"][activityIndex % 5]}</span><div><b>{activity.title}</b><p>{activity.detail}</p></div></div>)}</div></div></article>)}</div></section>;
}

function SupportingSections({ plan }: { plan: TripPlan }) {
  const blocks = [["Flights", "✈", plan.flights, "flights"], ["Where you’ll stay", "⌂", plan.stays, "stay"], ["What the weather might feel like", "☼", plan.weather, "weather"]];
  return <>{blocks.map(([title, icon, text, key]) => <section className="content-section support-section" id={key} key={key}><div className="support-icon">{icon}</div><div><p className="eyebrow">Trip details</p><h3>{title}</h3><p className="support-copy">{text}</p><span className="estimate-label">● {key === "flight" ? "Estimated flight information" : key === "stay" ? "Suggested accommodation areas" : "Seasonal estimate"}</span></div></section>)}<section className="content-section card-section"><div className="section-intro"><p className="eyebrow">Personal touches</p><h3>Eat, explore, remember</h3></div><div className="mini-card-grid">{[...(plan.food.length ? plan.food : ["Local flavors worth making time for"]), ...(plan.experiences.length ? plan.experiences : ["The places that make this destination feel like itself"])].slice(0, 6).map((item, index) => <article className="mini-card" key={`${item}-${index}`}><span>{index % 2 ? "✦" : "🍜"}</span><b>{clean(item).slice(0, 80)}</b><small>{index % 2 ? "Experience suggestion" : "Food recommendation"}</small></article>)}</div></section></>;
}

function TripInsights({ plan }: { plan: TripPlan }) {
  const tips = plan.tips.length ? plan.tips : ["Book the most time-sensitive parts of the journey early.", "Keep a small reserve for prices that may change.", "Leave an unplanned pocket in each day for local discoveries."];
  return <section className="content-section insights" id="tips"><div className="section-intro"><p className="eyebrow">A little wisdom from TripMate</p><h3>TripMate’s tips ✦</h3></div><div className="insight-grid">{tips.map((tip, index) => <article key={tip}><span>{["💡", "◌", "✦", "⌁"][index % 4]}</span><p>{clean(tip)}</p></article>)}</div></section>;
}

function ReviewPanel({ plan, feedback, setFeedback, loading, onReview }: { plan: TravelResponse; feedback: string; setFeedback: (value: string) => void; loading: boolean; onReview: (approved: boolean) => void }) {
  if (!plan.requires_approval) return <section className="final-actions"><span className="final-check">✓</span><div><p className="eyebrow">Your trip is ready</p><h3>Your adventure is ready to go ✨</h3><p>Flights, accommodation, itinerary, budget and thoughtful tips are all in one place.</p></div><button onClick={() => window.print()}>Download guide ↓</button></section>;
  return <section className="review-panel"><div className="review-art">✦</div><div><p className="eyebrow light">A quick check-in</p><h3>Your trip is ready for review</h3><p>Take a look through your plan. Approve it or tell TripMate what you’d like to change.</p><textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Make the trip more relaxed, reduce accommodation costs, and add more cultural experiences..." /><div className="approval-actions"><button className="approve-btn" disabled={loading} onClick={() => onReview(true)}>✓ Approve & generate final</button><button className="revise-btn" disabled={loading || !feedback.trim()} onClick={() => onReview(false)}>↻ Change something</button></div></div></section>;
}

function HomeContent() {
  const [message, setMessage] = useState(""); const [feedback, setFeedback] = useState(""); const [threadId, setThreadId] = useState<string | null>(null); const [plan, setPlan] = useState<TravelResponse | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [copied, setCopied] = useState(false); const [tripHydrated, setTripHydrated] = useState(false);
  const pathname = usePathname(); const router = useRouter(); const searchParams = useSearchParams(); const destinationParam = searchParams.get("destination");
  const parsedPlan = useMemo(() => plan ? parsePlan(plan) : null, [plan]);
  useEffect(() => {
    if (destinationParam && !message) setMessage(`Plan a trip to ${destinationParam} with flights, stays, weather, and a budget.`);
    if (pathname.startsWith("/trips/") && !plan) {
      const saved = localStorage.getItem("tripmate_active_trip");
      if (saved) {
        try {
          const savedPlan = JSON.parse(saved) as TravelResponse;
          if (savedPlan.thread_id === pathname.split("/").pop()) { setPlan(savedPlan); setThreadId(savedPlan.thread_id); }
        } catch { localStorage.removeItem("tripmate_active_trip"); }
      }
    }
    setTripHydrated(true);
  }, [destinationParam, message, pathname, plan]);
  async function readResponse(response: Response): Promise<TravelResponse> { const type = response.headers.get("content-type") || ""; if (type.includes("application/json")) return response.json() as Promise<TravelResponse>; const body = await response.text(); return { success: false, error: clean(body) || "The travel service returned an unexpected response.", thread_id: "", answer: "", requires_approval: false }; }
  async function submitTravel(event?: FormEvent) { event?.preventDefault(); if (!message.trim() || loading) return; setLoading(true); setError(""); try { const response = await fetch("/api/travel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: message.trim(), thread_id: threadId }) }); const data = await readResponse(response); if (!response.ok || !data.success) throw new Error(data.error || "TripMate could not create this plan."); setPlan(data); setThreadId(data.thread_id); localStorage.setItem("tripmate_active_trip", JSON.stringify(data)); router.replace(ROUTES.TRIP(data.thread_id)); } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong while planning your trip."); } finally { setLoading(false); } }
  async function submitReview(approved: boolean) { if (!threadId || loading || (!approved && !feedback.trim())) return; setLoading(true); setError(""); try { const response = await fetch("/api/travel/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ thread_id: threadId, approved, feedback: feedback.trim() }) }); const data = await readResponse(response); if (!response.ok || !data.success) throw new Error(data.error || "TripMate could not update this plan."); setPlan(data); localStorage.setItem("tripmate_active_trip", JSON.stringify(data)); setFeedback(""); } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong while updating your trip."); } finally { setLoading(false); } }
  async function copyPlan() { if (!plan?.answer) return; await navigator.clipboard.writeText(plan.answer); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }

  const tripMissing = pathname.startsWith("/trips/") && tripHydrated && !plan;
  return <div className="page-shell"><SiteHeader /><main id="top">{tripMissing ? <section className="simple-page"><p className="eyebrow">A wrong turn</p><h1>This journey doesn&apos;t exist.</h1><p className="simple-lede">We couldn&apos;t find a saved trip for this address.</p><Link className="primary-link" href={ROUTES.TRIPS}>Back to My Trips</Link><Link className="text-link" href={ROUTES.PLAN}>Plan a new trip</Link></section> : !parsedPlan ? <><section className="hero-section"><div className="hero-copy"><p className="eyebrow">Your personal travel companion</p><h1>Go somewhere<br /><em>worth remembering.</em></h1><p className="hero-lede">Tell us what you are dreaming of. TripMate brings together the route, stay, weather, budget and daily rhythm of your next adventure.</p><div className="hero-proof"><span className="avatar-stack"><i>✈</i><i>◎</i><i>✦</i></span><span>Thoughtful plans, made in minutes</span></div></div><div className="hero-image"><span className="image-note">Made for the way you travel <b>↗</b></span></div></section><section className="planner-card"><div className="planner-heading"><div><p className="eyebrow">Start with a feeling</p><h2>Where should we take you?</h2></div><span className="verified-pill"><span /> Ready to plan</span></div><form className="input-area" onSubmit={submitTravel}><label className="sr-only" htmlFor="userInput">Describe your trip</label><textarea id="userInput" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Try: Plan a 7-day Japan trip from Bangladesh under 200,000 BDT..." rows={3} /><button id="sendBtn" type="submit" disabled={loading}>{loading ? <span className="loader" /> : <>Create my trip <b>↗</b></>}</button></form><div className="planner-footer"><span>Popular escapes</span><div className="quick-prompts">{prompts.map(([flag, name, text]) => <button type="button" key={name} onClick={() => setMessage(text)}>{flag} {name}</button>)}</div></div></section>{loading && <LoadingState />}</> : <><TripHero plan={parsedPlan} onCopy={copyPlan} copied={copied} /><TripSectionNav /><div id="overview"><OverviewCards plan={parsedPlan} /></div><BudgetOverview plan={parsedPlan} /><Itinerary plan={parsedPlan} /><SupportingSections plan={parsedPlan} /><TripInsights plan={parsedPlan} /><ReviewPanel plan={plan!} feedback={feedback} setFeedback={setFeedback} loading={loading} onReview={submitReview} /></>}{error && <section className="error-box" role="alert">{error}</section>}</main><footer><span>TripMate AI</span><span>Thoughtful travel, one prompt away.</span></footer></div>;
}

export default function Home() {
  return <Suspense fallback={<main className="simple-page"><p className="eyebrow">TripMate AI</p><h1>Opening your journey...</h1></main>}><HomeContent /></Suspense>;
}

function LoadingState() { return <section className="planning-section"><div className="section-heading"><div><p className="eyebrow">Your journey is taking shape</p><h2>Planning your adventure<span className="loading-dots">...</span></h2></div><span className="verified-pill"><span /> Trip request verified</span></div><div className="progress-steps">{["Understanding your trip", "Checking flight options", "Finding stays", "Reviewing weather", "Building your itinerary"].map((step, index) => <div className={`progress-step ${index < 2 ? "complete" : index === 4 ? "active" : ""}`} key={step}><span>{index < 2 ? "✓" : index === 4 ? "✦" : "○"}</span><div><b>{step}</b><small>{index < 2 ? "Completed" : "TripMate is working on it"}</small></div></div>)}</div><div className="skeleton-row"><i /><i /><i /></div></section>; }
