// Entry point: registers the lazily loaded pages, sets the footer mode text and starts the router.
import { start, route, lazy, app, isStatic, $ } from './core.js';

const PAGES = {
  'home.js': ['home'], 'explore.js': ['explore'], 'animate.js': ['animate'], 'gallery.js': ['gallery'],
  'check.js': ['check'], 'about.js': ['about'],
};
lazy(Object.fromEntries(Object.entries(PAGES).flatMap(([file, names]) => names.map(n => [n, () => import('./' + file)]))));

route('notfound', () => { app().innerHTML = '<h1>Not found</h1><p><a href="#/">Back to the start</a></p>'; });

$('#mode').textContent = isStatic()
  ? 'static site: the plots are computed in your browser (JS port of the Python package)'
  : 'local app: Python server on this machine';
start();
