const fs = require('fs');
let code = fs.readFileSync('src/main.js', 'utf8');

// Normalize history after fetching users in init
code = code.replace(
  "this.users = usersData || [];",
  "this.users = usersData || []; this.users.forEach(u => { if (!Array.isArray(u.history)) u.history = []; });"
);

// Normalize history after fetching users in login
code = code.replace(
  "app.data.users = freshUsers;",
  "freshUsers.forEach(u => { if (!Array.isArray(u.history)) u.history = []; }); app.data.users = freshUsers;"
);

// Normalize in realtime subscription INSERT/UPDATE
code = code.replace(
  "if (payload.eventType === 'INSERT') {",
  "if (payload.eventType === 'INSERT') { if (!Array.isArray(payload.new.history)) payload.new.history = [];"
);
code = code.replace(
  "} else if (payload.eventType === 'UPDATE') {",
  "} else if (payload.eventType === 'UPDATE') { if (!Array.isArray(payload.new.history)) payload.new.history = [];"
);

// Fix the push method call just in case it was missed
code = code.replace(
  "app.data.currentUser.history.push({",
  "if (!Array.isArray(app.data.currentUser.history)) app.data.currentUser.history = []; app.data.currentUser.history.push({"
);

fs.writeFileSync('src/main.js', code);
console.log('Fixed history array initialization');
