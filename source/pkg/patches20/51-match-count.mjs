// 15.20 · My pantry results: the tab counts what it shows.
// Measured after saving six typed foods: the tab read "Best matches (42)" and the line under it "20 recipe ideas use your foods".
// The tab counted every ranked candidate (L); the list it opens shows the ones that use a saved food (g), or L only in the two cases
// the page itself already handles (the "show everything" switch, and use-up mode with nothing else to show). The label now uses the
// same choice as the list, so the two numbers are one number.
export default {
  title: 'pantry results: "Best matches (n)" counts the list it opens',
  apply(c) {
    c.edit('assets/site.js', `['[data-suggestion-mode="all"]',"Best matches",L.length]`, `['[data-suggestion-mode="all"]',"Best matches",(ga||C?L:g).length]`, {label: 'best-matches count'});
    // the list selection this mirrors must still be the one in the file
    if (!c.read('assets/site.js').includes('N=K==="ready"?I:K==="almost"?$:ga||C?L:g')) throw new Error('match count: the list selection changed; re-read it before keeping this patch');
  }
};
