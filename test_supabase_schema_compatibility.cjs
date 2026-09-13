const assert = require('node:assert/strict');
const fs = require('node:fs');

const main = fs.readFileSync('src/main.js', 'utf8');
const teamAdapter = fs.readFileSync('src/modules/team-competition-supabase.js', 'utf8');

assert.match(
    main,
    /game_questions:\s*'id,classlevel,subject,semester,topic,type,q,options,ans,explanation,imageurl,created_at'/,
    'Question reads must use the columns that exist in the production game_questions table.'
);
assert.match(
    main,
    /game_exams:\s*'id,name,classlevel,subject,period,questions'/,
    'Exam reads must not request the missing topics column.'
);
assert.match(
    main,
    /normalizeSupabaseRow\(table, row\)/,
    'Supabase rows need a compatibility normalization boundary.'
);
assert.match(
    main,
    /normalizeSupabaseRow\(table, row\)[\s\S]*row\.imageurl[\s\S]*imageUrl/,
    'Legacy imageurl must be exposed to the gameplay renderer as imageUrl.'
);
assert.match(
    teamAdapter,
    /team_competition_members:\s*'competition_id,team_id,username,position'/,
    'Team member reads must use the composite-key schema without id.'
);
assert.doesNotMatch(
    teamAdapter,
    /team_competition_members:\s*'id,/,
    'Team member projection must not request a non-existent id column.'
);

console.log('Supabase schema compatibility contract tests passed.');
