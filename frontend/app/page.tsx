"use client";

import { FormEvent, useMemo, useState } from "react";
import { marked } from "marked";

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
  supervisor_reasoning?: string;
  guardrail_allowed?: boolean;
};

const prompts = [
  ["🇯🇵", "Japan", "Plan a complete 7 days Japan trip from Bangladesh including flights, hotels and sightseeing under 2 lakhs."],
  ["🇦🇪", "Dubai", "Plan a 5 days Dubai trip from Dhaka with flights, hotels and sightseeing."],
  ["🇹🇭", "Thailand", "Plan a 7 days Thailand trip from Bangladesh with budget hotels and sightseeing."]
];

function excerpt(value = "", fallback: string) {
  const clean = value.replace(/[#*_`]/g, "").replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, 72) + (clean.length > 72 ? "..." : "") : fallback;
}

function htmlFromMarkdown(value = "") {
  return { __html: marked.parse(value) as string };
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [plan, setPlan] = useState<TravelResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const isReviewing = Boolean(plan?.requires_approval);
  const constraints = plan?.trip_constraints || {};
  const destination = String(constraints.destination || "your next escape");
  const duration = String(constraints.duration || "A flexible itinerary");
  const budget = String(constraints.budget || "A considered budget");
  const style = String(constraints.travel_style || "Your travel style");

  const research = useMemo(() => [
    ["Flights", excerpt(plan?.flight_results, "Route options researched")],
    ["Stays", excerpt(plan?.hotel_results, "Comfortable places matched")],
    ["Weather", excerpt(plan?.weather_results, "Local conditions considered")],
    ["Budget", excerpt(plan?.budget_results, "A clear estimate prepared")]
  ], [plan]);

  async function submitTravel(event?: FormEvent) {
    event?.preventDefault();
    if (!message.trim() || loading) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/travel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: message.trim(), thread_id: threadId }) });
      const data = await response.json() as TravelResponse;
      if (!response.ok || !data.success) throw new Error(data.error || "TripMate could not create this plan.");
      setPlan(data); setThreadId(data.thread_id);
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong while planning your trip."); }
    finally { setLoading(false); }
  }

  async function submitReview(approved: boolean) {
    if (!threadId || loading || (!approved && !feedback.trim())) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/travel/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ thread_id: threadId, approved, feedback: feedback.trim() }) });
      const data = await response.json() as TravelResponse;
      if (!response.ok || !data.success) throw new Error(data.error || "TripMate could not update this plan.");
      setPlan(data); setFeedback("");
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong while updating your trip."); }
    finally { setLoading(false); }
  }

  async function copyPlan() {
    if (!plan?.answer) return;
    await navigator.clipboard.writeText(plan.answer); setCopied(true); window.setTimeout(() => setCopied(false), 1500);
  }

  return <div className="page-shell">
    <header className="site-header"><a className="brand" href="#top"><span className="brand-mark">✦</span><span>TripMate <b>AI</b></span></a><nav className="main-nav"><a className="active" href="#top">Plan a trip</a><a href="#plan">My trips</a><a href="#explore">Explore</a></nav><button className="profile-button" aria-label="Open profile">DD</button></header>
    <main id="top">
      <section className="hero-section"><div className="hero-copy"><p className="eyebrow">Your personal travel companion</p><h1>Go somewhere<br /><em>worth remembering.</em></h1><p className="hero-lede">Tell us what you are dreaming of. TripMate brings together the route, stay, weather, budget and daily rhythm of your next adventure.</p><div className="hero-proof"><span className="avatar-stack"><i>✈</i><i>◎</i><i>✦</i></span><span>Thoughtful plans, made in minutes</span></div></div><div className="hero-image"><span className="image-note">Made for the way you travel <b>↗</b></span></div></section>
      <section id="plan" className="planner-card"><div className="planner-heading"><div><p className="eyebrow">Start with a feeling</p><h2>Where should we take you?</h2></div><span className="verified-pill"><span /> Ready to plan</span></div><form className="input-area" onSubmit={submitTravel}><label className="sr-only" htmlFor="userInput">Describe your trip</label><textarea id="userInput" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Try: Plan a 7-day Japan trip from Bangladesh under 200,000 BDT..." rows={3} /><button id="sendBtn" type="submit" disabled={loading}>{loading ? <span className="loader" /> : <>Create my trip <b>↗</b></>}</button></form><div className="planner-footer"><span>Popular escapes</span><div className="quick-prompts">{prompts.map(([flag, name, text]) => <button type="button" key={name} onClick={() => setMessage(text)}>{flag} {name}</button>)}<button type="button" onClick={() => setMessage("Find flight information for my next international trip.")}>✈ Explore flights</button></div></div></section>
      {loading && <section className="planning-section"><div className="section-heading"><div><p className="eyebrow">Your journey is taking shape</p><h2>TripMate is planning your journey<span className="loading-dots">...</span></h2></div><span className="verified-pill"><span /> Trip request verified</span></div><p className="planning-reason">Researching the details that make a trip feel like yours.</p><div className="progress-steps">{["Understanding your trip", "Researching the essentials", "Building your itinerary", "Ready for your review"].map((step, index) => <div className={`progress-step ${index < 2 ? "complete" : index === 2 ? "active" : ""}`} key={step}><span>{index < 2 ? "✓" : index === 2 ? "✦" : "○"}</span><div><b>{step}</b><small>{index === 0 ? "Finding the details that matter" : index === 1 ? "Checking routes, stays and conditions" : index === 2 ? "Shaping a plan around you" : "You stay in control"}</small></div></div>)}</div></section>}
      {plan && <section className="trip-workspace"><div className="trip-header"><div><p className="eyebrow">{isReviewing ? "Your trip preview" : "Your finished guide"}</p><h2>{destination} adventure</h2><p className="trip-meta">{duration} · {style} · {budget}</p></div><div className="result-actions"><button className="icon-button" onClick={copyPlan}>⧉ <span>{copied ? "Copied" : "Copy"}</span></button><button className="secondary-button" onClick={() => window.print()}>Download guide <b>↓</b></button></div></div><div className="summary-grid">{research.map(([title, value], index) => <article className={`summary-card card-${index}`} key={title}><span className="summary-icon">{["✈", "⌂", "☼", "◌"][index]}</span><div><small>{title}</small><strong>{value}</strong><p>{index === 0 ? "Route options researched" : index === 1 ? "Matched to your style" : index === 2 ? "Forecast considered" : "Plan with confidence"}</p></div></article>)}</div><div className="trip-grid"><article className="itinerary-panel"><div className="panel-heading"><div><p className="eyebrow">The story of your trip</p><h3>Day by day</h3></div><span className="panel-badge">{isReviewing ? "Draft plan" : "Final guide"}</span></div><div className="result-box" dangerouslySetInnerHTML={htmlFromMarkdown(plan.answer || plan.itinerary)} /></article><aside className="details-column"><article className="details-card"><div className="panel-heading"><h3>What we found</h3><span className="small-spark">✦</span></div><div className="research-details">{research.map(([title, value]) => <p key={title}><b>{title}</b>{value}</p>)}</div></article><article className="details-card"><div className="panel-heading"><h3>Plan at a glance</h3><span className="small-spark">◌</span></div><div className="constraint-details"><div><span>Destination</span><b>{destination}</b></div><div><span>Duration</span><b>{duration}</b></div><div><span>Budget</span><b>{budget}</b></div></div></article></aside></div></section>}
      {isReviewing && <section className="review-panel"><div className="review-art">✦</div><div><p className="eyebrow">A quick check-in</p><h2>Does this trip feel like you?</h2><p className="review-copy">Your draft is ready. Approve it or tell TripMate what to change.</p><label className="sr-only" htmlFor="feedback">Trip feedback</label><textarea id="feedback" className="feedback-input" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Try: Reduce hotel costs and add more cultural activities..." /><div className="approval-actions"><button className="approve-btn" disabled={loading} onClick={() => submitReview(true)}>Approve & create final <b>↗</b></button><button className="revise-btn" disabled={loading || !feedback.trim()} onClick={() => submitReview(false)}>Revise with feedback</button></div></div></section>}
      {error && <section className="error-box" role="alert">{error}</section>}
    </main><footer><span>TripMate AI</span><span>Thoughtful travel, one prompt away.</span></footer>
  </div>;
}
