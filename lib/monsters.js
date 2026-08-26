// All functions take a Supabase client (browser or server) as the first arg
// so this module works from both Client and Server Components.

export const ELEMENTS = ["Fire", "Water", "Wind", "Light", "Dark"];
export const TAG_OPTIONS = ["Strip", "Damage", "Support", "CC"];

/**
 * Load every monster plus its tags and weak/strong relations, joined
 * client-side (kept simple rather than fighting Supabase's embedding
 * syntax for a table with two FKs pointing at the same parent table).
 */
export async function listMonsters(supabase) {
  const [{ data: monsters, error: mErr }, { data: tags, error: tErr }, { data: counters, error: cErr }] = await Promise.all([
    supabase.from("monsters").select("*").order("name"),
    supabase.from("monster_tags").select("*"),
    supabase.from("monster_counters").select("*"),
  ]);
  if (mErr) throw mErr;
  if (tErr) throw tErr;
  if (cErr) throw cErr;

  return (monsters || []).map((m) => ({
    ...m,
    tags: (tags || []).filter((t) => t.monster_id === m.id).map((t) => t.tag),
    weakAgainst: (counters || [])
      .filter((c) => c.monster_id === m.id && c.relation === "weak_against")
      .map((c) => c.counters_monster_id),
    strongAgainst: (counters || [])
      .filter((c) => c.monster_id === m.id && c.relation === "strong_against")
      .map((c) => c.counters_monster_id),
  }));
}

/**
 * Create or update a monster, including its tags and weak/strong relations.
 * Relations are stored as explicit rows in both directions (A weak_against B
 * AND B strong_against A) so reads never need to compute reciprocity —
 * this function is what keeps both directions in sync on every save.
 */
export async function saveMonster(supabase, data) {
  const isNew = !data.id;
  const payload = {
    name: data.name,
    element: data.element,
    stars: data.stars,
    meta: data.meta,
    image_url: data.imageUrl || null,
    notes: data.notes || null,
    updated_at: new Date().toISOString(),
  };

  let monsterId = data.id;
  if (isNew) {
    const { data: inserted, error } = await supabase.from("monsters").insert(payload).select().single();
    if (error) throw error;
    monsterId = inserted.id;
  } else {
    const { error } = await supabase.from("monsters").update(payload).eq("id", monsterId);
    if (error) throw error;
  }

  // Replace tags wholesale — simplest correct approach for a handful of rows.
  await supabase.from("monster_tags").delete().eq("monster_id", monsterId);
  if (data.tags?.length) {
    await supabase.from("monster_tags").insert(data.tags.map((tag) => ({ monster_id: monsterId, tag })));
  }

  // Replace every relation edge that touches this monster (either side),
  // then re-insert both directions from the form's current lists.
  await supabase.from("monster_counters").delete().eq("monster_id", monsterId);
  await supabase.from("monster_counters").delete().eq("counters_monster_id", monsterId);

  const rows = [];
  (data.weakAgainst || []).forEach((otherId) => {
    rows.push({ monster_id: monsterId, counters_monster_id: otherId, relation: "weak_against" });
    rows.push({ monster_id: otherId, counters_monster_id: monsterId, relation: "strong_against" });
  });
  (data.strongAgainst || []).forEach((otherId) => {
    rows.push({ monster_id: monsterId, counters_monster_id: otherId, relation: "strong_against" });
    rows.push({ monster_id: otherId, counters_monster_id: monsterId, relation: "weak_against" });
  });
  if (rows.length) {
    const { error } = await supabase.from("monster_counters").insert(rows);
    if (error) throw error;
  }

  return monsterId;
}

export async function deleteMonster(supabase, id) {
  // monster_tags / monster_counters rows are removed automatically via
  // ON DELETE CASCADE defined in the migration.
  const { error } = await supabase.from("monsters").delete().eq("id", id);
  if (error) throw error;
}

/** Upload an image file to the `monster-images` bucket and return its public URL. */
export async function uploadMonsterImage(supabase, file) {
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("monster-images").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("monster-images").getPublicUrl(path);
  return data.publicUrl;
}
