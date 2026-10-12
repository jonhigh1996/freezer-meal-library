import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const titleCase = (value) => value.replace(/\b\w/g, (letter) => letter.toUpperCase())
const stars = (score) => '★'.repeat(score) + '☆'.repeat(5 - score)
const defaultFilters = { query: '', category: 'all', quality: 'all', sort: 'name', favoritesOnly: false }
const normalizeData = (raw) => raw.recipes?.[0]?.recipe ? raw : ({
  ...raw,
  scope: raw.design?.audience || 'Freezer-friendly family recipes',
  standard_guidance: {
    storage_temperature: `Freeze at ${raw.science_backbone?.home_freezer_target_f ?? 0}°F or colder. ${raw.science_backbone?.quality_vs_safety || ''}`,
    cooling: raw.science_backbone?.safe_chill || '',
    food_safety: raw.science_backbone?.thawing || '',
    quality_disclaimer: raw.science_backbone?.quality_vs_safety || '',
  },
  sources: [...new Set(raw.recipes.map((recipe) => recipe.recipe_example_source?.url).filter(Boolean))],
  recipes: raw.recipes.map((recipe) => ({
    id: recipe.id, recipe: recipe.name, category: recipe.category, servings_approx: recipe.servings,
    ingredients: recipe.ingredients, estimated_total_cook_minutes: (recipe.prep_minutes_est || 0) + (recipe.cooking_minutes_est || 0),
    cooking_instructions: recipe.numbered_cooking_steps?.join(' ') || recipe.prep_and_assembly_steps || recipe.method,
    initial_cooking_safe_temperature: recipe.initial_safe_doneness, freeze_stage: recipe.freeze_stage?.replaceAll('_', ' '),
    pre_freeze_preparation: recipe.before_freezing, recommended_packaging: recipe.freezer_packaging,
    best_quality_storage_months: recipe.best_quality_months, thaw_instructions: recipe.thawing,
    reheating_or_finish_instructions: recipe.reheating_or_day_of_cooking,
    water_texture_risk: recipe.water_ice_texture_risks, quality_preservation_tip: recipe.quality_preservation_reason,
    freezer_quality_score_1_to_5: recipe.freezer_suitability_heuristic_1_to_5,
  })),
})

function RecipeCard({ recipe, saved, onFavorite, onOpen }) {
  return <article className="recipe-card">
    <div className="card-top"><span className="category-pill">{titleCase(recipe.category)}</span><button className={`heart ${saved ? 'saved' : ''}`} type="button" onClick={() => onFavorite(recipe.id)} aria-label={`${saved ? 'Remove' : 'Save'} ${recipe.recipe} ${saved ? 'from' : 'to'} favorites`}>{saved ? '♥' : '♡'}</button></div>
    <h3>{recipe.recipe}</h3><p className="ingredient-preview">{recipe.ingredients.slice(0, 3).join(' · ')}{recipe.ingredients.length > 3 ? ' · …' : ''}</p>
    <div className="card-meta"><span>{recipe.cook_time_label || (recipe.estimated_total_cook_minutes ? `${recipe.estimated_total_cook_minutes} min cook` : 'See directions')}</span><span>{recipe.best_quality_storage_months} mo. best quality</span></div>
    <div className="score-row"><span className="score-label">Freezer score</span><span className="stars" aria-label={`${recipe.freezer_quality_score_1_to_5} out of 5 freezer quality`}>{stars(recipe.freezer_quality_score_1_to_5)}</span></div>
    <button className="details-button" type="button" onClick={() => onOpen(recipe)}>View full plan <span>→</span></button>
  </article>
}

function RecipeDialog({ recipe, onClose }) {
  if (!recipe) return null
  const Block = ({ title, children, wide = false }) => <section className={`detail-block ${wide ? 'wide' : ''}`}><h3>{title}</h3>{children}</section>
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="recipe-detail modal-panel" role="dialog" aria-modal="true" aria-label={recipe.recipe} onMouseDown={(event) => event.stopPropagation()}><button className="dialog-close" type="button" onClick={onClose} aria-label="Close recipe details">×</button><div className="detail-heading"><span className="category-pill">{titleCase(recipe.category)}</span><h2>{recipe.recipe}</h2><p className="detail-summary">Makes approximately {recipe.servings_approx} portions · Freezer quality {recipe.freezer_quality_score_1_to_5}/5</p></div><div className="detail-chips"><span>{recipe.cook_time_label || (recipe.estimated_total_cook_minutes ? `${recipe.estimated_total_cook_minutes} min cooking` : 'See directions')}</span><span>{recipe.best_quality_storage_months} mo. best quality</span><span>{titleCase(recipe.freeze_stage)}</span></div><div className="detail-grid"><Block title="Ingredients"><ul>{recipe.ingredients.map((item) => <li key={item}>{item}</li>)}</ul></Block><Block title="Cook to"><p>{recipe.initial_cooking_safe_temperature}</p></Block><Block title="Cooking directions" wide><p style={{ whiteSpace: 'pre-line' }}>{recipe.cooking_instructions}</p></Block><Block title="Before freezing"><p>{recipe.pre_freeze_preparation}</p></Block><Block title="Best packaging"><p>{recipe.recommended_packaging}</p></Block><Block title="Thaw"><p>{recipe.thaw_instructions}</p></Block><Block title="Reheat / finish"><p>{recipe.reheating_or_finish_instructions}</p></Block><Block title="Texture watch-out"><p>{recipe.water_texture_risk}</p></Block><Block title="Keep it at its best"><p>{recipe.quality_preservation_tip}</p></Block></div></section></div>
}

function App() {
  const [data, setData] = useState(null); const [filters, setFilters] = useState(defaultFilters); const [favorites, setFavorites] = useState(() => new Set(JSON.parse(localStorage.getItem('freezer-favorites') || '[]'))); const [selected, setSelected] = useState(null); const [showSources, setShowSources] = useState(false)
  useEffect(() => { fetch('/data/recipes.json').then((response) => response.json()).then(normalizeData).then(setData).catch(() => setData({ recipes: [] })) }, [])
  useEffect(() => localStorage.setItem('freezer-favorites', JSON.stringify([...favorites])), [favorites])
  const categories = useMemo(() => data ? [...new Set(data.recipes.map((recipe) => recipe.category))].sort() : [], [data])
  const recipes = useMemo(() => { if (!data) return []; const query = filters.query.toLowerCase(); return data.recipes.filter((recipe) => { const content = [recipe.recipe, recipe.category, recipe.ingredients.join(' '), recipe.cooking_instructions].join(' ').toLowerCase(); return (!query || content.includes(query)) && (filters.category === 'all' || recipe.category === filters.category) && (filters.quality === 'all' || recipe.freezer_quality_score_1_to_5 >= Number(filters.quality)) && (!filters.favoritesOnly || favorites.has(recipe.id)) }).sort((a, b) => filters.sort === 'storage' ? b.best_quality_storage_months - a.best_quality_storage_months : filters.sort === 'time' ? a.estimated_total_cook_minutes - b.estimated_total_cook_minutes : filters.sort === 'score' ? b.freezer_quality_score_1_to_5 - a.freezer_quality_score_1_to_5 : a.recipe.localeCompare(b.recipe)) }, [data, filters, favorites])
  const change = (key, value) => setFilters((current) => ({ ...current, [key]: value }))
  const toggleFavorite = (id) => setFavorites((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next })
  if (!data) return <main className="loading">Loading your freezer plan…</main>
  return <><a className="skip-link" href="#recipes">Skip to recipes</a><header className="hero"><div className="hero-inner shell"><div className="brand"><span className="brand-mark">✦</span><span>Freezer Meal Library</span></div><p className="eyebrow">COMPLETE RECIPE DIRECTIONS</p><h1>Cook now,<br /><em>enjoy later.</em></h1><p className="hero-copy">A local collection of freezer meals with full preparation, cooking, packaging, thawing, and reheating instructions.</p><div className="hero-stats"><div><strong>{data.recipes.length}</strong><span>recipes</span></div><div><strong>{categories.length}</strong><span>meal types</span></div><div><strong>4–8</strong><span>portions each</span></div></div></div><div className="sun" /><div className="grain" /></header><main><section className="guidance shell"><div><p className="eyebrow warm">START HERE</p><h2>Freeze smart.</h2></div><div className="guidance-grid">{[['❄','Keep it cold',data.standard_guidance.storage_temperature],['◷','Chill promptly',data.standard_guidance.cooling],['✓','Thaw safely',data.standard_guidance.food_safety]].map(([icon,title,copy]) => <article className="guidance-card" key={title}><span>{icon}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section><section className="library shell" id="recipes"><div className="section-heading"><div><p className="eyebrow warm">THE COLLECTION</p><h2>Find dinner’s future self.</h2></div><p className="result-count">{recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'} shown</p></div><div className="controls"><label className="search-field"><span className="sr-only">Search recipes</span><span>⌕</span><input type="search" placeholder="Search meals or ingredients" value={filters.query} onChange={(e) => change('query', e.target.value)} /></label><label className="select-field"><span>Type</span><select value={filters.category} onChange={(e) => change('category', e.target.value)}><option value="all">All meal types</option>{categories.map((category) => <option key={category} value={category}>{titleCase(category)}</option>)}</select></label><label className="select-field"><span>Quality</span><select value={filters.quality} onChange={(e) => change('quality', e.target.value)}><option value="all">Any freezer score</option><option value="5">Excellent (5)</option><option value="4">Great (4+)</option><option value="3">Good (3+)</option></select></label><label className="select-field"><span>Sort</span><select value={filters.sort} onChange={(e) => change('sort', e.target.value)}><option value="name">Name, A–Z</option><option value="storage">Longest storage</option><option value="time">Quickest to cook</option><option value="score">Highest score</option></select></label><button className="favorites-toggle" type="button" aria-pressed={filters.favoritesOnly} onClick={() => change('favoritesOnly', !filters.favoritesOnly)}><span>{filters.favoritesOnly ? '♥' : '♡'}</span> Favorites</button></div><div className="recipe-grid">{recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} saved={favorites.has(recipe.id)} onFavorite={toggleFavorite} onOpen={setSelected} />)}</div>{!recipes.length && <div className="empty-state"><span>⌕</span><h3>No meals found</h3><p>Try clearing a filter or searching a different ingredient.</p><button type="button" onClick={() => setFilters(defaultFilters)}>Clear filters</button></div>}</section></main><footer><div className="shell footer-inner"><div><div className="brand"><span className="brand-mark">✦</span><span>Freezer Meal Library</span></div><p>Made for calmer weeknights.</p></div><button className="source-button" type="button" onClick={() => setShowSources(true)}>Food safety sources <span>↗</span></button></div></footer><RecipeDialog recipe={selected} onClose={() => setSelected(null)} />{showSources && <div className="modal-backdrop" onMouseDown={() => setShowSources(false)}><section className="source-content modal-panel" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button className="dialog-close" type="button" onClick={() => setShowSources(false)}>×</button><p className="eyebrow warm">REFERENCE NOTES</p><h2>Food safety sources</h2><p>{data.scope}</p><p>{data.standard_guidance.quality_disclaimer}</p><ul>{data.sources.map((url) => <li key={url}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>)}</ul></section></div>}</>
}

createRoot(document.getElementById('root')).render(<App />)
