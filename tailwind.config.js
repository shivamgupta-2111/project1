module.exports={darkMode:'class',content:['./app/**/*.tsx','./components/**/*.tsx'],theme:{extend:{
fontFamily:{sans:['Inter','system-ui','-apple-system','Segoe UI','Roboto','sans-serif']},
// calmer, enterprise-style corners: nothing is pill-shaped except avatars, badges and counters
borderRadius:{md:'0.375rem',lg:'0.5rem',xl:'0.75rem','2xl':'0.75rem','3xl':'0.75rem'},
colors:{bg:'rgb(var(--bg) / <alpha-value>)',card:'rgb(var(--card) / <alpha-value>)',line:'rgb(var(--line) / <alpha-value>)',ink:'rgb(var(--ink) / <alpha-value>)',mute:'rgb(var(--mute) / <alpha-value>)',brand:{DEFAULT:'rgb(var(--brand) / <alpha-value>)',dark:'#d45f1a'}},
boxShadow:{sm:'0 2px 20px rgba(0,0,0,0.08)',md:'0 8px 40px rgba(0,0,0,0.12)',lg:'0 24px 80px rgba(0,0,0,0.18)'}}}}
