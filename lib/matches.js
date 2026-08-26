export async function saveMatch(supabase, { userId, mode, teamA, teamB, playedAs, result, opponentName }) {
  const { error } = await supabase.from("match_history").insert({
    user_id: userId,
    mode,
    team_a: teamA,
    team_b: teamB,
    played_as: playedAs,
    result,
    opponent_name: opponentName || null,
  });
  if (error) throw error;
}
