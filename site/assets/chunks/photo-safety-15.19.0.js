/**
 * Post-resolution safety boundary: mapping an exact Greek/English food name can
 * change its canonical ID. The mapped ID MUST pass current hard exclusions.
 * No uncertain name is auto-selected or sent to recipe generation.
 */
export function resolveAndGuardPhotoRows(rows,resolve,isExcluded) {
  if (!Array.isArray(rows) || typeof resolve!=='function' || typeof isExcluded!=='function')
    throw Error('Photo confirmation inputs are unavailable.');
  return rows.map(row=>{
    const canonical=resolve(row);
    const excluded=canonical ? !!isExcluded(canonical) : false;
    const blocked=!!row?.blocked || excluded;
    return {...row,key:canonical,catalog:canonical,
      usable:!!canonical && !blocked,blocked,
      selected:!!canonical && !!row?.selected && !blocked};
  });
}
