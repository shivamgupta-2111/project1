module.exports={darkMode:'class',content:['./app/**/*.tsx','./components/**/*.tsx'],theme:{extend:{
fontFamily:{sans:['Inter','system-ui','-apple-system','Segoe UI','Roboto','sans-serif']},
// calmer, enterprise-style corners: nothing is pill-shaped except avatars, badges and counters
borderRadius:{md:'0.375rem',lg:'0.5rem',xl:'0.75rem','2xl':'0.75rem','3xl':'0.75rem'},
colors:{bg:'rgb(var(--bg) / <alpha-value>)',card:'rgb(var(--card) / <alpha-value>)',line:'rgb(var(--line) / <alpha-value>)',ink:'rgb(var(--ink) / <alpha-value>)',mute:'rgb(var(--mute) / <alpha-value>)',brand:{DEFAULT:'rgb(var(--brand) / <alpha-value>)',dark:'#1d4ed8'}},
boxShadow:{sm:'0 1px 2px rgba(16,24,40,0.06)',md:'0 4px 12px rgba(16,24,40,0.08)',lg:'0 12px 32px rgba(16,24,40,0.16)'}}}}
