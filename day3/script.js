let notes = [
    { id: 1, text: "Buy milk and bread", category: "personal" },
    { id: 2, text: "Finish the Day 3 assignment", category: "study" },
    { id: 3, text: "Email the project report to Grace", category: "work" },
    { id: 4, text: "Revise JavaScript arrays", category: "study" },
    { id: 5, text: "Call mum", category: "personal" }
];

function searchNotes(word) {
    return notes.filter(note =>
        note.text.toLowerCase().includes(word.toLowerCase())
    );
}

console.log(searchNotes("project"));
// Expected: [{ id: 3, text: "Email the project report to Grace", category: "work" }]

console.log(searchNotes("PROJECT"));
// Expected: [{ id: 3, text: "Email the project report to Grace", category: "work" }]

console.log(searchNotes("pizza"));
// Expected: []
function longestNote() {
    return notes.reduce((longest, note) => {
        if (longest === null || note.text.length > longest.text.length) {
            return note;
        }

        return longest;
    }, null);
}
console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

let savedNotes = notes;
notes = [];

console.log(longestNote());
// Expected: null

notes = savedNotes;
function countByCategory() {
    let counts = {};

    for (let note of notes) {
        if (counts[note.category]) {
            counts[note.category]++;
        } else {
            counts[note.category] = 1;
        }
    }

    return counts;
}
console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }

let savedNotesForCount = notes;
notes = [];

console.log(countByCategory());
// Expected: {}

notes = savedNotesForCount;
function getSummary() {
    let counts = countByCategory();
    let noteLabel = notes.length === 1 ? "note" : "notes";

    return `${notes.length} ${noteLabel}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study`;
}
console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study"

let savedNotesForSummary = notes;
notes = [];

console.log(getSummary());
// Expected: "0 notes: 0 personal, 0 work, 0 study"

notes = savedNotesForSummary;
function isDuplicate(text) {
    return notes.some(note =>
        note.text.toLowerCase() === text.toLowerCase()
    );
}
console.log(isDuplicate("Buy milk and bread"));
// Expected: true

console.log(isDuplicate("BUY MILK AND BREAD"));
// Expected: true

console.log(isDuplicate("Buy eggs"));
// Expected: false
function addNote(text, category) {
    if (!text.trim()) {
        console.log("Note cannot be empty.");
        return false;
    }

    if (text.trim().length > 200) {
        console.log("Note cannot be longer than 200 characters.");
        return false;
    }

    if (isDuplicate(text)) {
        console.log("A note with this text already exists.");
        return false;
    }

    let validCategories = ["personal", "work", "study"];

    if (!validCategories.includes(category)) {
        console.log("Invalid category.");
        return false;
    }

    let nextId = notes.length > 0
        ? Math.max(...notes.map(note => note.id)) + 1
        : 1;

    let newNote = {
        id: nextId,
        text: text.trim(),
        category: category
    };

    notes.push(newNote);

    console.log("Note added successfully.");
    return true;
}
console.log(addNote("Plan weekend trip", "personal"));
// Expected: true

console.log(addNote("BUY MILK AND BREAD", "personal"));
// Expected: false

console.log(addNote("   ", "personal"));
// Expected: false

console.log(addNote("Go shopping", "random"));
// Expected: false

console.log(addNote("a".repeat(201), "personal"));
// Expected: false