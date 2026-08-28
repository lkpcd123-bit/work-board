s=open('src/App.js',encoding='utf-8').read()
s=s.replace("  const C24_SECRET='nlcR1GFrJpdiFVbUsmt2BD';
", '')
open('src/App.js','w',encoding='utf-8').write(s)
