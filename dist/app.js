const state = { recipes: [], data: null, favorites: new Set(JSON.parse(localStorage.getItem('freezer-favorites') || '[]')), favoritesOnly: false };
const $ = (selector) => document.querySelector(selector);
const els = { grid: $('#recipe-grid'), template: $('#recipe-template'), search: $('#search'), category: $('#category'), quality: $('#quality'), sort: $('#sort'), favorites: $('#favorites-toggle'), count: $('#result-count'), empty: $('#empty-state'), chips: $('#active-filters'), dialog: $('#recipe-dialog'), dialogContent: $('#dialog-content'), sourceDialog: $('#source-dialog'), sourceContent: $('#source-content') };

const titleCase = (value) => value.replace(/\b\w/g, (letter) => letter.toUpperCase());
const saveFavorites = () => localStorage.setItem('freezer-favorites', JSON.stringify([...state.favorites]));
const stars = (score) => '★'.repeat(score) + '☆'.repeat(5 - score);

function recipeMatches(recipe) {
  const query = els.search.value.trim().toLowerCase();
  const searchable = [recipe.recipe, recipe.category, recipe.ingredients.join(' '), recipe.cooking_instructions, recipe.freeze_stage].join(' ').toLowerCase();
  const categoryOk = els.category.value === 'all' || recipe.category === els.category.value;
  const qualityOk = els.quality.value === 'all' || recipe.freezer_quality_score_1_to_5 >= Number(els.quality.value);
  return (!query || searchable.includes(query)) && categoryOk && qualityOk && (!state.favoritesOnly || state.favorites.has(recipe.id));
}

function sortRecipes(recipes) {
  const choice = els.sort.value;
  return recipes.sort((a, b) => {
    if (choice === 'storage') return b.best_quality_storage_months - a.best_quality_storage_months || a.recipe.localeCompare(b.recipe);
    if (choice === 'time') return a.estimated_total_cook_minutes - b.estimated_total_cook_minutes || a.recipe.localeCompare(b.recipe);
    if (choice === 'score') return b.freezer_quality_score_1_to_5 - a.freezer_quality_score_1_to_5 || a.recipe.localeCompare(b.recipe);
    return a.recipe.localeCompare(b.recipe);
  });
}

function renderFilters() {
  const filters = [];
  if (els.search.value.trim()) filters.push(['Search: ' + els.search.value.trim(), () => { els.search.value = ''; render(); }]);
  if (els.category.value !== 'all') filters.push([titleCase(els.category.value), () => { els.category.value = 'all'; render(); }]);
  if (els.quality.value !== 'all') filters.push([els.quality.options[els.quality.selectedIndex].text, () => { els.quality.value = 'all'; render(); }]);
  if (state.favoritesOnly) filters.push(['Favorites', () => { state.favoritesOnly = false; render(); }]);
  els.chips.replaceChildren(...filters.map(([label, remove]) => { const button = document.createElement('button'); button.className = 'filter-chip'; button.type = 'button'; button.innerHTML = `${label} <span aria-hidden="true">×</span>`; button.addEventListener('click', remove); return button; }));
}

function render() {
  const recipes = sortRecipes(state.recipes.filter(recipeMatches));
  els.grid.replaceChildren(...recipes.map(createCard));
  els.empty.hidden = recipes.length !== 0;
  els.count.textContent = `${recipes.length} ${recipes.length === 1 ? 'recipe' : 'recipes'} shown`;
  els.favorites.setAttribute('aria-pressed', String(state.favoritesOnly));
  els.favorites.innerHTML = `<span aria-hidden="true">${state.favoritesOnly ? '♥' : '♡'}</span> Favorites`;
  renderFilters();
}

function createCard(recipe) {
  const card = els.template.content.firstElementChild.cloneNode(true);
  card.querySelector('.category-pill').textContent = titleCase(recipe.category);
  card.querySelector('h3').textContent = recipe.recipe;
  card.querySelector('.ingredient-preview').textContent = recipe.ingredients.slice(0, 3).join(' · ') + (recipe.ingredients.length > 3 ? ' · …' : '');
  card.querySelector('.time-meta').textContent = `${recipe.estimated_total_cook_minutes} min cook`;
  card.querySelector('.storage-meta').textContent = `${recipe.best_quality_storage_months} mo. best quality`;
  const score = card.querySelector('.stars'); score.textContent = stars(recipe.freezer_quality_score_1_to_5); score.setAttribute('aria-label', `${recipe.freezer_quality_score_1_to_5} out of 5 freezer quality`);
  const heart = card.querySelector('.heart'); const saved = state.favorites.has(recipe.id); heart.classList.toggle('saved', saved); heart.textContent = saved ? '♥' : '♡'; heart.setAttribute('aria-label', `${saved ? 'Remove' : 'Save'} ${recipe.recipe} ${saved ? 'from' : 'to'} favorites`);
  heart.addEventListener('click', () => { saved ? state.favorites.delete(recipe.id) : state.favorites.add(recipe.id); saveFavorites(); render(); });
  card.querySelector('.details-button').addEventListener('click', () => openRecipe(recipe));
  return card;
}

function block(title, content, className = '') { return `<section class="detail-block ${className}"><h3>${title}</h3>${content}</section>`; }
function openRecipe(recipe) {
  const ingredients = `<ul>${recipe.ingredients.map((ingredient) => `<li>${ingredient}</li>`).join('')}</ul>`;
  els.dialogContent.innerHTML = `<div class="recipe-detail"><div class="detail-heading"><span class="category-pill">${titleCase(recipe.category)}</span><h2>${recipe.recipe}</h2><p class="detail-summary">Makes approximately ${recipe.servings_approx} portions · Freezer quality ${recipe.freezer_quality_score_1_to_5}/5</p></div><div class="detail-chips"><span>${recipe.estimated_total_cook_minutes} min cooking</span><span>${recipe.best_quality_storage_months} mo. best quality</span><span>${titleCase(recipe.freeze_stage)}</span></div><div class="detail-grid">${block('Ingredients', ingredients)}${block('Cook to', `<p>${recipe.initial_cooking_safe_temperature}</p>`)}${block('Cooking directions', `<p>${recipe.cooking_instructions}</p>`, 'wide')}${block('Before freezing', `<p>${recipe.pre_freeze_preparation}</p>`)}${block('Best packaging', `<p>${recipe.recommended_packaging}</p>`)}${block('Thaw', `<p>${recipe.thaw_instructions}</p>`)}${block('Reheat / finish', `<p>${recipe.reheating_or_finish_instructions}</p>`)}${block('Texture watch-out', `<p>${recipe.water_texture_risk}</p>`)}${block('Keep it at its best', `<p>${recipe.quality_preservation_tip}</p>`)}</div></div>`;
  els.dialog.showModal();
}

function renderGuidance(guidance) {
  const items = [['❄', 'Keep it cold', guidance.storage_temperature], ['◷', 'Chill promptly', guidance.cooling], ['✓', 'Thaw safely', guidance.food_safety]];
  $('#guidance-grid').innerHTML = items.map(([icon, title, copy]) => `<article class="guidance-card"><span aria-hidden="true">${icon}</span><h3>${title}</h3><p>${copy}</p></article>`).join('');
}
function openSources() { els.sourceContent.innerHTML = `<div class="source-content"><p class="eyebrow warm">REFERENCE NOTES</p><h2>Food safety sources</h2><p>${state.data.scope}</p><p>${state.data.standard_guidance.quality_disclaimer}</p><ul>${state.data.sources.map((source) => `<li><a href="${source}" target="_blank" rel="noreferrer">${source}</a></li>`).join('')}</ul></div>`; els.sourceDialog.showModal(); }
function clearFilters() { els.search.value = ''; els.category.value = 'all'; els.quality.value = 'all'; state.favoritesOnly = false; render(); }

async function init() {
  try {
    const response = await fetch('data/recipes.json');
    if (!response.ok) throw new Error('Could not load recipes');
    state.data = await response.json(); state.recipes = state.data.recipes;
    [...new Set(state.recipes.map((recipe) => recipe.category))].sort().forEach((category) => { const option = new Option(titleCase(category), category); els.category.add(option); });
    $('#recipe-count').textContent = state.recipes.length; $('#category-count').textContent = new Set(state.recipes.map((recipe) => recipe.category)).size;
    renderGuidance(state.data.standard_guidance); render();
  } catch (error) { els.grid.innerHTML = `<div class="empty-state"><h3>Couldn’t load the recipe library</h3><p>Please serve this folder with a static web server and try again.</p></div>`; console.error(error); }
}
[els.search, els.category, els.quality, els.sort].forEach((control) => control.addEventListener(control === els.search ? 'input' : 'change', render));
els.favorites.addEventListener('click', () => { state.favoritesOnly = !state.favoritesOnly; render(); });
$('#clear-filters').addEventListener('click', clearFilters); $('#source-button').addEventListener('click', openSources);
document.querySelectorAll('.dialog-close').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); }));
init();
